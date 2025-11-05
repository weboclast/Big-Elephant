import React, { useState, useRef, useEffect } from 'react';
import type { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect, onRename, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(prev => !prev);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRename();
    setIsMenuOpen(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setIsMenuOpen(false);
  };

  return (
    <div 
        onClick={onSelect}
        className="relative bg-base-200 rounded-lg shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-primary/50 hover:scale-105"
    >
        <div className="absolute top-2 right-2 z-10" ref={menuRef}>
            <button 
                onClick={handleMenuToggle}
                className="p-2 rounded-full bg-base-200/50 hover:bg-base-300/80 transition-colors"
                aria-label="Project options"
            >
                <span className="material-symbols-outlined">more_vert</span>
            </button>

            {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-base-300 rounded-md shadow-lg py-1 animate-fade-in-fast">
                <button 
                    onClick={handleRename}
                    className="w-full text-left px-4 py-2 text-sm text-base-content hover:bg-base-100 flex items-center space-x-2 transition-colors"
                >
                    <span className="material-symbols-outlined text-base">edit</span>
                    <span>Rename</span>
                </button>
                <button 
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-base-100 flex items-center space-x-2 transition-colors"
                >
                    <span className="material-symbols-outlined text-base">delete</span>
                    <span>Delete</span>
                </button>
            </div>
            )}
        </div>
      <div className="w-full h-40 bg-base-300 flex items-center justify-center">
        {project.inspirationImage ? (
            <img src={`data:${project.inspirationImage.type};base64,${project.inspirationImage.content}`} alt="Project thumbnail" className="w-full h-full object-cover" />
        ) : (
            <span className="material-symbols-outlined text-6xl text-base-100">
                auto_awesome
            </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold truncate pr-8">{project.name}</h3>
        <p className="text-sm text-gray-400">Last modified: {project.lastModified}</p>
      </div>
    </div>
  );
};

export default ProjectCard;