// This service is no longer needed as we're using Y.js
// Keep it for reference or remove it

class WebSocketService {
    constructor() {
        this.ws = null;
        this.subscribers = new Map();
    }

    connect(documentId, token) {
        this.ws = new WebSocket(`ws://localhost:3003?documentId=${documentId}&token=${token}`);

        this.ws.onopen = () => {
            console.log('WebSocket Connected');
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const subscribers = this.subscribers.get(data.type) || [];
            subscribers.forEach(callback => callback(data));
        };

        this.ws.onclose = () => {
            console.log('WebSocket Disconnected');
            // Try to reconnect after 3 seconds
            setTimeout(() => this.connect(documentId, token), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };
    }

    subscribe(type, callback) {
        if (!this.subscribers.has(type)) {
            this.subscribers.set(type, []);
        }
        this.subscribers.get(type).push(callback);
    }

    unsubscribe(type, callback) {
        const subscribers = this.subscribers.get(type);
        if (subscribers) {
            const index = subscribers.indexOf(callback);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
        }
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

export default new WebSocketService(); 