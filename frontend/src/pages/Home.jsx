import React, { useState, useEffect, useRef } from 'react';
import DocumentList from '../components/DocumentList';
import TextEditor from '../components/TextEditor';
import {
    RiMenuLine, RiCloseLine, RiSearchLine, RiAddLine,
    RiHistoryLine, RiShareLine, RiMoreLine, RiSaveLine, RiDriveFill
} from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import { createDocument, updateDocument, fetchDocuments, setCurrentDocument } from '../store/documentSlice';
import { clearUser } from '../store/userSlice';
import { formatDistanceToNow } from 'date-fns';
import googleDriveService from '../services/googleDrive';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DocumentHeader from '../components/DocumentHeader';
import websocketService from '../services/websocket';
import { useParams } from 'react-router-dom';

const Home = () => {
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const menuRef = useRef(null);
    const dispatch = useDispatch();
    const { currentUser } = useSelector(state => state.user);
    const updateTimeout = useRef(null);
    const [collaborators, setCollaborators] = useState([]);
    const { id } = useParams();
    const { items: documents, currentDocument } = useSelector(state => state.documents);

    // Fetch documents on mount
    useEffect(() => {
        dispatch(fetchDocuments());
    }, [dispatch]);

    // Set current document when id changes or documents load
    useEffect(() => {
        if (documents.length > 0) {
            if (id) {
                const document = documents.find(doc => doc.id === id);
                if (document) {
                    dispatch(setCurrentDocument(document));
                }
            } else {
                // If no id, set first document as current
                dispatch(setCurrentDocument(documents[0]));
            }
        }
    }, [id, documents]);

    const handleSelectDocument = (doc) => {
        dispatch(setCurrentDocument(doc));
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    const handleContentChange = (content) => {
        if (currentDocument) {
            console.log("Content change detected in Home component for document:", currentDocument.id);
            dispatch(updateDocument({
                id: currentDocument.id,
                content
            }));
        }
    };

    // Close sidebar on mobile when document is selected
    useEffect(() => {
        if (selectedDocument && window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, [selectedDocument]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (updateTimeout.current) {
                clearTimeout(updateTimeout.current);
            }
        };
    }, []);

    useEffect(() => {
        if (selectedDocument) {
            // Subscribe to collaborator updates
            websocketService.subscribe('collaborator-update', (data) => {
                setCollaborators(data.collaborators);
            });
        }
    }, [selectedDocument]);



    if (!currentDocument) return null;

    return (
        <div className="h-screen flex bg-gray-50">
            <ToastContainer position="top-right" autoClose={3000} />
            {/* Sidebar - Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-20 transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <div
                className={`fixed md:relative inset-y-0 left-0 z-30 w-[280px] bg-white border-r shadow-lg md:shadow-none 
                    transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:translate-x-0 md:w-80`}
            >
                <div className="h-full flex flex-col">
                    {/* Fixed Header */}
                    <div className="flex-shrink-0 border-b bg-white p-4">
                        {/* Search Bar */}
                        <div className="relative">
                            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Scrollable Document List */}
                    <div className="flex-1 overflow-hidden">
                        <DocumentList
                            documents={documents}
                            onSelectDocument={handleSelectDocument}
                            searchQuery={searchQuery}
                            selectedDocument={currentDocument}
                        />
                    </div>

                    {/* Fixed Footer with User Info */}
                    <div className="flex-shrink-0 border-t bg-white p-4">
                        <div className="flex items-center gap-3">
                            {currentUser?.picture ? (
                                <img
                                    src={currentUser.picture}
                                    alt={currentUser.name}
                                    className="w-8 h-8 rounded-full"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    {currentUser?.name?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h2 className="font-medium truncate">{currentUser?.name}</h2>
                                <p className="text-sm text-gray-500 truncate">{currentUser?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 relative w-0 md:w-auto">
                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`md:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 
                        transition-transform duration-300 ${isSidebarOpen ? 'translate-x-[280px]' : 'translate-x-0'}`}
                >
                    {isSidebarOpen ? (
                        <RiCloseLine className="w-6 h-6" />
                    ) : (
                        <RiMenuLine className="w-6 h-6" />
                    )}
                </button>

                {currentDocument && (
                    <>
                        <DocumentHeader
                            document={currentDocument}
                            collaborators={[
                                ...(currentDocument.owner ? [currentDocument.owner] : []),
                                ...(currentDocument.sharedWith || [])
                            ]}
                        />
                        <TextEditor
                            key={currentDocument.id}
                            currentDocument={currentDocument}
                            onContentChange={handleContentChange}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default Home;