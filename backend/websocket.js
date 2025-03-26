const WebSocket = require('ws');
const { parse } = require('url');
const admin = require('firebase-admin');
const { Document, User } = require('./models');
const { setupWSConnection } = require('y-websocket/bin/utils');
const { verifyToken } = require('./middleware/auth');

function setupWebSocketServer(server) {
    const wss = new WebSocket.Server({ noServer: true });

    // Track active connections by document ID
    const documentConnections = new Map();
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

                if (!token || !documentId) {
                    socket.destroy();
                    return;
                }

                // Verify token and document access
                const decodedToken = await admin.auth().verifyIdToken(token);
                const hasAccess = await checkDocumentAccess(documentId, decodedToken.uid);

                if (!hasAccess) {
                    socket.destroy();
                    return;
                }

                // Add document ID to request for y-websocket
                request.documentId = documentId;

                // Handle the WebSocket connection
                wss.handleUpgrade(request, socket, head, (ws) => {
                    // Track this connection
                    if (!documentConnections.has(documentId)) {
                        documentConnections.set(documentId, new Set());
                    }
                    documentConnections.get(documentId).add(ws);

                    // Setup Y.js connection
                    setupWSConnection(ws, request);

                    // Handle connection close
                    ws.on('close', () => {
                        const connections = documentConnections.get(documentId);
                        if (connections) {
                            connections.delete(ws);
                            if (connections.size === 0) {
                                documentConnections.delete(documentId);
                            }
                        }
                    });
                });
            } catch (error) {
                console.error('WebSocket connection error:', error);
                socket.destroy();
            }
        }
    });

    // Periodically save document content
    setInterval(async () => {
        for (const [documentId, connections] of documentConnections.entries()) {
            if (connections.size > 0) {
                try {
                    // Get the document content from the first connection
                    const ws = connections.values().next().value;
                    if (ws.yDoc) {
                        const ytext = ws.yDoc.getText('content');
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

async function checkDocumentAccess(documentId, uid) {
    try {
        const document = await Document.findOne({
            where: { id: documentId },
            include: [{
                model: User,
                as: 'sharedWith',
                through: { attributes: ['role'] }
            }]
        });

        if (!document) return false;
        if (document.userId === uid) return true;

        const share = document.sharedWith.find(user => user.uid === uid);
        return share && share.DocumentShare.role === 'editor';
    } catch (error) {
        console.error('Error checking document access:', error);
        return false;
    }
}

module.exports = { setupWebSocketServer }; 