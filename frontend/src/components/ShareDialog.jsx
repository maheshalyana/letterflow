import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { shareDocument, removeShare } from '../store/documentSlice';
import { RiCloseLine, RiUserAddLine, RiDeleteBinLine } from 'react-icons/ri';

const ShareDialog = ({ document, onClose }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('viewer');
    const dispatch = useDispatch();

    const handleShare = async (e) => {
        e.preventDefault();
        try {
            await dispatch(shareDocument({
                id: document.id,
                email,
                role
            })).unwrap();
            setEmail('');
        } catch (error) {
            console.error('Failed to share document:', error);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-medium">Share Document</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <RiCloseLine className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleShare} className="p-4">
                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                        </select>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <RiUserAddLine className="w-5 h-5" />
                        </button>
                    </div>
                </form>

                <div className="px-4 pb-4">
                    <h3 className="font-medium mb-2">Shared with</h3>
                    <div className="space-y-2">
                        {document.sharedWith?.map(user => (
                            <div key={user.uid} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    {user.picture ? (
                                        <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            {user.name[0].toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium">{user.name}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveShare(user.uid)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                    <RiDeleteBinLine className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareDialog; 