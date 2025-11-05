import React from 'react';
import type { Project } from '../types';
import ProjectCard from './ProjectCard';

interface DashboardScreenProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onNewProjectClick: () => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onDeleteProject: (projectId: string) => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ projects, onSelectProject, onNewProjectClick, onRenameProject, onDeleteProject }) => {

  const handleRename = (project: Project) => {
    const newName = prompt("Enter new project name:", project.name);
    if (newName && newName.trim() !== "" && newName.trim() !== project.name) {
      onRenameProject(project.id, newName.trim());
    }
  };

  const handleDelete = (project: Project) => {
    if (confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      onDeleteProject(project.id);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-base-content">Big Elephant</h1>
        <p className="text-gray-400 mt-2">Your projects at a glance. Select a project to edit or create a new one.</p>
      </header>
      
      {projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-gray-500">No projects yet. Click the '+' button to start building!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {projects.map(p => (
            <ProjectCard 
              key={p.id} 
              project={p} 
              onSelect={() => onSelectProject(p)} 
              onRename={() => handleRename(p)}
              onDelete={() => handleDelete(p)}
            />
          ))}
        </div>
      )}

      <button
        onClick={onNewProjectClick}
        title="Create New Project"
        className="fixed bottom-8 right-8 w-16 h-16 bg-secondary rounded-full text-white flex items-center justify-center shadow-lg hover:bg-secondary-focus transition-transform transform hover:scale-110"
      >
        <span className="material-symbols-outlined text-4xl">
          add
        </span>
      </button>
    </div>
  );
};

export default DashboardScreen;