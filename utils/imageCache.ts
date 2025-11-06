const CACHE_KEY = 'big-elephant-image-cache';

/**
 * Retrieves the image cache from sessionStorage.
 * @returns {Map<string, string>} The cache map.
 */
const getCache = (): Map<string, string> => {
    try {
        const cachedData = sessionStorage.getItem(CACHE_KEY);
        if (cachedData) {
            // Safely parse the data
            const parsed = JSON.parse(cachedData);
            if (Array.isArray(parsed)) {
                return new Map(parsed);
            }
        }
    } catch (e) {
        console.error("Failed to read or parse image cache from sessionStorage", e);
        // Clear corrupted cache
        sessionStorage.removeItem(CACHE_KEY);
    }
    return new Map<string, string>();
};

/**
 * Saves the image cache to sessionStorage.
 * @param {Map<string, string>} cache The cache map to save.
 */
const saveCache = (cache: Map<string, string>) => {
    try {
        const dataToSave = JSON.stringify(Array.from(cache.entries()));
        sessionStorage.setItem(CACHE_KEY, dataToSave);
    } catch (e) {
        console.error("Failed to save image cache to sessionStorage. Cache may be full.", e);
    }
};

/**
 * Gets a cached image data URL for a given source URL.
 * @param {string} url The original source URL (e.g., from Unsplash).
 * @returns {string | null} The base64 data URL if found, otherwise null.
 */
export const getCachedImage = (url: string): string | null => {
    const cache = getCache();
    return cache.get(url) || null;
};

/**
 * Adds a new image data URL to the cache.
 * @param {string} url The original source URL (e.g., from Unsplash).
 * @param {string} dataUrl The base64 data URL of the generated image.
 */
export const setCachedImage = (url: string, dataUrl: string) => {
    const cache = getCache();
    cache.set(url, dataUrl);
    saveCache(cache);
};
