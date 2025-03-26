import React, { useState, useEffect } from 'react';
import { getCachedImage } from '../utils/imageCache';

const ProfileImage = ({ user, size = 8, showActiveStatus = false, isActive = false }) => {
    const [imageState, setImageState] = useState({
        url: user?.picture || null,
        isLoaded: !!user?.picture
    });

    useEffect(() => {
        let isMounted = true;

        const loadImage = async () => {
            if (user?.picture) {
                const result = await getCachedImage(user.picture);
                if (isMounted) {
                    setImageState(result);
                }
            }
        };

        loadImage();

        return () => {
            isMounted = false;
        };
    }, [user?.picture]);

    // Determine border color based on active status
    const borderClass = isActive ? 'border-green-500' : 'border-white';

    if (imageState.url && imageState.isLoaded) {
        return (
            <div className="relative">
                <img
                    src={imageState.url}
                    alt={user?.name || 'User'}
                    className={`w-${size} h-${size} rounded-full border-2 ${borderClass}`}
                />
                {showActiveStatus && isActive && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                )}
            </div>
        );
    } else {
        // Fallback to initials
        return (
            <div className="relative">
                <div className={`w-${size} h-${size} rounded-full bg-blue-500 flex items-center justify-center text-white border-2 ${borderClass}`}>
                    {user?.name?.[0] || '?'}
                </div>
                {showActiveStatus && isActive && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                )}
            </div>
        );
    }
};

export default ProfileImage; 