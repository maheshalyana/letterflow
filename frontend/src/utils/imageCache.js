// A simple in-memory cache for images
const imageCache = new Map();

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

/**
 * Get an image URL from cache or fetch it
 * @param {string} url - The original image URL
 * @param {string} fallbackInitial - Initial to use if image fails to load
 * @returns {Promise<{url: string, isLoaded: boolean}>} - Cached URL and load status
 */
export const getCachedImage = async (url, fallbackInitial = null) => {
    if (!url) {
        return { url: null, isLoaded: false };
    }

    // Check if image is already in cache
    if (imageCache.has(url)) {
        return { url, isLoaded: true };
    }

    // Load and cache the image
    try {
        // Create a promise that resolves when the image loads
        const loadPromise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                imageCache.set(url, true);
                resolve({ url, isLoaded: true });
            };
            img.onerror = () => {
                reject({ url, isLoaded: false });
            };
            img.src = url;
        });

        return await loadPromise;
    } catch (error) {
        console.error('Error loading image:', error);
        return { url, isLoaded: false };
    }
};

/**
 * Clear the image cache
 */
export const clearImageCache = () => {
    imageCache.clear();
};

// Clean up expired cache entries periodically
setInterval(() => {
    const now = Date.now();
    imageCache.forEach((value, key) => {
        if (now - value.timestamp > CACHE_EXPIRATION) {
            if (value.dataUrl && value.dataUrl.startsWith('blob:')) {
                URL.revokeObjectURL(value.dataUrl);
            }
            imageCache.delete(key);
        }
    });
}, CACHE_EXPIRATION);

export default {
    getCachedImage,
    clearImageCache
}; 