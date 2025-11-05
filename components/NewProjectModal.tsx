import React, { useState, useCallback } from 'react';
import { createProjectFile } from '../utils/fileUtils';
import { consolidateProjectBrief, extractTasksFromPrd, generatePrototype } from '../services/geminiService';
import type { Project, PageTask, ChatMessage } from '../types';
import Spinner from './Spinner';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: Omit<Project, 'id' | 'lastModified'>) => void;
}

const FileInput: React.FC<{id: string; label: string; accept: string; file: File | null; setFile: (file: File | null) => void, disabled: boolean}> = ({ id, label, accept, file, setFile, disabled }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-base-content mb-1">{label}</label>
        <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-base-300 border-dashed rounded-md ${disabled ? 'bg-base-100 opacity-50' : ''}`}>
            <div className="space-y-1 text-center">
                 <span className="material-symbols-outlined mx-auto text-5xl text-gray-400">
                  upload_file
                 </span>
                <div className="flex text-sm text-gray-400">
                    <label htmlFor={id} className={`relative cursor-pointer bg-base-200 rounded-md font-medium text-primary hover:text-primary-focus focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary px-1 ${disabled ? 'pointer-events-none' : ''}`}>
                        <span>Upload a file</span>
                        <input id={id} name={id} type="file" className="sr-only" accept={accept} onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} disabled={disabled} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                </div>
                {file ? <p className="text-xs text-gray-500">{file.name}</p> : <p className="text-xs text-gray-500">{accept}</p>}
            </div>
        </div>
    </div>
);


const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onCreateProject }) => {
  const [projectName, setProjectName] = useState('');
  const [corePrompt, setCorePrompt] = useState('');
  const [inspirationImage, setInspirationImage] = useState<File | null>(null);
  const [prdDocument, setPrdDocument] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !corePrompt.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
        setProcessingStep('Building brief...');
        const inspirationImageFile = inspirationImage ? await createProjectFile(inspirationImage) : null;
        const originalPrdFile = prdDocument ? await createProjectFile(prdDocument) : null;
        const consolidatedPrd = await consolidateProjectBrief(projectName, corePrompt, originalPrdFile);

        setProcessingStep('Extracting tasks...');
        const taskNames = await extractTasksFromPrd(consolidatedPrd);
        let tasks: PageTask[] = taskNames.map(name => ({ name, status: 'pending' }));

        setProcessingStep('Generating homepage...');
        const initialPrompt = "Generate the main page (index.html) for this project based on the provided documents.";
        const chatHistoryForGen: ChatMessage[] = [{ role: 'user', text: initialPrompt }];

        // Create a temporary, partial project object needed for the generation call
        const tempProjectForGen: Project = {
            id: '', name: projectName, lastModified: '',
            corePrompt: corePrompt,
            prdDocument: consolidatedPrd,
            inspirationImage: inspirationImageFile,
            generatedCode: [],
            chatHistory: chatHistoryForGen,
            tasks: tasks,
        };
        
        const generatedCode = await generatePrototype(tempProjectForGen, initialPrompt);
        
        const chatHistory: ChatMessage[] = [
            ...chatHistoryForGen,
            { role: 'model', text: "Here is the initial prototype." }
        ];
        
        // Mark homepage task as complete now that it has been generated
        if (tasks.length > 0) {
            const homepageIndex = tasks.findIndex(t => t.name.toLowerCase().includes('home') || t.name.toLowerCase().includes('index'));
            if (homepageIndex !== -1) {
                tasks[homepageIndex] = { ...tasks[homepageIndex], status: 'completed', fileName: 'index.html' };
            }
        }

        const projectData: Omit<Project, 'id' | 'lastModified'> = {
            name: projectName,
            corePrompt: corePrompt,
            inspirationImage: inspirationImageFile,
            prdDocument: consolidatedPrd,
            generatedCode,
            chatHistory,
            tasks,
        };
        
        onCreateProject(projectData);
        
        setProjectName('');
        setCorePrompt('');
        setInspirationImage(null);
        setPrdDocument(null);
        onClose();
    } catch (error) {
        console.error("Failed to create project:", error);
        alert("There was an error creating the project. Please check the console for details and try again.");
    } finally {
        setIsProcessing(false);
        setProcessingStep('');
    }
  }, [projectName, corePrompt, inspirationImage, prdDocument, onCreateProject, onClose, isProcessing]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-base-200 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold">Create New Project</h2>
                 <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-base-300 transition-colors" disabled={isProcessing}>
                    <span className="material-symbols-outlined">close</span>
                 </button>
            </div>
           
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium">Project Name</label>
              <input type="text" id="project-name" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="mt-1 block w-full bg-base-300 border-transparent rounded-md focus:ring-primary focus:border-primary disabled:opacity-50" required disabled={isProcessing} />
            </div>
            <div>
              <label htmlFor="core-prompt" className="block text-sm font-medium">Core Prompt</label>
              <textarea id="core-prompt" value={corePrompt} onChange={(e) => setCorePrompt(e.target.value)} rows={4} className="mt-1 block w-full bg-base-300 border-transparent rounded-md focus:ring-primary focus:border-primary disabled:opacity-50" placeholder="e.g., A landing page for a SaaS product that sells AI-powered gardening tools" required disabled={isProcessing}></textarea>
            </div>

            <FileInput id="inspiration-image" label="Inspiration Image (Optional)" accept=".jpg, .jpeg, .png, .webp" file={inspirationImage} setFile={setInspirationImage} disabled={isProcessing} />
            <FileInput id="prd-document" label="PRD / Document (Optional)" accept=".md,.txt,.pdf,.doc,.docx" file={prdDocument} setFile={setPrdDocument} disabled={isProcessing} />
          </div>
          <div className="bg-base-300 px-6 py-4 flex justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md hover:bg-base-100 mr-2" disabled={isProcessing}>Cancel</button>
            <button 
              type="submit" 
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-base-300 disabled:bg-gray-500 disabled:cursor-not-allowed w-48" 
              disabled={isProcessing || !projectName.trim() || !corePrompt.trim()}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <Spinner size="sm" />
                  <span className="ml-2">{processingStep || 'Processing...'}</span>
                </span>
              ) : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;