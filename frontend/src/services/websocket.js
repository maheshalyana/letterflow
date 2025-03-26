// This service is no longer needed as we're using Y.js
// Keep it for reference or remove it

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { WS_BASE_URL } from '../config/api';

class WebSocketService {
    constructor() {
        this.connections = new Map();
        this.docs = new Map();
        this.callbacks = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
    }

    connect(documentId, token, currentUser) {
        if (this.connections.has(documentId)) {
            return this.connections.get(documentId);
        }

        // Create WebSocket URL with query parameters
        const wsUrl = new URL('/documents', WS_BASE_URL);
        wsUrl.searchParams.append('documentId', documentId);
        wsUrl.searchParams.append('token', token); // Add the Firebase token
        wsUrl.searchParams.append('userName', currentUser.name || 'Anonymous');
        wsUrl.searchParams.append('userId', currentUser.uid);
        wsUrl.searchParams.append('userPicture', currentUser.picture || '');
        wsUrl.searchParams.append('userColor', this.getRandomColor());

        // Create WebSocket connection
        const ws = new WebSocket(wsUrl.toString());

        // Set up error handling
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.connections.delete(documentId);
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed');
            this.connections.delete(documentId);
        };

        // Store the connection
        this.connections.set(documentId, ws);
        return ws;
    }

    disconnect(documentId) {
        const ws = this.connections.get(documentId);
        if (ws) {
            ws.close();
            this.connections.delete(documentId);
        }
    }

    getYDoc(documentId) {
        if (!this.docs.has(documentId)) {
            this.docs.set(documentId, new Y.Doc());
        }
        return this.docs.get(documentId);
    }

    subscribe(type, callback) {
        if (!this.callbacks.has(type)) {
            this.callbacks.set(type, new Set());
        }
        this.callbacks.get(type).add(callback);

        return () => {
            const callbacks = this.callbacks.get(type);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this.callbacks.delete(type);
                }
            }
        };
    }

    getRandomColor() {
        const colors = [
            '#2ecc71', '#3498db', '#9b59b6', '#f1c40f', '#e67e22',
            '#e74c3c', '#1abc9c', '#34495e', '#16a085', '#27ae60'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

export default new WebSocketService(); 