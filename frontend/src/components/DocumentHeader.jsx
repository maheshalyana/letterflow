import React, { useState, useEffect } from 'react';
import { RiUserLine, RiShareLine, RiDeleteBin6Line } from 'react-icons/ri';
import ShareModal from './ShareModal';
import { useDispatch, useSelector } from 'react-redux';
import { updateDocument, deleteDocument } from '../store/documentSlice';
import websocketService from '../services/websocket';
import { toast } from 'react-toastify';
import ProfileImage from './ProfileImage';

const DocumentHeader = ({ document }) => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [collaborators, setCollaborators] = useState([]);
    const dispatch = useDispatch();
    const { currentUser } = useSelector(state => state.user);

    // Check if current user is the owner
    const isOwner = document?.userId === currentUser?.uid;

    // Check if current user has edit permission
    const userShare = document?.sharedWith?.find(user => user.uid === currentUser?.uid);
    const canEdit = isOwner || userShare?.DocumentShare?.role === 'editor';

    // Handle document title change
    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        if (document?.id && canEdit) {
            dispatch(updateDocument({
                id: document.id,
                title: newTitle
            }));
        }
    };

    // Handle document deletion
    const handleDeleteDocument = () => {
        if (document?.id && isOwner) {
            if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
                dispatch(deleteDocument(document.id))
                    .unwrap()
                    .then(() => {
                        toast.success('Document deleted successfully');
                    })
                    .catch((error) => {
                        toast.error(`Failed to delete document: ${error}`);
                    });
            }
        }
    };

    // Subscribe to collaborator updates
    useEffect(() => {
        if (document?.id) {
            const unsubscribe = websocketService.subscribe('collaborator-update', (data) => {
                if (data.collaborators) {
                    setCollaborators(data.collaborators);
                }
            });

            return () => {
                if (unsubscribe) unsubscribe();
            };
        }
    }, [document?.id]);

    // Combine owner and shared users with active collaborators
    const allUsers = [
        ...(document?.owner ? [document.owner] : []),
        ...(document?.sharedWith || [])
    ];

    // Filter out duplicates by user ID
    const uniqueUsers = allUsers.filter((user, index, self) =>
        index === self.findIndex((u) => u.uid === user.uid)
    );

    return (
        <div className="flex items-center justify-between px-4 h-14 border-b">
            <input
                type="text"
                value={document?.title || ''}
                onChange={handleTitleChange}
                className={`text-xl font-medium bg-transparent border-none focus:outline-none ${!canEdit ? 'cursor-not-allowed' : ''}`}
                placeholder="Untitled"
                readOnly={!canEdit}
            />

            <div className="flex items-center space-x-4">
                {/* Collaborators */}
                <div className="flex items-center -space-x-2">
                    {uniqueUsers.map(user => {
                        // Check if user is active
                        const isActive = collaborators.some(c => c.id === user.uid);

                        return (
                            <div
                                key={user.uid}
                                className="relative group"
                            >
                                <ProfileImage
                                    user={user}
                                    size={8}
                                    showActiveStatus={true}
                                    isActive={isActive}
                                />
                                <div className="absolute top-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                    {user.name} {isActive ? '(active)' : ''}
                                    {user.uid === document?.userId ? ' (owner)' : ''}
                                    {user.DocumentShare?.role ? ` (${user.DocumentShare.role})` : ''}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Delete Button - Only show for owner */}
                {isOwner && (
                    <button
                        onClick={handleDeleteDocument}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                        title="Delete document"
                    >
                        <RiDeleteBin6Line className="w-4 h-4" />
                        Delete
                    </button>
                )}

                {/* Share Button - Only show for owner */}
                {isOwner && (
                    <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        <RiShareLine className="w-4 h-4" />
                        Share
                    </button>
                )}
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