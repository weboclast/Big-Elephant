/**
 * Converts a remote image URL to a base64 data URL using the Image and Canvas APIs.
 * This method is more robust than fetch() for cross-origin images as it bypasses CORS issues.
 * @param url The URL of the image to convert.
 * @returns A promise that resolves with the base64 data URL.
 */
const imageUrlToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // This is essential for cross-origin canvas usage.

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(img, 0, 0);
            // Get the data URL. The browser infers the mime type (e.g., image/jpeg) from the source.
            const dataUrl = canvas.toDataURL(); 
            resolve(dataUrl);
        };

        img.onerror = (error) => {
            // This event object might not be very descriptive, but it signals a failure.
            console.error(`Failed to load image from URL: ${url}`, error);
            reject(new Error(`Failed to load image: ${url}`));
        };

        img.src = url;
    });
};


export const embedUnsplashImages = async (htmlContent: string): Promise<string> => {
    // Regex to find all Unsplash source URLs in img tags
    const unsplashUrlRegex = /https:\/\/source\.unsplash\.com\/[^\s"']+/g;
    const urls = htmlContent.match(unsplashUrlRegex) || [];
    const uniqueUrls = [...new Set(urls)];

    if (uniqueUrls.length === 0) {
        return htmlContent;
    }

    let processedHtml = htmlContent;

    try {
        const urlMap = new Map<string, string>();

        const conversionPromises = uniqueUrls.map(async (originalUrl) => {
            // Sanitize URL: if multiple keywords are present, use only the first one.
            // This prevents issues with URLs like "?clean,modern,interior"
            let processUrl = originalUrl;
            const urlParts = originalUrl.split('?');
            if (urlParts.length > 1 && urlParts[1]) {
                const keywords = urlParts[1];
                if (keywords.includes(',')) {
                    const firstKeyword = keywords.split(',')[0].trim();
                    processUrl = `${urlParts[0]}?${firstKeyword}`;
                }
            }
            
            try {
                // Use the new, more reliable method instead of fetch.
                const base64 = await imageUrlToBase64(processUrl);
                urlMap.set(originalUrl, base64);
            } catch (error) {
                console.error(`Error processing image ${processUrl}:`, error);
                 // Fallback on network error
                urlMap.set(originalUrl, 'https://via.placeholder.com/800x600.png?text=Image+Load+Error');
            }
        });

        await Promise.all(conversionPromises);

        // Replace all occurrences of each URL with its base64 version
        urlMap.forEach((base64, originalUrl) => {
            // Use a regex to replace all instances of the URL to handle cases where the same image is used multiple times.
            // Escape special regex characters in the URL.
            const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const replacementRegex = new RegExp(escapedUrl, 'g');
            processedHtml = processedHtml.replace(replacementRegex, base64);
        });

    } catch (error) {
        console.error("An error occurred during image embedding:", error);
        // Return original content on catastrophic failure
        return htmlContent;
    }

    return processedHtml;
};