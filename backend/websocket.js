const WebSocket = require('ws');
const { parse } = require('url');
const admin = require('firebase-admin');
const { Document, User, DocumentShare } = require('./models');
const { Op } = require('sequelize');
const Y = require('yjs');
const { setupWSConnection } = require('y-websocket/bin/utils');
const { verifyToken } = require('./middleware/auth');
const { sequelize } = require('./config/database');

async function verifyAndDecodeToken(token) {
    try {
        if (!token) {
            throw new Error('No token provided');
        }
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        console.error('Token verification error:', error);
        throw error;
    }
}

function setupWebSocketServer(server) {
    const wss = new WebSocket.Server({
        server,
        path: '/documents',
        verifyClient: async (info, cb) => {
            try {
                const url = new URL(info.req.url, 'http://localhost');
                const token = url.searchParams.get('token');
                const documentId = url.searchParams.get('documentId');

                if (!token || !documentId) {
                    cb(false, 401, 'Unauthorized');
                    return;
                }

                // Verify the token and check document access here
                // ... your verification logic ...

                cb(true);
            } catch (error) {
                console.error('WebSocket verification error:', error);
                cb(false, 500, 'Internal Server Error');
            }
        }
    });

    wss.on('connection', (ws, req) => {
        console.log('New WebSocket connection');

        const url = new URL(req.url, 'http://localhost');
        const documentId = url.searchParams.get('documentId');

        setupWSConnection(ws, req, {
            docName: documentId,
            gc: true
        });
    });

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