import React, { useState } from 'react';
import { RiCloseLine, RiUserAddLine } from 'react-icons/ri';
import { useDispatch } from 'react-redux';
import { shareDocument, removeShare } from '../store/documentSlice';

const ShareModal = ({ isOpen, onClose, document }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('editor');
    const dispatch = useDispatch();

    if (!isOpen) return null;

    const handleShare = async (e) => {
        e.preventDefault();
        try {
            await dispatch(shareDocument({
                documentId: document.id,
                email,
                role
            })).unwrap();
            setEmail('');
            // Keep modal open to show success
        } catch (error) {
            console.error('Failed to share:', error);
        }
    };

    const handleRemoveShare = async (userId) => {
        try {
            await dispatch(removeShare({
                documentId: document.id,
                userId
            })).unwrap();
        } catch (error) {
            console.error('Failed to remove share:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-black opacity-30" onClick={onClose}></div>

                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Share Document</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <RiCloseLine className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleShare} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email address
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter email address"
                                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="editor">Can edit</option>
                                    <option value="viewer">Can view</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700"
                        >
                            <RiUserAddLine className="w-5 h-5" />
                            Share
                        </button>
                    </form>

                    {/* Shared Users List */}
                    {document.sharedWith?.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Shared with</h3>
                            <div className="space-y-2">
                                {document.sharedWith.map(user => (
                                    <div key={user.uid} className="flex items-center justify-between py-2">
                                        <div className="flex items-center gap-2">
                                            {user.picture ? (
                                                <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                    {user.name[0]}
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-sm font-medium">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveShare(user.uid)}
                                            className="text-red-600 hover:text-red-700 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal; 