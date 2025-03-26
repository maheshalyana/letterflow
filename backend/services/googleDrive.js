const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const HTMLToDocx = require('html-to-docx');
const { Readable } = require('stream');

class GoogleDriveService {
    constructor() {
        this.oauth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    }

    // Convert HTML to DOCX buffer
    async convertHtmlToDocx(htmlContent) {
        try {
            const buffer = await HTMLToDocx(htmlContent, null, {
                table: { row: { cantSplit: true } },
                footer: false,
                pageNumber: false
            });
            return buffer;
        } catch (error) {
            console.error('Error converting HTML to DOCX:', error);
            throw error;
        }
    }

    // Convert buffer to readable stream
    bufferToStream(buffer) {
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);
        return stream;
    }

    async findOrCreateFolder(accessToken, folderName = 'letterflow') {
        try {
            this.oauth2Client.setCredentials({ access_token: accessToken });

            // Search for existing folder
            const response = await this.drive.files.list({
                q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            if (response.data.files.length > 0) {
                return response.data.files[0].id;
            }

            // Create new folder if it doesn't exist
            const fileMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder'
            };

            const folder = await this.drive.files.create({
                resource: fileMetadata,
                fields: 'id'
            });

            return folder.data.id;
        } catch (error) {
            console.error('Error finding/creating folder:', error);
            throw error;
        }
    }

    async saveDocument(htmlContent, title, accessToken) {
        try {
            this.oauth2Client.setCredentials({ access_token: accessToken });

            // Convert HTML to DOCX
            const docxBuffer = await this.convertHtmlToDocx(htmlContent);

            // Get or create the letterflow folder
            const folderId = await this.findOrCreateFolder(accessToken);

            const response = await this.drive.files.create({
                requestBody: {
                    name: `${title}.docx`,
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    parents: [folderId]
                },
                media: {
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    body: this.bufferToStream(docxBuffer)
                },
                fields: 'id, webViewLink'
            });

            return {
                fileId: response.data.id,
                webViewLink: response.data.webViewLink
            };
        } catch (error) {
            console.error('Error saving to Google Drive:', error);
            throw error;
        }
    }

    async updateDocument(fileId, htmlContent, title, accessToken) {
        try {
            this.oauth2Client.setCredentials({ access_token: accessToken });

            // Convert HTML to DOCX
            const docxBuffer = await this.convertHtmlToDocx(htmlContent);

            // Update file metadata and content
            const response = await this.drive.files.update({
                fileId: fileId,
                requestBody: {
                    name: `${title}.docx`
                },
                media: {
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    body: this.bufferToStream(docxBuffer)
                },
                fields: 'id, webViewLink'
            });

            return {
                fileId: response.data.id,
                webViewLink: response.data.webViewLink
            };
        } catch (error) {
            console.error('Error updating Google Drive file:', error);
            throw error;
        }
    }

    // Helper method to move file to a folder if needed
    async moveFileToFolder(fileId, folderId, accessToken) {
        try {
            this.oauth2Client.setCredentials({ access_token: accessToken });

            // Get the file's current parents
            const file = await this.drive.files.get({
                fileId: fileId,
                fields: 'parents'
            });

            // Remove the file from previous parents and add to new folder
            await this.drive.files.update({
                fileId: fileId,
                removeParents: file.data.parents.join(','),
                addParents: folderId,
                fields: 'id, parents'
            });
        } catch (error) {
            console.error('Error moving file to folder:', error);
            throw error;
        }
    }
}

module.exports = new GoogleDriveService();