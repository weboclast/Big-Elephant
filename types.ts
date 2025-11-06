
export interface GeneratedFile {
  name: string;
  content: string;
}

export interface ProjectFile {
  name: string;
  type: string;
  content: string; // base64 encoded
}

export interface PageTask {
  name: string;
  status: 'completed' | 'pending';
  fileName?: string; // The name of the generated file corresponding to this task
}

export interface Project {
  id: string;
  name: string;
  lastModified: string;
  corePrompt: string;
  inspirationImages: ProjectFile[];
  activeInspirationImageIndex: number;
  prdDocument?: ProjectFile | null;
  generatedCode: GeneratedFile[];
  chatHistory: ChatMessage[];
  tasks: PageTask[];
  theme: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type DeviceView = 'desktop' | 'tablet' | 'mobile';