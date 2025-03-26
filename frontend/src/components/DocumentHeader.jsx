import React, { useState } from 'react';
import { RiUserLine, RiShareLine } from 'react-icons/ri';
import ShareModal from './ShareModal';
import { useDispatch } from 'react-redux';
import { updateDocument } from '../store/documentSlice';

// Handle document title change
const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    if (selectedDocument?.id) {
        setSelectedDocument({ ...selectedDocument, title: newTitle });
        dispatch(updateDocument({
            id: selectedDocument.id,
            title: newTitle,
            content: selectedDocument.content
        }));
    }
};

const DocumentHeader = ({ document, collaborators }) => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const dispatch = useDispatch();

    return (
        <div className="flex items-center justify-between px-4 h-14 border-b">
            <input
                type="text"
                value={document.title}
                onChange={handleTitleChange}
                className="text-xl font-medium bg-transparent border-none focus:outline-none"
                placeholder="Untitled"
            />

            <div className="flex items-center space-x-4">
                {/* Collaborators */}
                <div className="flex items-center -space-x-2">
                    {collaborators.map(user => (
                        <div
                            key={user.uid}
                            className="relative group"
                        >
                            {user.picture ? (
                                <img
                                    src={user.picture}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full border-2 border-white"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white border-2 border-white">
                                    {user.name[0]}
                                </div>
                            )}
                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                {user.name}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Share Button */}
                <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                    <RiShareLine className="w-4 h-4" />
                    Share
                </button>
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                document={document}
            />
        </div>
    );
};

export default DocumentHeader; 