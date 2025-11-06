import React from 'react';
import type { Project } from '../types';
import ProjectCard from './ProjectCard';

interface DashboardScreenProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onDeleteProject: (projectId: string) => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ projects, onSelectProject, onRenameProject, onDeleteProject }) => {

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
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-base-content">Workspaces</h1>
        <p className="text-subtle-text mt-1">Your projects at a glance. Select a project to edit or create a new one.</p>
      </header>
      
      {projects.length === 0 ? (
        <div className="text-center py-20 bg-base-200 rounded-lg">
          <span className="material-symbols-outlined text-6xl text-base-300">
            folder_off
          </span>
          <p className="text-lg mt-4 text-subtle-text">You don't have any projects yet.</p>
          <p className="text-sm text-subtle-text">Click "New Prototype" to start building!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
    </div>
  );
};

export default DashboardScreen;