const WebSocket = require('ws');
const { parse } = require('url');
const admin = require('firebase-admin');
const { Document, User, DocumentShare } = require('./models');
const { Op } = require('sequelize');
const Y = require('yjs');
const { setupWSConnection } = require('y-websocket/bin/utils');
const { verifyToken } = require('./middleware/auth');
const { sequelize } = require('./config/database');

function setupWebSocketServer(server) {
    const wss = new WebSocket.Server({
        noServer: true,
        // Add ping/pong to detect stale connections
        clientTracking: true,
        pingInterval: 30000,
        pingTimeout: 5000
    });

    // Handle connection errors
    wss.on('error', (error) => {
        console.error('WebSocket server error:', error);
    });

    // Ping/Pong to keep connections alive
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', () => {
        clearInterval(interval);
    });

    // Track active connections by document ID
    const documentConnections = new Map();
    const documentYDocs = new Map(); // Store Y.js documents
    const documentCollaborators = new Map(); // Track active collaborators
    const handledSockets = new WeakSet(); // Track already handled sockets

    // Handle HTTP upgrade for WebSocket connections
    server.on('upgrade', async (request, socket, head) => {
        // Parse URL to get pathname and query parameters
        const { pathname, query } = parse(request.url, true);

        // Check if this is a document WebSocket connection
        if (pathname.startsWith('/documents')) {
            // Prevent handling the same socket multiple times
            if (handledSockets.has(socket)) {
                return;
            }
            handledSockets.add(socket);

            try {
                const token = query.token;
                const documentId = query.documentId;
                const userName = query.userName || 'Anonymous';
                const userColor = query.userColor || '#' + Math.floor(Math.random() * 16777215).toString(16);
                const userPicture = query.userPicture || '';
                const userId = query.userId || '';

                if (!token || !documentId) {
                    socket.destroy();
                    return;
                }

                // Verify token and document access
                const decodedToken = await admin.auth().verifyIdToken(token);
                const accessInfo = await checkDocumentAccess(documentId, decodedToken.uid);

                if (!accessInfo.hasAccess) {
                    socket.destroy();
                    return;
                }

                // Add document ID and role to request for y-websocket
                request.documentId = documentId;
                request.userRole = accessInfo.role;

                // Initialize Y.js document if not exists
                if (!documentYDocs.has(documentId)) {
                    const yDoc = new Y.Doc();
                    documentYDocs.set(documentId, yDoc);

                    // Initialize with document content from database
                    const document = await Document.findByPk(documentId);
                    if (document && document.content) {
                        const yText = yDoc.getText('content');
                        // Set the content directly - this preserves HTML formatting
                        yText.insert(0, document.content);
                    }
                }

                // Track collaborators
                if (!documentCollaborators.has(documentId)) {
                    documentCollaborators.set(documentId, new Map());
                }

                const collaborators = documentCollaborators.get(documentId);
                collaborators.set(userId, {
                    name: userName,
                    color: userColor,
                    picture: userPicture,
                    id: userId
                });

                // Broadcast updated collaborator list
                broadcastCollaborators(documentId);

                // Handle the WebSocket connection
                wss.handleUpgrade(request, socket, head, (ws) => {
                    // Track this connection
                    if (!documentConnections.has(documentId)) {
                        documentConnections.set(documentId, new Set());
                    }
                    documentConnections.get(documentId).add(ws);

                    // Add user data to the websocket object
                    ws.userRole = accessInfo.role;
                    ws.userId = decodedToken.uid;
                    ws.userName = userName;
                    ws.userColor = userColor;
                    ws.documentId = documentId;
                    ws.yDoc = documentYDocs.get(documentId);
                    ws.userPicture = userPicture;

                    // Setup Y.js connection
                    setupWSConnection(ws, request, {
                        docName: documentId,
                        gc: true
                    });

                    // Send role information to the client
                    ws.send(JSON.stringify({
                        type: 'permission',
                        role: ws.userRole
                    }));

                    // Handle connection close
                    ws.on('close', () => {
                        console.log('WebSocket closed');
                        const connections = documentConnections.get(documentId);
                        if (connections) {
                            connections.delete(ws);
                            if (connections.size === 0) {
                                documentConnections.delete(documentId);
                            }
                        }

                        // Remove collaborator
                        const collaborators = documentCollaborators.get(documentId);
                        if (collaborators && userId) {
                            collaborators.delete(userId);
                            broadcastCollaborators(documentId);
                        }
                    });
                });
            } catch (error) {
                console.error('WebSocket upgrade error:', error);
                socket.destroy();
            }
        }
    });

    // Broadcast collaborators list to all clients
    function broadcastCollaborators(documentId) {
        const connections = documentConnections.get(documentId);
        const collaborators = documentCollaborators.get(documentId);

        if (connections && collaborators) {
            const collaboratorsList = Array.from(collaborators.values());
            const message = JSON.stringify({
                type: 'collaborator-update',
                collaborators: collaboratorsList
            });

            connections.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
    }

    // Periodically save document content
    setInterval(async () => {
        for (const [documentId, connections] of documentConnections.entries()) {
            if (connections.size > 0) {
                try {
                    const yDoc = documentYDocs.get(documentId);
                    if (yDoc) {
                        const ytext = yDoc.getText('content');
                        const content = ytext.toString();

                        // Save to database if content exists
                        if (content) {
                            await Document.update(
                                { content, lastModified: new Date() },
                                { where: { id: documentId } }
                            );
                            console.log(`Auto-saved document: ${documentId}`);
                        }
                    }
                } catch (error) {
                    console.error(`Error auto-saving document ${documentId}:`, error);
                }
            }
        }
    }, 30000); // Save every 30 seconds

    return wss;
}

async function checkDocumentAccess(documentId, userId) {
    try {
        // Find document with owner and shared users
        const document = await Document.findOne({
            where: { id: documentId },
            include: [{
                model: User,
                as: 'sharedWith',
                through: { attributes: ['role'] }
            }]
        });

        if (!document) {
            console.log(`Document ${documentId} not found`);
            return { hasAccess: false };
        }

        // Check if user is the owner
        if (document.userId === userId) {
            console.log(`User ${userId} is the owner of document ${documentId}`);
            return { hasAccess: true, isOwner: true, role: 'owner' };
        }

        // Check if document is shared with the user
        const sharedUser = document.sharedWith && document.sharedWith.find(user => user.uid === userId);
        if (sharedUser) {
            const role = sharedUser.DocumentShare?.role || 'viewer';
            console.log(`Document ${documentId} is shared with user ${userId} as ${role}`);
            return { hasAccess: true, isOwner: false, role };
        }

        console.log(`User ${userId} does not have access to document ${documentId}`);
        return { hasAccess: false };
    } catch (error) {
        console.error('Error checking document access:', error);
        return { hasAccess: false };
    }
}

module.exports = { setupWebSocketServer }; 