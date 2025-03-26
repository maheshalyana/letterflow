import React, { useEffect, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDocuments, createDocument, deleteDocument } from '../store/documentSlice';
import { RiFileAddLine, RiFileTextLine, RiTimeLine, RiDeleteBin6Line } from 'react-icons/ri';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';

const DocumentList = memo(({ onSelectDocument, searchQuery, selectedDocument }) => {
    const dispatch = useDispatch();
    const { items: documents, isLoading, error } = useSelector(state => state.documents);

    // Filter documents based on search query with additional safety checks
    const filteredDocuments = Array.isArray(documents)
        ? documents.filter(doc => {
            // Check if doc and doc.title exist before calling toLowerCase
            return doc && typeof doc.title === 'string' &&
                doc.title.toLowerCase().includes((searchQuery || '').toLowerCase());
        })
        : [];

    const handleDocumentClick = (doc) => {
        if (selectedDocument?.id !== doc.id) {
            onSelectDocument(doc);
        }
    };

    const handleCreateDocument = () => {
        dispatch(createDocument({ title: 'Untitled', content: '' }))
            .unwrap()
            .then(result => {
                if (result.payload) {
                    onSelectDocument(result.payload);
                    toast.success('New document created!');
                }
            })
            .catch(error => {
                toast.error(`Failed to create document: ${error}`);
            });
    };

    const handleDeleteDocument = (e, docId) => {
        e.stopPropagation(); // Prevent document selection

        if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            dispatch(deleteDocument(docId))
                .unwrap()
                .then(() => {
                    toast.success('Document deleted successfully');
                })
                .catch((error) => {
                    toast.error(`Failed to delete document: ${error}`);
                });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-600 p-4">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-white">
                <button
                    onClick={handleCreateDocument}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full justify-center"
                >
                    <RiFileAddLine className="w-5 h-5" />
                    <span>New Document</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filteredDocuments.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        {searchQuery ? (
                            <>
                                <p>No documents found matching "{searchQuery}"</p>
                                <p className="text-sm mt-2">Try a different search term</p>
                            </>
                        ) : (
                            <>
                                <p>No documents yet</p>
                                <p className="text-sm mt-2">Create your first document to get started</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2 p-4">
                        {filteredDocuments.map(doc => (
                            <div
                                key={doc.id || Math.random()}
                                className={`w-full text-left p-4 rounded-lg transition-colors border ${selectedDocument?.id === doc.id
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-white hover:bg-gray-50 border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleDocumentClick(doc)}
                                        className="flex-1 flex items-center gap-3 text-left"
                                    >
                                        <RiFileTextLine className={`w-5 h-5 ${selectedDocument?.id === doc.id ? 'text-blue-500' : 'text-gray-400'
                                            }`} />
                                        <div className="flex-1">
                                            <h3 className={`font-medium ${selectedDocument?.id === doc.id ? 'text-blue-700' : 'text-gray-900'
                                                }`}>
                                                {doc.title || 'Untitled'}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                                <RiTimeLine className="w-4 h-4" />
                                                <span>
                                                    {doc.lastModified
                                                        ? formatDistanceToNow(new Date(doc.lastModified), { addSuffix: true })
                                                        : 'Just now'}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteDocument(e, doc.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                        title="Delete document"
                                    >
                                        <RiDeleteBin6Line className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

DocumentList.displayName = 'DocumentList';

export default DocumentList; 