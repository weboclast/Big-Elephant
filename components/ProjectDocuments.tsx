import React from 'react';
import type { Project, ProjectFile } from '../types';

const DocumentItem: React.FC<{ file: ProjectFile }> = ({ file }) => {
    const getIcon = () => {
        if (file.type.includes('image')) return <span className="material-symbols-outlined text-2xl text-gray-400 shrink-0">image</span>;
        if (file.type.includes('pdf')) return <span className="material-symbols-outlined text-2xl text-gray-400 shrink-0">picture_as_pdf</span>;
        return <span className="material-symbols-outlined text-2xl text-gray-400 shrink-0">description</span>;
    }
    return (
        <div className="bg-base-300 p-3 rounded-lg flex items-center space-x-3 hover:bg-base-100 transition-colors">
            {getIcon()}
            <span className="text-sm truncate flex-grow text-base-content">{file.name}</span>
        </div>
    );
}

const ProjectDocuments: React.FC<{ project: Project }> = ({ project }) => {
    return (
        <div className="space-y-6 animate-fade-in">
            {project.inspirationImage && (
                <div>
                    <h3 className="text-base font-semibold mb-2 text-gray-400">Inspiration Image</h3>
                    <div className="bg-base-300 p-3 rounded-lg space-y-3">
                        <img 
                            src={`data:${project.inspirationImage.type};base64,${project.inspirationImage.content}`} 
                            alt="Inspiration" 
                            className="rounded-md w-full object-cover max-h-60" 
                        />
                        <div className="flex items-center space-x-3 pt-2">
                            <span className="material-symbols-outlined text-2xl text-gray-400 shrink-0">image</span>
                            <span className="text-sm truncate text-base-content">{project.inspirationImage.name}</span>
                        </div>
                    </div>
                </div>
            )}

            {project.prdDocument && (
                <div>
                    <h3 className="text-base font-semibold mb-2 text-gray-400">PRD / Document</h3>
                    <DocumentItem file={project.prdDocument} />
                </div>
            )}

            {!project.inspirationImage && !project.prdDocument && (
                <div className="text-center py-10">
                    <p className="text-gray-500">No documents were attached to this project.</p>
                </div>
            )}
        </div>
    );
};

export default ProjectDocuments;