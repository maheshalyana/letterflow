import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const token = localStorage.getItem('token');

// Configure axios base URL
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
});

// Add request interceptor to add auth token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const fetchDocuments = createAsyncThunk(
    'documents/fetchAll',
    async (_, { getState }) => {
        const response = await api.get('/api/documents');
        console.log('Fetched documents:', response.data); // Debug log

        // Ensure all documents have the required fields
        const documents = response.data.documents.map(doc => ({
            ...doc,
            owner: doc.owner || null,
            sharedWith: doc.sharedWith || []
        }));

        return documents;
    }
);

export const createDocument = createAsyncThunk(
    'documents/create',
    async (documentData) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(documentData)
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        return data.document;
    }
);

export const updateDocument = createAsyncThunk(
    'documents/updateDocument',
    async (documentData, { rejectWithValue, getState }) => {
        try {
            const { token } = getState().user;

            // Make sure we have the required fields
            if (!documentData.id) {
                throw new Error('Document ID is required');
            }

            // Prepare the request data
            const requestData = {};
            if (documentData.content !== undefined) requestData.content = documentData.content;
            if (documentData.title !== undefined) requestData.title = documentData.title;

            // Fix: Remove duplicate API_URL in the endpoint
            const response = await fetch(`${API_BASE_URL}/api/documents/${documentData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update document');
            }

            const data = await response.json();

            // Get the current document from state to preserve fields that might not be returned by the API
            const currentDocuments = getState().documents.items;
            const currentDocument = currentDocuments.find(doc => doc.id === documentData.id);

            // Merge the updated document with the current one to preserve fields
            return {
                ...currentDocument,
                ...data.document,
                owner: data.document.owner || currentDocument?.owner || null,
                sharedWith: data.document.sharedWith || currentDocument?.sharedWith || []
            };
        } catch (error) {
            console.error("Error updating document:", error);
            return rejectWithValue(error.message);
        }
    }
);

export const shareDocument = createAsyncThunk(
    'documents/share',
    async ({ documentId, email, role }) => {
        const response = await api.post(`/api/documents/${documentId}/share`, { email, role });
        return response.data;
    }
);

export const removeShare = createAsyncThunk(
    'documents/removeShare',
    async ({ documentId, userId }) => {
        await api.delete(`/api/documents/${documentId}/share/${userId}`);
        return { documentId, userId };
    }
);

export const deleteDocument = createAsyncThunk(
    'documents/deleteDocument',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/api/documents/${id}/permanent`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || 'Failed to delete document');
        }
    }
);

const documentSlice = createSlice({
    name: 'documents',
    initialState: {
        items: [],
        currentDocument: null,
        isLoading: false,
        error: null
    },
    reducers: {
        setCurrentDocument: (state, action) => {
            state.currentDocument = action.payload;
        },
        updateDocumentContent: (state, action) => {
            const { id, content } = action.payload;
            const document = state.items.find(doc => doc.id === id);
            if (document) {
                document.content = content;
                if (state.currentDocument?.id === id) {
                    state.currentDocument.content = content;
                }
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Documents
            .addCase(fetchDocuments.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchDocuments.fulfilled, (state, action) => {
                console.log('Setting documents in store:', action.payload); // Debug log
                state.isLoading = false;
                state.items = action.payload;
                state.error = null;
            })
            .addCase(fetchDocuments.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message;
            })
            // Create Document
            .addCase(createDocument.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createDocument.fulfilled, (state, action) => {
                state.isLoading = false;
                state.items.unshift(action.payload);
                state.currentDocument = action.payload;
                state.error = null;
            })
            .addCase(createDocument.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message;
            })
            // Update Document
            .addCase(updateDocument.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateDocument.fulfilled, (state, action) => {
                state.isLoading = false;
                const updatedDoc = action.payload;

                // Update the document in the items array
                const index = state.items.findIndex(doc => doc.id === updatedDoc.id);
                if (index !== -1) {
                    // Preserve sharedWith and owner if they exist in the current document
                    state.items[index] = {
                        ...updatedDoc,
                        sharedWith: updatedDoc.sharedWith || state.items[index].sharedWith || [],
                        owner: updatedDoc.owner || state.items[index].owner || null
                    };
                }

                // Update the current document if it's the same one
                if (state.currentDocument?.id === updatedDoc.id) {
                    state.currentDocument = {
                        ...updatedDoc,
                        sharedWith: updatedDoc.sharedWith || state.currentDocument.sharedWith || [],
                        owner: updatedDoc.owner || state.currentDocument.owner || null
                    };
                }

                state.error = null;
            })
            .addCase(updateDocument.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message;
            })
            .addCase(shareDocument.fulfilled, (state, action) => {
                const index = state.items.findIndex(doc => doc.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
                if (state.currentDocument?.id === action.payload.id) {
                    state.currentDocument = action.payload;
                }
            })
            .addCase(removeShare.fulfilled, (state, action) => {
                const { documentId, userId } = action.payload;
                const document = state.items.find(doc => doc.id === documentId);
                if (document) {
                    document.sharedWith = document.sharedWith.filter(
                        user => user.uid !== userId
                    );
                }
            })
            // Delete Document
            .addCase(deleteDocument.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteDocument.fulfilled, (state, action) => {
                state.isLoading = false;
                state.items = state.items.filter(doc => doc.id !== action.payload);
                if (state.currentDocument && state.currentDocument.id === action.payload) {
                    state.currentDocument = state.items.length > 0 ? state.items[0] : null;
                }
            })
            .addCase(deleteDocument.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    }
});

export const { setCurrentDocument, updateDocumentContent } = documentSlice.actions;
export default documentSlice.reducer; 