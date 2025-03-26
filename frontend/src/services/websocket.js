// This service is no longer needed as we're using Y.js
// Keep it for reference or remove it

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { WS_BASE_URL } from '../config/api';

class WebSocketService {
    constructor() {
        this.providers = new Map();
        this.ydocs = new Map();
        this.callbacks = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
    }

    // Connect to a document's WebSocket
    connect(documentId, token, user) {
        if (this.providers.has(documentId)) {
            return this.providers.get(documentId);
        }

        // Create a new Y.js document
        const ydoc = new Y.Doc();
        this.ydocs.set(documentId, ydoc);

        // Create WebSocket URL with authentication and user info
        const url = `${WS_BASE_URL}/documents?documentId=${documentId}&token=${token}`;

        // Create WebSocket provider with proper params
        const provider = new WebsocketProvider(url, documentId, ydoc, {
            params: {
                token,
                documentId,
                userName: user.name || 'Anonymous',
                userId: user.uid || 'anonymous',
                userPicture: user.picture || '',
                userColor: this.getRandomColor()
            }
        });

        // Set up awareness (for cursor positions and user info)
        const awareness = provider.awareness;
        awareness.setLocalState({
            name: user.name || 'Anonymous',
            color: this.getRandomColor(),
            user: {
                id: user.uid || 'anonymous',
                name: user.name || 'Anonymous',
                picture: user.picture || ''
            }
        });

        // Handle messages from the server
        provider.on('message', (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type && this.callbacks.has(message.type)) {
                    this.callbacks.get(message.type).forEach(callback => callback(message));
                }
            } catch (e) {
                // Not a JSON message, likely a Y.js protocol message
            }
        });

        // Handle connection status
        provider.on('status', (status) => {
            console.log('Connection status:', status);
        });

        // Handle sync status
        provider.on('sync', (isSynced) => {
            console.log('Sync status:', isSynced ? 'synced' : 'not synced');
        });

        this.providers.set(documentId, provider);

        this.ws = new WebSocket(url);

        this.ws.onclose = () => {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => {
                    this.reconnectAttempts++;
                    this.connect(documentId, token, user);
                }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onopen = () => {
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
        };

        return provider;
    }

    // Disconnect from a document's WebSocket
    disconnect(documentId) {
        const provider = this.providers.get(documentId);
        if (provider) {
            provider.disconnect();
            this.providers.delete(documentId);

            const ydoc = this.ydocs.get(documentId);
            if (ydoc) {
                ydoc.destroy();
                this.ydocs.delete(documentId);
            }
        }
    }

    // Get a Y.js document
    getYDoc(documentId) {
        return this.ydocs.get(documentId);
    }

    // Subscribe to a message type
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

    // Generate a random color for user cursors
    getRandomColor() {
        const colors = [
            '#f44336', '#e91e63', '#9c27b0', '#673ab7',
            '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
            '#009688', '#4caf50', '#8bc34a', '#cddc39',
            '#ffc107', '#ff9800', '#ff5722'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

export default new WebSocketService(); 