import React, { useEffect, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDocuments, createDocument } from '../store/documentSlice';
import { RiFileAddLine, RiFileTextLine, RiTimeLine } from 'react-icons/ri';
import { formatDistanceToNow } from 'date-fns';

const DocumentList = memo(({ onSelectDocument, searchQuery, selectedDocument }) => {
    const dispatch = useDispatch();
    const { items: documents, isLoading, error } = useSelector(state => state.documents);

    useEffect(() => {
        dispatch(fetchDocuments());
    }, [dispatch]);

    // Filter documents based on search query
    const filteredDocuments = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDocumentClick = (doc) => {
        if (selectedDocument?.id !== doc.id) {
            onSelectDocument(doc);
        }
    };

    const handleCreateDocument = () => {
        dispatch(createDocument({ title: 'Untitled', content: '' }))
            .then(result => {
                if (result.payload) {
                    onSelectDocument(result.payload);
                }
            });
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
                            <button
                                key={doc.id}
                                onClick={() => handleDocumentClick(doc)}
                                className={`w-full text-left p-4 rounded-lg transition-colors border ${selectedDocument?.id === doc.id
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-white hover:bg-gray-50 border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <RiFileTextLine className={`w-5 h-5 ${selectedDocument?.id === doc.id ? 'text-blue-500' : 'text-gray-400'
                                        }`} />
                                    <div className="flex-1">
                                        <h3 className={`font-medium ${selectedDocument?.id === doc.id ? 'text-blue-700' : 'text-gray-900'
                                            }`}>
                                            {doc.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                            <RiTimeLine className="w-4 h-4" />
                                            <span>
                                                {formatDistanceToNow(new Date(doc.lastModified), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

DocumentList.displayName = 'DocumentList';

export default DocumentList; 