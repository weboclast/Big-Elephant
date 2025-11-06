import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Project, DeviceView, GeneratedFile, PageTask, ProjectFile } from '../types';
import { generatePrototype } from '../services/geminiService';
import { embedUnsplashImages } from '../utils/imageUtils';
import IconButton from './IconButton';
import Spinner from './Spinner';
import CodeModal from './CodeModal';
import DesignInspirations from './DesignInspirations';
import ProjectChecklist from './ProjectChecklist';

interface StudioScreenProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (updatedProject: Project) => void;
}

const deviceDimensions: Record<DeviceView, { width: string; height: string }> = {
  desktop: { width: '100%', height: '100%' },
  tablet: { width: '768px', height: '100%' },
  mobile: { width: '375px', height: '100%' },
};

const StudioScreen: React.FC<StudioScreenProps> = ({ project, onBack, onUpdateProject }) => {
  const [currentProject, setCurrentProject] = useState<Project>(project);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmbeddingImages, setIsEmbeddingImages] = useState(false);
  const [deviceView, setDeviceView] = useState<DeviceView>('desktop');
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeTab, setActiveTab] = useState<'chat' | 'design' | 'tasks'>('chat');
  const [activeFile, setActiveFile] = useState('index.html');
  const [iframeContent, setIframeContent] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [currentProject.chatHistory]);
  
  // Handles navigation requests from within the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      
      if (event.data.type === 'navigate') {
        // Normalize path: remove leading './' to match file name
        const targetFile = event.data.payload.replace(/^\.\//, '');
        if (currentProject.generatedCode.some(file => file.name === targetFile)) {
          setActiveFile(targetFile);
        } else {
          console.warn(`Navigation to non-existent file "${targetFile}" blocked.`);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentProject.generatedCode]);

  const activeFileContent = currentProject.generatedCode.find(f => f.name === activeFile)?.content || '';

  // This effect processes the generated HTML to embed Unsplash images as base64 data URIs.
  // This is a robust way to bypass iframe cross-origin/CSP issues for images.
  useEffect(() => {
    const processContent = async () => {
      if (activeFileContent) {
        setIsEmbeddingImages(true);
        try {
            const processedHtml = await embedUnsplashImages(activeFileContent);
            setIframeContent(processedHtml);
        } catch (error) {
            console.error("Error embedding images:", error);
            setIframeContent("<html><body><h1>Error</h1><p>Could not process and display the prototype content. Please check the console.</p></body></html>");
        } finally {
            setIsEmbeddingImages(false);
        }
      } else {
        setIframeContent('');
      }
    };
    processContent();
  }, [activeFileContent]);


  const handleGenerate = useCallback(async (promptText: string, projectContext?: Project) => {
    setIsLoading(true);
    const baseProject = projectContext || currentProject;

    const updatedHistory = [...baseProject.chatHistory, { role: 'user' as const, text: promptText }];
    // Temporarily update chat history for optimistic UI response
    setCurrentProject(prev => ({ 
        ...prev, 
        inspirationImages: baseProject.inspirationImages,
        activeInspirationImageIndex: baseProject.activeInspirationImageIndex,
        chatHistory: updatedHistory 
    }));
    
    const oldFileNames = new Set(baseProject.generatedCode.map(f => f.name));
    
    const projectForApi = { ...baseProject, chatHistory: updatedHistory };
    const newFiles = await generatePrototype(projectForApi, promptText);
    const newFileName = newFiles.find(f => !oldFileNames.has(f.name))?.name;
    
    const finalHistory = [...updatedHistory, { role: 'model' as const, text: "Here is the updated prototype." }];
    
    const promptToTaskName = (prompt: string): string | null => {
        const match = prompt.match(/generate the '([^']+)' page/i);
        return match ? match[1] : null;
    };
    const completedTaskName = promptToTaskName(promptText);
    let updatedTasks = baseProject.tasks;
    if (completedTaskName) {
        updatedTasks = baseProject.tasks.map(task => 
            task.name.toLowerCase() === completedTaskName.toLowerCase() 
            ? { ...task, status: 'completed', fileName: newFileName } 
            : task
        );
    }

    const updatedProject: Project = {
        ...baseProject,
        generatedCode: newFiles,
        chatHistory: finalHistory,
        lastModified: new Date().toLocaleDateString(),
        tasks: updatedTasks,
    };
    setCurrentProject(updatedProject);
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveState('saving');
    onUpdateProject(updatedProject);
    
    saveTimeoutRef.current = window.setTimeout(() => {
      setSaveState('saved');
      saveTimeoutRef.current = window.setTimeout(() => setSaveState('idle'), 2000);
    }, 500);
    
    setIsLoading(false);
  }, [currentProject, onUpdateProject]);

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (promptInput.trim() && !isLoading) {
      handleGenerate(promptInput.trim());
      setPromptInput('');
    }
  };

  const handleGeneratePage = (taskName: string) => {
    handleGenerate(`Now, generate the '${taskName}' page.`);
    setActiveTab('chat');
  };

  const handleViewPage = (fileName: string) => {
    setActiveFile(fileName);
  };
  
  const handleUpdateInspirations = useCallback((newImages: ProjectFile[], newActiveIndex: number) => {
    const previousActiveImage = currentProject.inspirationImages[currentProject.activeInspirationImageIndex];
    const newActiveImage = newImages[newActiveIndex];

    const updatedProject: Project = {
        ...currentProject,
        inspirationImages: newImages,
        activeInspirationImageIndex: newActiveIndex,
    };

    // If the active image changed, trigger a full regeneration with a more explicit prompt.
    if (previousActiveImage?.content !== newActiveImage?.content) {
        const activeFileBasename = activeFile.split('.')[0] || 'current';
        const redesignPrompt = `This is a full redesign request. Re-generate the entire HTML and CSS for the '${activeFileBasename}' page. Use the PRD for all content and structure, but derive a completely new visual style from the new inspiration image I've selected.`;
        handleGenerate(redesignPrompt, updatedProject);
    } else {
        // If only new images were added but the active one didn't change, just update state and save.
        setCurrentProject(updatedProject);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        setSaveState('saving');
        onUpdateProject(updatedProject);
        saveTimeoutRef.current = window.setTimeout(() => {
          setSaveState('saved');
          saveTimeoutRef.current = window.setTimeout(() => setSaveState('idle'), 2000);
        }, 500);
    }
  }, [currentProject, onUpdateProject, handleGenerate, activeFile]);


  return (
    <div className="flex h-screen bg-base-200 text-base-content font-sans">
      <CodeModal isOpen={isCodeModalOpen} onClose={() => setIsCodeModalOpen(false)} files={currentProject.generatedCode} />
      
      <aside className="w-[30%] min-w-[350px] max-w-[500px] flex flex-col border-r border-base-300">
        <header className="p-4 border-b border-base-300 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-base-300">
               <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-lg font-semibold">{currentProject.name}</h1>
              <p className="text-xs text-gray-400">Refinement Panel</p>
            </div>
          </div>
          <div className="text-sm text-gray-400 h-5">
            {saveState === 'saving' && (
              <div className="flex items-center space-x-2 animate-pulse">
                <Spinner size="sm" /> 
                <span>Saving...</span>
              </div>
            )}
            {saveState === 'saved' && (
              <div className="flex items-center space-x-2 text-green-400">
                <span className="material-symbols-outlined text-xl">check_circle</span>
                <span>Saved</span>
              </div>
            )}
          </div>
        </header>

        <div className="px-4 pt-4 border-b border-base-300">
          <div className="flex space-x-6">
            <button 
                onClick={() => setActiveTab('chat')}
                className={`pb-2 font-medium transition-colors duration-200 focus:outline-none ${activeTab === 'chat' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
            >
                Chat
            </button>
            <button 
                onClick={() => setActiveTab('tasks')}
                className={`pb-2 font-medium transition-colors duration-200 focus:outline-none ${activeTab === 'tasks' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
            >
                Tasks
            </button>
            <button 
                onClick={() => setActiveTab('design')}
                className={`pb-2 font-medium transition-colors duration-200 focus:outline-none ${activeTab === 'design' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`}
            >
                Design Inspirations
            </button>
          </div>
        </div>
        
        <div className="flex-grow p-4 overflow-y-auto">
            {activeTab === 'chat' && (
                <div className="space-y-4">
                {currentProject.chatHistory.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-xl ${msg.role === 'user' ? 'bg-primary text-primary-content' : 'bg-base-300'}`}>
                            <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && <div className="flex justify-start"><div className="max-w-[80%] p-3 rounded-xl bg-base-300"><Spinner size="sm"/></div></div>}
                 <div ref={chatEndRef} />
                </div>
            )}
            {activeTab === 'tasks' && <ProjectChecklist project={currentProject} onGeneratePage={handleGeneratePage} onViewPage={handleViewPage} />}
            {activeTab === 'design' && <DesignInspirations project={currentProject} onUpdateInspirations={handleUpdateInspirations} />}
        </div>

        {activeTab === 'chat' && (
            <div className="p-4 border-t border-base-300 shrink-0">
              <form onSubmit={handlePromptSubmit} className="flex items-center space-x-2">
                <input 
                  type="text" 
                  value={promptInput}
                  onChange={e => setPromptInput(e.target.value)}
                  placeholder="e.g., 'Make the header sticky...'" 
                  className="w-full bg-base-300 border-transparent rounded-full px-4 py-2 focus:ring-primary focus:border-primary"
                  disabled={isLoading}
                />
                <button type="submit" className="bg-primary p-2 rounded-full text-white disabled:bg-gray-500" disabled={isLoading}>
                  <span className="material-symbols-outlined">send</span>
                </button>
              </form>
            </div>
        )}
      </aside>

      <main className="flex-grow flex flex-col">
        <header className="p-2 border-b border-base-300 flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-2">
                <IconButton label="Desktop" isActive={deviceView === 'desktop'} onClick={() => setDeviceView('desktop')}>
                    <span className="material-symbols-outlined text-xl">desktop_windows</span>
                </IconButton>
                <IconButton label="Tablet" isActive={deviceView === 'tablet'} onClick={() => setDeviceView('tablet')}>
                    <span className="material-symbols-outlined text-xl">tablet_mac</span>
                </IconButton>
                <IconButton label="Mobile" isActive={deviceView === 'mobile'} onClick={() => setDeviceView('mobile')}>
                     <span className="material-symbols-outlined text-xl">smartphone</span>
                </IconButton>
            </div>
            <div className="flex items-center space-x-2">
                <IconButton label="View Code" onClick={() => setIsCodeModalOpen(true)}>
                    <span className="material-symbols-outlined text-xl">code</span>
                </IconButton>
            </div>
        </header>
        <div className="flex-grow p-4 bg-base-100 flex justify-center items-start overflow-auto">
            <div className="shadow-2xl rounded-lg overflow-hidden transition-all duration-500" style={deviceDimensions[deviceView]}>
                {isEmbeddingImages ? (
                    <div className="w-full h-full flex flex-col justify-center items-center bg-base-200">
                        <Spinner />
                         <p className="mt-4 text-lg">
                            Embedding images...
                        </p>
                        <p className="text-sm text-gray-400">
                            This may take a moment.
                        </p>
                    </div>
                ) : (
                    <iframe
                        ref={iframeRef}
                        key={currentProject.id + activeFile} // Re-renders iframe when activeFile changes
                        srcDoc={iframeContent}
                        title="Live Prototype"
                        className="w-full h-full border-none bg-white"
                        sandbox="allow-scripts allow-same-origin"
                    />
                )}
            </div>
        </div>
      </main>
    </div>
  );
};

export default StudioScreen;