import { GoogleGenAI, Type } from "@google/genai";
import type { Part, Content } from "@google/genai";
import type { Project, ProjectFile, GeneratedFile } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Using a placeholder. Please set your API key for the app to function.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'YOUR_API_KEY_HERE' });
const model = 'gemini-2.5-pro';

const fileToGenerativePart = (file: ProjectFile): Part => {
  return {
    inlineData: {
      mimeType: file.type,
      data: file.content,
    },
  };
};

export const consolidateProjectBrief = async (
    projectName: string,
    corePrompt: string,
    originalPrd: ProjectFile | null,
): Promise<ProjectFile> => {
    try {
        const prompt = `You are an expert product manager and system architect AI.
Your task is to synthesize the following inputs into a single, comprehensive, and exceptionally well-structured Product Requirements Document (PRD) in Markdown format. This PRD will serve as the absolute and only source of truth for an AI developer who will build a web prototype from it.

--- INPUTS ---
1.  **Project Name:** "${projectName}"
2.  **Core Objective/Prompt:** "${corePrompt}"
3.  **User-Provided Document:** An attached document containing initial requirements, notes, or a full PRD. If no document is attached, rely solely on the project name and core objective.

--- YOUR TASK ---
1.  **Analyze and Synthesize:** Carefully analyze all provided inputs.
2.  **Generate a Unified PRD:** Create a new, complete PRD in Markdown. It must be structured logically. Even if the user-provided document is sparse or missing, you must create a plausible and detailed PRD based on the core objective.
3.  **Mandatory Structure:** The generated PRD must include the following sections:
    -   **# Project Overview:** A brief summary of the project's purpose.
    -   **# Key Features & Functionality:** A detailed list of features.
    -   **# Sitemap / Page Structure:** A hierarchical list of all pages to be created (e.g., Home, About Us, Contact, Pricing, Blog). This section is CRITICAL for the developer AI to understand the scope.
    -   **# Page Content Details:** For each page in the sitemap, create a subsection (e.g., "## Homepage") and detail the required content, sections, headlines, and calls-to-action.

--- OUTPUT RULES ---
-   Your response MUST be ONLY the raw Markdown content for the new PRD.
-   Do not include any commentary, introductions, or explanations. Just the Markdown.`;
        
        const parts: Part[] = [{ text: prompt }];
        if (originalPrd) {
            parts.push({ text: "\n\nHere is the user-provided document for analysis:" });
            parts.push(fileToGenerativePart(originalPrd));
        }

        const contents: Content[] = [{ role: 'user', parts }];
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents,
        });

        const markdownText = response.text;
        
        const newName = `${projectName.toLowerCase().replace(/\s+/g, '-')}-prd.md`;
        const base64Content = btoa(unescape(encodeURIComponent(markdownText)));
        
        return {
            name: newName,
            type: 'text/markdown',
            content: base64Content
        };

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

--- Phased Generation Rules ---
1.  **First Request:** On the user's first prompt for a new project, you MUST generate ONLY the main page of the website, named "index.html".
2.  **Subsequent Page Requests:** For follow-up prompts like "Now, generate the 'About Us' page", you will create that specific new page (e.g., "about.html"). You will be given the existing file structure; you MUST add the new file to it and return the complete, updated file structure. Do not modify existing files unless asked.
3.  **Refinement Requests:** For prompts that modify an existing page (e.g., "Change the header color"), you MUST modify the correct file and return the complete, updated file structure.

--- OUTPUT FORMAT (VERY IMPORTANT) ---
-   Your response MUST ALWAYS be a JSON object with a single key "files". The value MUST be an array of file objects, where each object has "name" (e.g., "index.html") and "content" (the full HTML) properties.
-   **Consistency:** For multi-page sites, ensure all pages share a consistent design. Embed the same CSS in each file's <style> tag.

--- HIERARCHY OF INSTRUCTIONS (VERY IMPORTANT) ---
You MUST follow this strict hierarchy when processing user inputs. This is non-negotiable.

1.  **PRD / Document (The "What"):** This is your PRIMARY and ONLY source of truth for ALL content, structure, and functionality.
    -   The sitemap, navigation links, button labels, headlines, body text, and feature descriptions MUST be extracted directly from this document.
    -   If the PRD specifies a five-item navigation bar, you MUST create a five-item navigation bar, regardless of what the inspiration image shows.
    -   This is the blueprint. Do not deviate.

2.  **Inspiration Image (The "How it Looks"):** This document dictates the VISUAL AESTHETICS ONLY.
    -   Use it exclusively to determine the color palette, typography (font families, weights, sizes), spacing, imagery style, and overall visual mood.
    -   DO NOT extract content, text, or structural elements (like the number of navigation items) from the image. The PRD's structure always wins.
    -   Your task is to APPLY the visual style from the image TO the structure defined by the PRD.

3.  **Material Design Foundation (The "How to Build"):** Your implementation MUST be grounded in Google's Material Design principles.
    -   Use Material Design as the underlying framework for layout, components, and spacing to ensure the prototype is responsive, accessible, and well-structured.

--- CORE REQUIREMENTS ---
-   **Responsiveness is Mandatory:** The prototype must be fully responsive using modern CSS (Flexbox, Grid, clamp(), media queries).
-   **Professional Typography:** Identify fonts in the Inspiration Image, find the closest Google Font, and properly import it in the \`<head>\`.
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
        
        // Initial generation of the first page. This is the only time generatedCode will be empty.
        if (project.generatedCode.length === 0) { 
            if (project.prdDocument) {
                currentUserPromptParts.push({ text: "\n\nThis is the PRIMARY and ONLY source of truth for ALL content and structure. You MUST adhere to it strictly:" });
                currentUserPromptParts.push(fileToGenerativePart(project.prdDocument));
            }
            if (project.inspirationImage) {
                currentUserPromptParts.push({ text: "\n\nUse this image as inspiration for the VISUAL DESIGN ONLY (colors, fonts, mood):" });
                currentUserPromptParts.push(fileToGenerativePart(project.inspirationImage));
            }
        } else { // Subsequent generation (refinement or new page)
            if (project.prdDocument) {
                 currentUserPromptParts.push({ text: "\n\nReminder: This is the PRIMARY source of truth for all content and structure. Ensure your changes are consistent with it." });
                 currentUserPromptParts.push(fileToGenerativePart(project.prdDocument));
            }
            currentUserPromptParts.push({ text: `\n\nHere is the current file structure. Modify it based on my request and respond with the full, updated JSON object of all files.` });
            currentUserPromptParts.push({ text: JSON.stringify(project.generatedCode, null, 2) });
        }
        
        const contents: Content[] = [
            ...history,
            { role: 'user', parts: currentUserPromptParts },
        ];
        
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
              systemInstruction,
              temperature: 0.4,
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