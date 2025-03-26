import React, { useState, useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from '@tiptap/extension-placeholder';
import {
    RiBold, RiItalic, RiUnderline, RiLinkM, RiH1, RiH2, RiText,
    RiListUnordered, RiListOrdered, RiDoubleQuotesR
} from 'react-icons/ri';
import SlashCommandMenu from './SlashCommandMenu';
import { useSelector } from 'react-redux';
import { debounce } from '../utils/helpers';

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
    const { currentUser } = useSelector(state => state.user);
    const [isSlashMenuOpen, setIsSlashMenuOpen] = useState(false);
    const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });

    // Create debounced save function
    const debouncedContentChange = useRef(
        debounce((content) => {
            console.log("Saving content:", content.substring(0, 30) + "...");
            onContentChange(content);
        }, 1000)
    ).current;

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
                placeholder: 'Type "/" for commands or start typing...',
                emptyEditorClass: 'is-editor-empty',
            }),
        ],
        content: currentDocument?.content || '',
        onUpdate: ({ editor }) => {
            const content = editor.getHTML();
            console.log("Content changed:", content.substring(0, 50) + "...");
            if (content !== currentDocument?.content) {
                console.log("Saving content to backend for document:", currentDocument?.id);
                debouncedContentChange(content);
            }
        },
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
    }, [currentDocument?.id]);

    // Update editor content when document changes
    useEffect(() => {
        if (editor && currentDocument) {
            editor.commands.setContent(currentDocument.content || '');
        }
    }, [editor, currentDocument]);

    if (!editor) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="sticky top-14 bg-white border-b z-20">
                <div className="px-4 py-1">
                    <div className="flex items-center gap-1">
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
                </div>
            </div>

            <div className="py-4">
                <div className="max-w-3xl mx-auto px-8">
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