import React, { useState } from 'react';

interface HomeScreenProps {
  onNewProjectClick: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNewProjectClick }) => {
  const [prompt, setPrompt] = useState('');

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    // In a more complex app, this might pre-fill the modal
    // For now, we just open it.
    onNewProjectClick();
  };
  
  return (
    <div className="h-full flex flex-col justify-center items-center text-center animate-fade-in">
      <div className="max-w-3xl w-full">
        <h1 className="text-5xl font-bold text-base-content leading-tight">Got something on your mind?</h1>
        <h2 className="text-5xl font-bold text-accent mt-2">Let's build your prototype.</h2>

        <div className="mt-12 bg-base-200 p-4 rounded-2xl shadow-lg w-full">
            <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-subtle-text">auto_awesome</span>
                <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onFocus={onNewProjectClick} // Open modal on focus for a quick entry
                    placeholder="Ask a question or make a request..."
                    className="w-full bg-base-100 border border-base-300 rounded-xl pl-12 pr-16 py-4 focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-subtle-text cursor-pointer"
                />
                <button onClick={onNewProjectClick} className="absolute right-2 top-1/2 -translate-y-1/2 bg-base-content text-base-200 p-2.5 rounded-lg hover:opacity-80 transition-opacity">
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
            <div className="mt-4 flex flex-wrap justify-between items-center text-sm text-subtle-text px-2">
                <div className="flex items-center space-x-6">
                    <button onClick={onNewProjectClick} className="flex items-center space-x-1.5 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-lg">upload</span>
                        <span>Upload a design Inspiration</span>
                    </button>
                    <button onClick={onNewProjectClick} className="flex items-center space-x-1.5 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-lg">description</span>
                        <span>Upload a PRD Document/Deck</span>
                    </button>
                    <button onClick={onNewProjectClick} className="flex items-center space-x-1.5 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-lg">tune</span>
                        <span>Theme (Material Design 3)</span>
                    </button>
                </div>
                <button onClick={onNewProjectClick} className="text-subtle-text hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">settings</span>
                </button>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
                <button onClick={() => handleSuggestionClick('Build a SaaS landing page')} className="bg-base-100 px-3 py-1.5 rounded-lg text-sm hover:bg-base-300 transition-colors">Build a SaaS landing page</button>
                <button onClick={() => handleSuggestionClick('Build a ecommerce mobile app prototype')} className="bg-base-100 px-3 py-1.5 rounded-lg text-sm hover:bg-base-300 transition-colors">Build an ecommerce mobile app</button>
                <button onClick={() => handleSuggestionClick('Build a portfolio')} className="bg-base-100 px-3 py-1.5 rounded-lg text-sm hover:bg-base-300 transition-colors">Build a portfolio</button>
                <button onClick={onNewProjectClick} className="bg-base-100 px-2 py-1.5 rounded-lg text-sm hover:bg-base-300 transition-colors">...</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
