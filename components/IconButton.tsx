
import React from 'react';

interface IconButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  label: string;
  isActive?: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, children, label, isActive = false }) => {
  const activeClasses = isActive ? 'bg-primary text-primary-content' : 'bg-base-200 hover:bg-base-300';
  
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary ${activeClasses}`}
    >
      {children}
    </button>
  );
};

export default IconButton;
