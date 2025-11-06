import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createProjectFile } from '../utils/fileUtils';
import { consolidateProjectBrief, extractTasksFromPrd, generatePrototype } from '../services/geminiService';
import type { Project, PageTask, ChatMessage, ProjectFile } from '../types';
import Spinner from './Spinner';
import ThemeSelectionModal from './ThemeSelectionModal';

interface HomeScreenProps {
  onCreateProject: (projectData: Omit<Project, 'id' | 'lastModified'>) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onCreateProject }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [inspirationImage, setInspirationImage] = useState<File | null>(null);
  const [prdDocument, setPrdDocument] = useState<File | null>(null);
  const [selectedTheme, setSelectedTheme] = useState('Material Design');
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  const inspirationInputRef = useRef<HTMLInputElement>(null);
  const prdInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const userInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    userInputRef.current?.focus();
  }, []);

  const handleCreateProjectFromChat = useCallback(async (finalMessages: ChatMessage[]) => {
    if (finalMessages.length === 0 || isProcessing) {
      alert("Please describe your project before creating it.");
      return;
    }

    setIsProcessing(true);
    try {
        setProcessingStep('Building brief from chat...');
        const inspirationImageFile = inspirationImage ? await createProjectFile(inspirationImage) : null;
        const inspirationImages: ProjectFile[] = inspirationImageFile ? [inspirationImageFile] : [];
        const originalPrdFile = prdDocument ? await createProjectFile(prdDocument) : null;
        
        const { name: projectName, prd: consolidatedPrd } = await consolidateProjectBrief(finalMessages, originalPrdFile);

        setProcessingStep('Extracting tasks...');
        const taskNames = await extractTasksFromPrd(consolidatedPrd);
        let tasks: PageTask[] = taskNames.map(name => ({ name, status: 'pending' }));

        setProcessingStep('Generating homepage...');
        const initialPrompt = "Generate the main page (index.html) for this project based on the provided documents.";
        const chatHistoryForGen: ChatMessage[] = [{ role: 'user', text: initialPrompt }];

        const tempProjectForGen: Project = {
            id: '', name: projectName, lastModified: '',
            corePrompt: finalMessages.filter(m => m.role === 'user').map(m => m.text).join('\n'),
            prdDocument: consolidatedPrd,
            inspirationImages: inspirationImages,
            activeInspirationImageIndex: inspirationImages.length > 0 ? 0 : -1,
            generatedCode: [],
            chatHistory: chatHistoryForGen,
            tasks: tasks,
            theme: selectedTheme,
        };
        
        const generatedCode = await generatePrototype(tempProjectForGen, initialPrompt);
        
        const chatHistory: ChatMessage[] = [
            ...chatHistoryForGen,
            { role: 'model', text: "Here is the initial prototype." }
        ];
        
        if (tasks.length > 0) {
            const homepageIndex = tasks.findIndex(t => t.name.toLowerCase().includes('home') || t.name.toLowerCase().includes('index'));
            if (homepageIndex !== -1) {
                tasks[homepageIndex] = { ...tasks[homepageIndex], status: 'completed', fileName: 'index.html' };
            }
        }

        const projectData: Omit<Project, 'id' | 'lastModified'> = {
            name: projectName,
            corePrompt: tempProjectForGen.corePrompt,
            inspirationImages: inspirationImages,
            activeInspirationImageIndex: tempProjectForGen.activeInspirationImageIndex,
            prdDocument: consolidatedPrd,
            generatedCode,
            chatHistory,
            tasks,
            theme: selectedTheme,
        };
        
        onCreateProject(projectData);
        
        setMessages([]);
        setInspirationImage(null);
        setPrdDocument(null);

    } catch (error) {
        console.error("Failed to create project from chat:", error);
        alert("There was an error creating the project. Please check the console for details and try again.");
    } finally {
        setIsProcessing(false);
        setProcessingStep('');
    }
  }, [inspirationImage, prdDocument, selectedTheme, onCreateProject, isProcessing]);
  
  const handleSubmitProjectCreation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isProcessing) return;

    const finalMessages: ChatMessage[] = [...messages, { role: 'user', text: userInput }];
    setMessages(finalMessages);
    setUserInput('');

    handleCreateProjectFromChat(finalMessages);
  };
  
  return (
    <>
      <ThemeSelectionModal 
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        selectedTheme={selectedTheme}
        onSelectTheme={setSelectedTheme}
      />
      <div className="h-full flex flex-col justify-center items-center text-center animate-fade-in">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Spinner size="lg" />
            <p className="mt-4 text-lg text-subtle-text font-medium">{processingStep}</p>
            <p className="text-sm text-subtle-text">This can take a minute...</p>
          </div>
        ) : (
          <div className="max-w-3xl w-full h-full flex flex-col">
            <div className="py-6 shrink-0">
              <h1 className="text-5xl font-bold text-base-content leading-tight">Got something on your mind?</h1>
              <h2 className="text-5xl font-bold text-accent mt-2">Let's build your prototype.</h2>
            </div>
            
            <div className="flex-grow bg-base-2O0 rounded-2xl shadow-lg w-full flex flex-col p-4 overflow-hidden min-h-0">
              <div className="flex-grow space-y-4 overflow-y-auto pr-2 pb-2">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-xl text-left ${msg.role === 'user' ? 'bg-primary text-primary-content' : 'bg-base-300'}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="mt-4 pt-4 border-t border-base-300 shrink-0">
                <form onSubmit={handleSubmitProjectCreation}>
                  <textarea
                    ref={userInputRef}
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSubmitProjectCreation(e as any);
                      }
                    }}
                    placeholder="Describe your project here. What does it do? Who is it for? What pages does it need?"
                    className="w-full bg-base-100 border border-base-300 rounded-xl p-4 resize-none focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-subtle-text"
                    rows={3}
                    disabled={isProcessing}
                  />

                  <div className="mt-3 flex flex-wrap justify-between items-center text-sm text-subtle-text px-2">
                    <div className="flex items-center space-x-4">
                      <button type="button" onClick={() => inspirationInputRef.current?.click()} className={`flex items-center space-x-1.5 hover:text-primary transition-colors ${inspirationImage ? 'text-primary' : ''}`} disabled={isProcessing}>
                        <span className="material-symbols-outlined text-lg">upload</span>
                        <span className="truncate max-w-[150px]">{inspirationImage ? inspirationImage.name : 'Upload Inspiration'}</span>
                      </button>
                      <button type="button" onClick={() => prdInputRef.current?.click()} className={`flex items-center space-x-1.5 hover:text-primary transition-colors ${prdDocument ? 'text-primary' : ''}`} disabled={isProcessing}>
                        <span className="material-symbols-outlined text-lg">description</span>
                        <span className="truncate max-w-[150px]">{prdDocument ? prdDocument.name : 'Upload Document'}</span>
                      </button>
                       <button 
                          type="button" 
                          onClick={() => setIsThemeModalOpen(true)}
                          className="flex items-center space-x-1.5 hover:text-primary transition-colors" 
                          disabled={isProcessing}
                        >
                        <span className="material-symbols-outlined text-lg">palette</span>
                        <span>Themes</span>
                      </button>
                    </div>
                    <button 
                      type="submit"
                      className="bg-primary text-primary-content px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 hover:bg-primary-focus transition-colors disabled:bg-gray-500"
                      disabled={isProcessing || !userInput.trim()}
                    >
                      <span className="material-symbols-outlined text-base">auto_awesome</span>
                      <span>Create Project</span>
                    </button>
                  </div>
                </form>

                <input type="file" ref={inspirationInputRef} accept=".jpg, .jpeg, .png, .webp" onChange={(e) => { setInspirationImage(e.target.files ? e.target.files[0] : null); if (e.target) e.target.value = ''; }} className="hidden" />
                <input type="file" ref={prdInputRef} accept=".md,.txt,.pdf,.doc,.docx" onChange={(e) => { setPrdDocument(e.target.files ? e.target.files[0] : null); if (e.target) e.target.value = ''; }} className="hidden" />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HomeScreen;