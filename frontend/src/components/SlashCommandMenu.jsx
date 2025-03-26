import React from 'react';
import { RiH1, RiH2, RiText, RiListUnordered, RiListOrdered, RiDoubleQuotesR } from 'react-icons/ri';

const MENU_ITEMS = [
    {
        title: 'Heading 1',
        description: 'Big section heading',
        icon: <RiH1 className="w-5 h-5" />,
        command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
        title: 'Heading 2',
        description: 'Medium section heading',
        icon: <RiH2 className="w-5 h-5" />,
        command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
        title: 'Text',
        description: 'Just start writing with plain text',
        icon: <RiText className="w-5 h-5" />,
        command: (editor) => editor.chain().focus().setParagraph().run(),
    },
    {
        title: 'Bullet List',
        description: 'Create a simple bullet list',
        icon: <RiListUnordered className="w-5 h-5" />,
        command: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
        title: 'Numbered List',
        description: 'Create a numbered list',
        icon: <RiListOrdered className="w-5 h-5" />,
        command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
        title: 'Quote',
        description: 'Capture a quote',
        icon: <RiDoubleQuotesR className="w-5 h-5" />,
        command: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
];

const SlashCommandMenu = ({ editor, isOpen, setIsOpen, position }) => {
    if (!isOpen) return null;

    return (
        <div
            className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-72 overflow-hidden"
            style={{
                top: position.top + 24,
                left: position.left,
            }}
        >
            <div className="p-2">
                {MENU_ITEMS.map((item, index) => (
                    <button
                        key={index}
                        className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded text-left"
                        onClick={() => {
                            item.command(editor);
                            setIsOpen(false);
                        }}
                    >
                        <div className="text-gray-600">{item.icon}</div>
                        <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-gray-500">{item.description}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SlashCommandMenu; 