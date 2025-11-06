import { generateImage } from '../services/geminiService';

/**
 * Finds all placeholder image URLs (from source.unsplash.com), extracts keywords from them,
 * generates new images using an AI model, and replaces the original URLs with the
 * base64 data URLs of the generated images.
 * @param htmlContent The raw HTML content of the prototype.
 * @returns A promise that resolves with the HTML content including embedded AI-generated images.
 */
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

        const generationPromises = uniqueUrls.map(async (originalUrl) => {
            let keyword = 'abstract background'; // Default keyword for better visuals
            try {
                // A robust way to parse the URL and get the search query
                const url = new URL(originalUrl);
                const query = url.search.substring(1); // remove '?'
                if (query) {
                    // Take only the first keyword if multiple are present (e.g., "tech,business")
                    keyword = decodeURIComponent(query.split(',')[0].trim());
                }
            } catch (e) {
                console.warn(`Could not parse URL, using default keyword for: ${originalUrl}`);
            }
            
            try {
                const generatedImageDataUrl = await generateImage(keyword);
                urlMap.set(originalUrl, generatedImageDataUrl);
            } catch (error) {
                console.error(`Failed to generate image for keyword "${keyword}":`, error);
                // The fallback placeholder is handled inside generateImage, so we just log here.
            }
        });

        await Promise.all(generationPromises);

        // Replace all occurrences of each URL with its generated data URL
        urlMap.forEach((dataUrl, originalUrl) => {
            // Escape special regex characters in the URL before creating the RegExp
            const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const replacementRegex = new RegExp(escapedUrl, 'g');
            processedHtml = processedHtml.replace(replacementRegex, dataUrl);
        });

    } catch (error) {
        console.error("An error occurred during the AI image embedding process:", error);
        // On catastrophic failure, return the original content to avoid breaking the UI
        return htmlContent;
    }

    return processedHtml;
};
