import { api } from '../utils/api';

class GoogleDriveService {
    constructor() {
        this.tokenClient = null;
        this.accessToken = null;
    }

    async initialize() {
        await this.loadGoogleAPI();
        this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: "798221185843-1717cf2imhnmite87j4ohl5nfq52k74d.apps.googleusercontent.com",
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: (response) => {
                this.accessToken = response.access_token;
            },
            prompt: 'consent',
            auto_select: false
        });
    }

    async loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    async getAccessToken() {
        if (!this.tokenClient) {
            await this.initialize();
        }
        return new Promise((resolve) => {
            this.tokenClient.callback = (response) => {
                this.accessToken = response.access_token;
                resolve(response.access_token);
            };
            this.tokenClient.requestAccessToken();
        });
    }

    async saveDocument(documentId) {
        try {
            const accessToken = await this.getAccessToken();
            const response = await api.post(`/api/documents/${documentId}/save-to-drive`, {
                accessToken
            });
            return response.data;
        } catch (error) {
            console.error('Error saving to Google Drive:', error);
            throw error;
        }
    }
}

export default new GoogleDriveService(); 