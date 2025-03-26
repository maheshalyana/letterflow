// This service is no longer needed as we're using Y.js
// Keep it for reference or remove it

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { WS_BASE_URL } from '../config/api';

class WebSocketService {
    constructor() {
        this.docs = new Map();
        this.providers = new Map();
        this.callbacks = new Map();
    }

    connect(documentId, token, currentUser) {
        if (this.providers.has(documentId)) {
            return this.providers.get(documentId);
        }

        // Get or create Y.js document
        const ydoc = this.getYDoc(documentId);

        // Create WebSocket URL with query parameters
        const wsUrl = new URL('/documents', WS_BASE_URL);
        wsUrl.searchParams.append('documentId', documentId);
        wsUrl.searchParams.append('token', token);
        wsUrl.searchParams.append('userName', currentUser.name || 'Anonymous');
        wsUrl.searchParams.append('userId', currentUser.uid);
        wsUrl.searchParams.append('userPicture', currentUser.picture || '');
        wsUrl.searchParams.append('userColor', this.getRandomColor());

        try {
            // Create WebSocket provider
            const provider = new WebsocketProvider(
                WS_BASE_URL,
                documentId,
                ydoc,
                {
                    WebSocketPolyfill: WebSocket,
                    awareness: {
                        user: {
                            name: currentUser.name || 'Anonymous',
                            color: this.getRandomColor(),
                            id: currentUser.uid,
                            picture: currentUser.picture || '',
                        }
                    }
                }
            );

            // Store the provider
            this.providers.set(documentId, provider);

            // Log connection status changes
            provider.awareness.on('change', () => {
                console.log('Awareness change');
            });

            provider.ws.addEventListener('open', () => {
                console.log('WebSocket connected successfully');
            });

            provider.ws.addEventListener('error', (error) => {
                console.error('WebSocket error:', error);
            });

            provider.ws.addEventListener('close', () => {
                console.log('WebSocket connection closed');
            });

            return provider;
        } catch (error) {
            console.error('Error creating WebSocket provider:', error);
            throw error;
        }
    }

    disconnect(documentId) {
        const provider = this.providers.get(documentId);
        if (provider) {
            try {
                provider.awareness?.destroy();
                provider.ws?.close();
                provider.destroy();
                this.providers.delete(documentId);
            } catch (error) {
                console.error('Error during disconnect:', error);
            }
        }
        const doc = this.docs.get(documentId);
        if (doc) {
            try {
                doc.destroy();
                this.docs.delete(documentId);
            } catch (error) {
                console.error('Error destroying doc:', error);
            }
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