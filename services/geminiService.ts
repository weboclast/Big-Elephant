import { GoogleGenAI, Type } from "@google/genai";
import type { Part, Content } from "@google/genai";
import type { Project, ProjectFile, GeneratedFile, ChatMessage } from '../types';
import { materialDesignTokens } from '../themes/materialDesign';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Using a placeholder. Please set your API key for the app to function.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'YOUR_API_KEY_HERE' });

const fileToGenerativePart = (file: ProjectFile): Part => {
  return {
    inlineData: {
      mimeType: file.type,
      data: file.content,
    },
  };
};

export const continueConversation = async (history: ChatMessage[]): Promise<string> => {
    const systemInstruction = `You are an expert product manager AI named 'Eli'. Your goal is to help the user define their web prototype idea through conversation.
- Start by introducing yourself and asking what they'd like to build.
- Ask clarifying questions about their target audience, key features, desired pages, and overall aesthetic.
- Your tone should be helpful, encouraging, and professional.
- Steer the conversation towards building web prototypes and landing pages. Gently deflect off-topic questions by refocusing on the project. For example, if asked about the weather, say "I'm focused on our project right now. What kind of features were you imagining for the homepage?".
- When you feel you have enough information, you can suggest moving forward by saying something like: "This sounds like a great plan! I think I have enough information to draft a full project brief. Whenever you're ready, just press the 'Create Project' button."`;

    // We don't want to send the initial welcome message from the bot back to the API
    const conversationHistory = history.slice(1);

    const contents: Content[] = conversationHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
    }));

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
            systemInstruction,
        },
    });

    return response.text;
};

export const consolidateProjectBrief = async (
    chatHistory: ChatMessage[],
    originalPrd: ProjectFile | null,
): Promise<{ name: string; prd: ProjectFile }> => {
    try {
        const conversationText = chatHistory.map(m => `${m.role}: ${m.text}`).join('\n');

        const prompt = `You are an expert product manager and system architect AI.
Your task is to analyze the following conversation and an optional user-provided document, then generate a comprehensive Product Requirements Document (PRD) in Markdown and suggest a suitable project name.

--- CONVERSATION HISTORY ---
${conversationText}
--- YOUR TASK ---
1.  **Analyze and Synthesize:** Carefully analyze the entire conversation and the attached document (if any).
2.  **Generate a Unified PRD:** Create a new, complete PRD in Markdown. It must be structured logically.
3.  **Suggest a Project Name:** Based on the conversation, suggest a concise and relevant project name (e.g., "SaaS Gardening Tools" or "E-commerce App"). If no clear name emerges, use "New Prototype".
4.  **Mandatory PRD Structure:** The generated PRD must include the following sections:
    -   **# Project Overview:** A brief summary of the project's purpose.
    -   **# Key Features & Functionality:** A detailed list of features.
    -   **# Sitemap / Page Structure:** A hierarchical list of all pages to be created (e.g., Home, About Us, Contact, Pricing, Blog). This is CRITICAL.
    -   **# Page Content Details:** For each page, detail the required content, sections, headlines, and calls-to-action.

--- OUTPUT RULES ---
-   Your response MUST be a valid JSON object with two keys: "projectName" (string) and "prdMarkdown" (string).
-   The "prdMarkdown" value must be the raw Markdown content for the new PRD.
-   Do not include any other commentary, introductions, or explanations in your response. Just the JSON.`;

        const parts: Part[] = [{ text: prompt }];
        if (originalPrd) {
            parts.push({ text: "\n\nHere is the user-provided document for analysis:" });
            parts.push(fileToGenerativePart(originalPrd));
        }

        const contents: Content[] = [{ role: 'user', parts }];
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        projectName: { type: Type.STRING },
                        prdMarkdown: { type: Type.STRING }
                    },
                    required: ['projectName', 'prdMarkdown']
                }
            }
        });

        const responseText = response.text.trim();
        const parsed = JSON.parse(responseText);

        const projectName = parsed.projectName || "New Prototype";
        const markdownText = parsed.prdMarkdown;
        
        const newName = `${projectName.toLowerCase().replace(/\s+/g, '-')}-prd.md`;
        const base64Content = btoa(unescape(encodeURIComponent(markdownText)));
        
        const prdFile = {
            name: newName,
            type: 'text/markdown',
            content: base64Content
        };
        
        return { name: projectName, prd: prdFile };

    } catch (error) {
        console.error("Error consolidating project brief:", error);
        throw new Error('Failed to create a consolidated project brief.');
    }
};


