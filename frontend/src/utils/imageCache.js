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
    // If no URL provided, return null
    if (!url) {
        return { url: null, isLoaded: false };
    }

    // Check if URL is already in cache and not expired
    if (imageCache.has(url)) {
        const cachedData = imageCache.get(url);

        // Check if cache is still valid
        if (Date.now() - cachedData.timestamp < CACHE_EXPIRATION) {
            return { url: cachedData.dataUrl || url, isLoaded: cachedData.isLoaded };
        }

        // Cache expired, remove it
        imageCache.delete(url);
    }

    // Create a new cache entry with default values
    imageCache.set(url, {
        dataUrl: null,
        isLoaded: false,
        timestamp: Date.now()
    });

    // Try to fetch and cache the image
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const dataUrl = URL.createObjectURL(blob);

        // Update cache with the data URL
        imageCache.set(url, {
            dataUrl,
            isLoaded: true,
            timestamp: Date.now()
        });

        return { url: dataUrl, isLoaded: true };
    } catch (error) {
        console.error('Error caching image:', error);

        // Mark as failed in cache but keep original URL
        imageCache.set(url, {
            dataUrl: null,
            isLoaded: false,
            timestamp: Date.now()
        });

        return { url, isLoaded: false };
    }
};

/**
 * Clear the image cache
 */
export const clearImageCache = () => {
    // Release object URLs to prevent memory leaks
    imageCache.forEach(entry => {
        if (entry.dataUrl && entry.dataUrl.startsWith('blob:')) {
            URL.revokeObjectURL(entry.dataUrl);
        }
    });

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