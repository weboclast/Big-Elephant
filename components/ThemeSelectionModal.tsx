import React from 'react';

interface ThemeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTheme: string;
  onSelectTheme: (theme: string) => void;
}

const themes = [
    { name: 'Material Design', description: 'Google\'s adaptable design system.' },
    // { name: 'Fluent UI', description: 'Microsoft\'s design system.' }, // Example for future
];

const ThemeSelectionModal: React.FC<ThemeSelectionModalProps> = ({ isOpen, onClose, selectedTheme, onSelectTheme }) => {
  if (!isOpen) return null;

  const handleSelect = (themeName: string) => {
    onSelectTheme(themeName);
    onClose();
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 animate-fade-in-fast" 
        onClick={onClose}
    >
      <div 
        className="bg-base-200 rounded-lg shadow-xl w-full max-w-md flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-base-300">
          <h2 className="text-xl font-semibold">Select a Theme</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-base-300">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-4 space-y-2">
            {themes.map(theme => {
                const isSelected = theme.name === selectedTheme;
                return (
                    <button 
                        key={theme.name}
                        onClick={() => handleSelect(theme.name)}
                        className={`w-full text-left p-4 rounded-lg flex justify-between items-center transition-colors duration-200 ${
                            isSelected ? 'bg-primary/20 border-2 border-primary' : 'bg-base-300 hover:bg-base-100'
                        }`}
                    >
                        <div>
                            <p className={`font-semibold ${isSelected ? 'text-primary' : 'text-base-content'}`}>{theme.name}</p>
                            <p className="text-sm text-subtle-text">{theme.description}</p>
                        </div>
                        {isSelected && <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>}
                    </button>
                )
            })}
        </div>
        <div className="p-4 text-xs text-subtle-text text-center border-t border-base-300">
            More design systems coming soon!
        </div>
      </div>
    </div>
  );
};

export default ThemeSelectionModal;