export const extractTasksFromPrd = async (prdFile: ProjectFile): Promise<string[]> => {
    try {
        const prompt = "You are an expert project manager AI. Analyze the following document and identify all the distinct pages or main sections that need to be built for this website/app. Your response MUST be a JSON object with a single key 'pages' containing an array of strings, where each string is the name of a page (e.g., ['Homepage', 'About Us', 'Contact', 'Product Details']). Do not include any other text or explanation.";
        
        const decodedContent = decodeURIComponent(escape(atob(prdFile.content)));

        const contents: Content[] = [
             { role: 'user', parts: [
                { text: prompt },
                { text: `\n\nPRD Content:\n\n${decodedContent}` }
            ] },
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        pages: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        
        let responseText = response.text.trim();
        const parsed = JSON.parse(responseText);
        if (parsed.pages && Array.isArray(parsed.pages)) {
            return parsed.pages;
        }
        return [];

    } catch(error) {
        console.error("Error extracting tasks from PRD:", error);
        // Fallback or re-throw
        return [];
    }
}

export const generatePrototype = async (
    project: Project,
    newPrompt: string,
): Promise<GeneratedFile[]> => {
    try {
        const systemInstruction = `You are a world-class AI developer, specializing in creating fully-functional, production-quality web prototypes from multimodal inputs.

--- HIERARCHY OF INSTRUCTIONS (VERY IMPORTANT) ---
You MUST follow this strict hierarchy when processing user inputs. This is non-negotiable.

1.  **PRD / Document (The "What"):** This is your PRIMARY and ONLY source of truth for ALL content, structure, and functionality. The sitemap, navigation links, button labels, headlines, body text, and feature descriptions MUST be extracted directly from this document. If the PRD specifies a five-item navigation bar, you MUST create a five-item navigation bar. This is the blueprint. Do not deviate.

2.  **Inspiration Image (The "How it Looks"):** This document dictates the VISUAL AESTHETICS ONLY. Use it exclusively to determine the KEY color values (primary, secondary, tertiary) and overall visual mood. DO NOT extract content, text, or structural elements from the image.

3.  **THEME & DESIGN SYSTEM (The "How to Build"):** This project MUST be built using the '${project.theme}' theme. You MUST use the following JSON object of design tokens as your ONLY source of truth for ALL styling (colors, typography, spacing, etc.). Your task is to MAP the inspiration image's primary color to the theme's primary color slot and apply the provided tokens to the structure defined by the PRD.

--- MATERIAL DESIGN 3 TOKENS (MANDATORY) ---
${JSON.stringify(materialDesignTokens, null, 2)}

--- HTML Head Rules (MANDATORY) ---
- You MUST include the following links in the <head> of every HTML file to ensure fonts and icons are displayed correctly:
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,400;8..144,500&family=Roboto+Serif:opsz,wght@8..144,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />

--- CSS IMPLEMENTATION RULES (MANDATORY) ---
-   **CSS Custom Properties:** You MUST create a \`:root\` CSS block in your \`<style>\` tag. For every token in the JSON object (e.g., "sys.color.primary"), you MUST create a corresponding CSS custom property (e.g., \`--md-sys-color-primary\`). All styling in your CSS MUST use these custom properties (e.g., \`background-color: var(--md-sys-color-primary);\`). DO NOT use hex codes or other values directly in your styles, except within the \`:root\` block.
-   **Color Mapping:** Analyze the inspiration image to find its main color. Set this color as the value for the \`--md-sys-color-primary\` variable in the \`:root\`. Set complementary colors for secondary, tertiary, etc.
-   **Typography:** You MUST use the typography tokens for all text. For each semantic HTML tag (h1, p, etc.), create a style rule and apply the font properties from the corresponding token (e.g., \`h1 { font-size: var(--md-sys-typescale-display-large-size); font-weight: var(--md-sys-typescale-display-large-weight); }\`).
-   **Components:** Implement ALL interactive elements (buttons, cards, etc.) using styles consistent with the provided tokens. Ensure consistency in shape (corner-radius), size, and color. For example, all primary action buttons must use the primary color token.
-   **Spacing:** Use a consistent spacing system based on the provided tokens for all layout and component spacing (margins, padding).

--- Phased Generation Rules ---
1.  **First Request:** On the user's first prompt for a new project, you MUST generate ONLY the main page of the website, named "index.html".
2.  **Subsequent Page Requests:** For follow-up prompts like "Now, generate the 'About Us' page", you will create that specific new page (e.g., "about.html"). You will be given the existing file structure; you MUST add the new file to it and return the complete, updated file structure. Do not modify existing files unless asked.
3.  **Refinement Requests:** For prompts that modify an existing page (e.g., "Change the header color"), you MUST modify the correct file and return the complete, updated file structure.

--- OUTPUT FORMAT (VERY IMPORTANT) ---
-   Your response MUST ALWAYS be a JSON object with a single key "files". The value MUST be an array of file objects, where each object has "name" (e.g., "index.html") and "content" (the full HTML) properties.
-   **Consistency:** For multi-page sites, ensure all pages share a consistent design. Embed the same CSS in each file's <style> tag.

--- CORE REQUIREMENTS ---
-   **Responsiveness is Mandatory:** The prototype must be fully responsive using modern CSS (Flexbox, Grid, clamp(), media queries).
-   **No Missing Images:** You MUST use relevant and high-quality placeholder images from Unsplash. Use the format \`https://source.unsplash.com/1600x900/?{keyword}\`. The {keyword} MUST be a single, relevant, general-purpose word (e.g., 'technology', 'nature', 'business', 'office'). NEVER use multiple keywords, commas, or special characters in the image URL query. For example, use '?technology' NOT '?modern,tech'. This is critical for images to load. Do not leave any \`src\` attributes empty.
-   **Internal Linking:** For multi-page prototypes, links between pages (e.g., navigation) MUST use relative paths (e.g., \`<a href="./about.html">\`). External links must use \`target="_blank"\`. Placeholder links must use \`href="javascript:void(0);"\`.
-   **Navigation Script:** You MUST inject the following script just before the closing </body> tag on EVERY generated HTML page. This is critical for navigation to work in the preview environment.
<script>
document.addEventListener('click', function(e) {
  let target = e.target;
  while (target && target.tagName !== 'A') target = target.parentElement;
  if (target && target.tagName === 'A') {
    const href = target.getAttribute('href');
    const targetAttr = target.getAttribute('target');
    if (href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('javascript:') && targetAttr !== '_blank') {
      e.preventDefault();
      window.parent.postMessage({ type: 'navigate', payload: href }, '*');
    }
  }
}, false);
</script>

--- EXECUTION RULES ---
-   **Output Format:** Your response MUST be ONLY the raw JSON object. Do not include any explanatory text, comments, or markdown formatting like \`\`\`json\`.\`\`\`.`;
        
        const history: Content[] = project.chatHistory.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }], 
        }));

        const currentUserPromptParts: Part[] = [{ text: newPrompt }];
        
        const activeInspirationImage = project.activeInspirationImageIndex > -1
            ? project.inspirationImages[project.activeInspirationImageIndex]
            : null;

        // Initial generation of the first page. This is the only time generatedCode will be empty.
        if (project.generatedCode.length === 0) { 
            if (project.prdDocument) {
                currentUserPromptParts.push({ text: "\n\nThis is the PRIMARY and ONLY source of truth for ALL content and structure. You MUST adhere to it strictly:" });
                currentUserPromptParts.push(fileToGenerativePart(project.prdDocument));
            }
            if (activeInspirationImage) {
                currentUserPromptParts.push({ text: "\n\nUse this image as inspiration for the VISUAL DESIGN ONLY (colors, fonts, mood):" });
                currentUserPromptParts.push(fileToGenerativePart(activeInspirationImage));
            }
        } else { // Subsequent generation (refinement or new page)
            if (project.prdDocument) {
                 currentUserPromptParts.push({ text: "\n\nReminder: This is the PRIMARY source of truth for all content and structure. Ensure your changes are consistent with it." });
                 currentUserPromptParts.push(fileToGenerativePart(project.prdDocument));
            }
            if (activeInspirationImage) {
                 currentUserPromptParts.push({ text: "\n\nReminder: This is the image to use for visual inspiration." });
                 currentUserPromptParts.push(fileToGenerativePart(activeInspirationImage));
            }
            currentUserPromptParts.push({ text: `\n\nHere is the current file structure. Modify it based on my request and respond with the full, updated JSON object of all files.` });
            currentUserPromptParts.push({ text: JSON.stringify(project.generatedCode, null, 2) });
        }
        
        const contents: Content[] = [
            ...history,
            { role: 'user', parts: currentUserPromptParts },
        ];
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
              systemInstruction,
              temperature: 0.2,
              topP: 0.95,
              topK: 40,
          },
        });

        let responseText = response.text.trim();
        
        try {
            // Check for markdown fences and remove them
            if (responseText.startsWith('```json')) {
                responseText = responseText.substring(7, responseText.length - 3).trim();
            } else if (responseText.startsWith('```')) {
                responseText = responseText.substring(3, responseText.length - 3).trim();
            }

            const parsed = JSON.parse(responseText);
            if (parsed.files && Array.isArray(parsed.files)) {
                return parsed.files;
            }
            throw new Error("Invalid JSON structure: 'files' array not found.");
        } catch (e) {
            console.error("Failed to parse Gemini response as JSON:", e);
            console.error("Raw response text:", responseText);
            return [{ name: 'error.html', content: `<h1>Parsing Error</h1><p>The AI's response could not be processed.</p><pre>${responseText}</pre>` }];
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return [{ name: 'error.html', content: `<p>Error generating prototype. Please check the console for details.</p>` }];
    }
};


export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'YOUR_API_KEY_HERE' });
        
        // Enhance the prompt for better, more consistent results
        const enhancedPrompt = `A high-quality, professional, photorealistic image for a modern website, representing: ${prompt}. Clean, minimalist aesthetic.`;

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: enhancedPrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        throw new Error("Image generation returned no images.");

    } catch(error) {
        console.error(`Error generating image for prompt "${prompt}":`, error);
        // Return a placeholder SVG data URI on failure so the layout doesn't break
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwMCIgaGVpZ2h0PSI5MDAiIHZpZXdCb3g9IjAgMCAxNjAwIDkwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTBlMGUwIj48L3JlY3Q+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4cHgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNhY2FjYWMiIGR5PSIuM2VtIj5JbWFnZSBDb3VsZCBOb3QgQmUgR2VuZXJhdGVkPC90ZXh0Pjwvc3ZnPg==';
    }
};