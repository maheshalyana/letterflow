import React, { useState, useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from '@tiptap/extension-placeholder';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import {
    RiBold, RiItalic, RiUnderline, RiLinkM, RiH1, RiH2, RiText,
    RiListUnordered, RiListOrdered, RiDoubleQuotesR, RiDriveFill
} from 'react-icons/ri';
import SlashCommandMenu from './SlashCommandMenu';
import { useSelector } from 'react-redux';
import { debounce } from '../utils/helpers';
import websocketService from '../services/websocket';
import googleDriveService from '../services/googleDrive';
import { toast } from 'react-toastify';

const MenuButton = ({ isActive, onClick, children, tooltip }) => (
    <button
        onClick={onClick}
        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
        title={tooltip}
    >
        {children}
    </button>
);

const TextEditor = ({ onContentChange, currentDocument }) => {
    // Guard clause - if no document is provided, don't try to render the editor
    if (!currentDocument) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const { currentUser, token } = useSelector(state => state.user);

    // Check if current user is the owner
    const isOwner = currentDocument?.userId === currentUser?.uid;

    // Check if current user has edit permission
    const userShare = currentDocument?.sharedWith?.find(user => user.uid === currentUser?.uid);
    console.log('User share:', userShare, currentDocument);
    const canEdit = isOwner || userShare?.DocumentShare?.role === 'editor';

    const [isSlashMenuOpen, setIsSlashMenuOpen] = useState(false);
    const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
    const [provider, setProvider] = useState(null);
    const [ydoc, setYdoc] = useState(null);
    const [isCollaborationReady, setIsCollaborationReady] = useState(false);
    const [isSavingToDrive, setIsSavingToDrive] = useState(false);

    // Create debounced save function
    const debouncedContentChange = useRef(
        debounce((content) => {
            onContentChange(content);
        }, 1000)
    ).current;

    // Handle save to Google Drive
    const handleSaveToDrive = async () => {
        if (!currentDocument?.id) return;

        try {
            setIsSavingToDrive(true);
            const result = await googleDriveService.saveDocument(currentDocument.id);
            toast.success('Document saved to Google Drive!');
            console.log('Saved to Drive:', result);
        } catch (error) {
            console.error('Error saving to Drive:', error);
            toast.error('Failed to save to Google Drive');
        } finally {
            setIsSavingToDrive(false);
        }
    };

    // Initialize Y.js document and provider
    useEffect(() => {
        if (currentDocument?.id && currentUser && token) {
            try {
                const provider = websocketService.connect(
                    currentDocument.id,
                    token,
                    currentUser
                );

                const newYdoc = websocketService.getYDoc(currentDocument.id);

                // Set initial content in Y.js document if it's empty
                const ytext = newYdoc.getText('content');
                if (ytext.toString() === '' && currentDocument.content) {
                    ytext.insert(0, currentDocument.content);
                }

                // Handle WebSocket events
                provider.ws.addEventListener('open', () => {
                    console.log('WebSocket connected');
                    setProvider(provider);
                    setYdoc(newYdoc);
                    setIsCollaborationReady(true);
                });

                provider.ws.addEventListener('error', (error) => {
                    console.error('WebSocket error:', error);
                    toast.error('Connection error. Please try refreshing the page.');
                });

                provider.ws.addEventListener('close', () => {
                    console.log('WebSocket disconnected');
                    setIsCollaborationReady(false);
                });

                return () => {
                    if (currentDocument?.id) {
                        websocketService.disconnect(currentDocument.id);
                        setIsCollaborationReady(false);
                        setProvider(null);
                        setYdoc(null);
                    }
                };
            } catch (error) {
                console.error('Error setting up collaboration:', error);
                toast.error('Failed to initialize collaboration');
            }
        }
    }, [currentDocument?.id, currentUser, token]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2] }
            }),
            Bold,
            Italic,
            Link.configure({ openOnClick: false }),
            Underline,
            Placeholder.configure({
                placeholder: 'Start typing or use "/" for commands...',
            }),
            // Only add collaboration extensions if ydoc is available
            ...(ydoc ? [
                Collaboration.configure({
                    document: ydoc,
                }),
                CollaborationCursor.configure({
                    provider,
                    user: {
                        name: currentUser?.name || 'Anonymous',
                        color: websocketService.getRandomColor(),
                        id: currentUser?.uid,
                        picture: currentUser?.picture || '',
                    },
                })
            ] : []),
        ],
        content: currentDocument.content || '',
        onUpdate: ({ editor }) => {
            if (canEdit) {
                const html = editor.getHTML();
                debouncedContentChange(html);
            }
        },
        editable: canEdit,
        onKeyDown: ({ event }) => {
            if (event.key === '/' && !isSlashMenuOpen) {
                const { view } = editor;
                const { state } = view;
                const { selection } = state;
                const { $from } = selection;

                const pos = view.coordsAtPos($from.pos);
                setSlashMenuPosition({
                    top: pos.top,
                    left: pos.left,
                });
                setIsSlashMenuOpen(true);
            }
        },
    }, [provider, ydoc, currentDocument?.id, canEdit]);

    // Update editor content when document changes and we're not using collaboration
    useEffect(() => {
        if (editor && currentDocument && !ydoc && !isCollaborationReady) {
            editor.commands.setContent(currentDocument.content || '');
        }
    }, [editor, currentDocument, ydoc, isCollaborationReady]);

    if (!editor) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="border-b">
                <div className="max-w-3xl mx-auto">
                    {canEdit ? (
                        <div className="flex items-center justify-between p-2">
                            <div className="flex items-center space-x-1">
                                <MenuButton
                                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                    isActive={editor.isActive('heading', { level: 1 })}
                                    tooltip="Heading 1"
                                >
                                    <RiH1 className="w-4 h-4" />
                                </MenuButton>

                                <MenuButton
                                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                    isActive={editor.isActive('heading', { level: 2 })}
                                    tooltip="Heading 2"
                                >
                                    <RiH2 className="w-4 h-4" />
                                </MenuButton>

                                <MenuButton
                                    onClick={() => editor.chain().focus().setParagraph().run()}
                                    isActive={editor.isActive('paragraph')}
                                    tooltip="Text"
                                >
                                    <RiText className="w-4 h-4" />
                                </MenuButton>

                                <div className="w-px h-5 bg-gray-200 mx-1" />

                                <MenuButton
                                    onClick={() => editor.chain().focus().toggleBold().run()}
                                    isActive={editor.isActive('bold')}
                                    tooltip="Bold"
                                >
                                    <RiBold className="w-4 h-4" />
                                </MenuButton>

                                <MenuButton
                                    onClick={() => editor.chain().focus().toggleItalic().run()}
                                    isActive={editor.isActive('italic')}
                                    tooltip="Italic"
                                >
                                    <RiItalic className="w-4 h-4" />
                                </MenuButton>

                                <MenuButton
                                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                                    isActive={editor.isActive('underline')}
                                    tooltip="Underline"
                                >
                                    <RiUnderline className="w-4 h-4" />
                                </MenuButton>

                                <div className="w-px h-5 bg-gray-200 mx-1" />

                                <MenuButton
                                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                                    isActive={editor.isActive('bulletList')}
                                    tooltip="Bullet List"
                                >
                                    <RiListUnordered className="w-4 h-4" />
                                </MenuButton>

                                <MenuButton
                                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                    isActive={editor.isActive('orderedList')}
                                    tooltip="Numbered List"
                                >
                                    <RiListOrdered className="w-4 h-4" />
                                </MenuButton>

                                <MenuButton
                                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                    isActive={editor.isActive('blockquote')}
                                    tooltip="Quote"
                                >
                                    <RiDoubleQuotesR className="w-4 h-4" />
                                </MenuButton>

                                <div className="w-px h-5 bg-gray-200 mx-1" />

                                <MenuButton
                                    onClick={() => {
                                        const url = window.prompt('Enter URL:');
                                        if (url) {
                                            editor.chain().focus().setLink({ href: url }).run();
                                        }
                                    }}
                                    isActive={editor.isActive('link')}
                                    tooltip="Add Link"
                                >
                                    <RiLinkM className="w-4 h-4" />
                                </MenuButton>
                            </div>

                            {/* Save to Drive Button */}
                            <button
                                onClick={handleSaveToDrive}
                                disabled={isSavingToDrive}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Save to Google Drive"
                            >
                                {isSavingToDrive ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <RiDriveFill className="w-4 h-4" />
                                        <span>Save to Drive</span>
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="p-2 bg-gray-100 text-gray-700 text-sm">
                            You are viewing this document in read-only mode
                        </div>
                    )}
                </div>
            </div>

            <div className="py-4">
                <div className="max-w-3xl mx-auto px-8 shadow-md rounded-lg py-2">
                    <EditorContent
                        editor={editor}
                        className="min-h-[calc(100vh-8rem)] prose prose-lg max-w-none"
                    />
                    <SlashCommandMenu
                        editor={editor}
                        isOpen={isSlashMenuOpen}
                        setIsOpen={setIsSlashMenuOpen}
                        position={slashMenuPosition}
                    />
                </div>
            </div>
        </div>
    );
};

export default TextEditor;