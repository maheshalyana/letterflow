import React, { useState, useEffect, useRef } from 'react';
import DocumentList from '../components/DocumentList';
import TextEditor from '../components/TextEditor';
import {
    RiMenuLine, RiCloseLine, RiSearchLine, RiAddLine,
    RiHistoryLine, RiShareLine, RiMoreLine, RiSaveLine, RiDriveFill,
    RiLogoutBoxLine
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
import { useParams, useNavigate } from 'react-router-dom';

const Home = () => {
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const menuRef = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentUser } = useSelector(state => state.user);
    const updateTimeout = useRef(null);
    const [collaborators, setCollaborators] = useState([]);
    const { id } = useParams();
    const { items: documents, currentDocument } = useSelector(state => state.documents);

    const handleLogout = () => {
        dispatch(clearUser());
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Fetch documents on mount
    useEffect(() => {
        dispatch(fetchDocuments());
        console.log('Documents:', documents);
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

    const handleSaveToDrive = async () => {
        if (!currentDocument?.id) return;

        try {
            setIsMenuOpen(false);
            const result = await googleDriveService.saveDocument(currentDocument.id);
            toast.success('Document saved to Google Drive!');
            console.log('Saved to Drive:', result);
        } catch (error) {
            console.error('Error saving to Drive:', error);
            toast.error('Failed to save to Google Drive');
        }
    };

    // Create a new document function
    const handleCreateNewDocument = () => {
        dispatch(createDocument({ title: 'Untitled', content: '' }))
            .unwrap()
            .then((newDoc) => {
                dispatch(setCurrentDocument(newDoc));
                toast.success('New document created!');
            })
            .catch((error) => {
                toast.error(`Failed to create document: ${error}`);
            });
    };

    // Check if documents are loaded but empty
    const noDocuments = Array.isArray(documents) && documents.length === 0;

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
                    {/* Logo */}
                    <div className="flex-shrink-0 p-4 border-b">
                        <div className="flex items-center justify-start">
                            <span className="ml-2 text-xl font-bold text-gray-800">LetterFlow</span>
                        </div>
                    </div>

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
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                title="Logout"
                            >
                                <RiLogoutBoxLine className="w-5 h-5" />
                            </button>
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

                {noDocuments ? (
                    // Welcome screen when no documents exist
                    <div className="h-full flex flex-col items-center justify-center p-8">
                        <div className="max-w-md text-center">
                            <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to LetterFlow!</h1>
                            <p className="text-gray-600 mb-8">
                                Get started by creating your first document. You can write, edit, and collaborate in real-time.
                            </p>
                            <button
                                onClick={handleCreateNewDocument}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                            >
                                <RiAddLine className="w-5 h-5" />
                                <span>Create Your First Document</span>
                            </button>
                        </div>
                    </div>
                ) : currentDocument ? (
                    // Show document if one is selected
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
                ) : (
                    // Loading state
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;