import React, { useEffect, useState } from 'react';
import type { GeneratedFile } from '../types';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: GeneratedFile[];
}

const CodeModal: React.FC<CodeModalProps> = ({ isOpen, onClose, files }) => {
  const [activeFileName, setActiveFileName] = useState<string>('');

  useEffect(() => {
    if (isOpen && files.length > 0) {
      if (!files.some(f => f.name === activeFileName)) {
        setActiveFileName(files[0].name);
      }
    }
  }, [isOpen, files, activeFileName]);
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;
  
  const activeFile = files.find(f => f.name === activeFileName);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-base-200 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-base-300">
          <h2 className="text-xl font-semibold">Generated Source Code</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-base-300">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="flex-shrink-0 border-b border-base-300 overflow-x-auto">
            <div className="flex space-x-2 p-2">
                {files.map(file => (
                    <button 
                        key={file.name}
                        onClick={() => setActiveFileName(file.name)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                            activeFileName === file.name 
                            ? 'bg-primary text-primary-content' 
                            : 'bg-base-300 hover:bg-base-100'
                        }`}
                    >
                        {file.name}
                    </button>
                ))}
            </div>
        </div>

        <div className="p-4 flex-grow overflow-hidden">
          <pre className="bg-base-100 h-full w-full overflow-auto rounded-md p-4 text-sm">
            <code className="text-base-content whitespace-pre-wrap">{activeFile?.content || 'No file selected or file is empty.'}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeModal;