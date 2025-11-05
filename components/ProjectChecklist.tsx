import React from 'react';
import type { Project } from '../types';

interface ProjectChecklistProps {
    project: Project;
    onGeneratePage: (taskName: string) => void;
    onViewPage: (fileName: string) => void;
}

const ProjectChecklist: React.FC<ProjectChecklistProps> = ({ project, onGeneratePage, onViewPage }) => {
    if (!project.prdDocument) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500">No PRD document found to generate a task list.</p>
            </div>
        );
    }
    
    if (project.tasks.length === 0) {
         return (
            <div className="text-center py-10">
                <p className="text-gray-500">No tasks or pages were identified in the PRD.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 animate-fade-in">
             <h3 className="text-base font-semibold text-gray-400">Project Tasks</h3>
            {project.tasks.map((task) => {
                const isCompleted = task.status === 'completed';

                const content = (
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-3">
                            <span className={`material-symbols-outlined ${isCompleted ? 'text-green-400' : 'text-primary'}`}>
                                {isCompleted ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <span className={`text-sm ${isCompleted ? 'text-gray-500 line-through' : 'text-base-content'}`}>
                                {task.name}
                            </span>
                        </div>

                        {!isCompleted && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onGeneratePage(task.name); }}
                                className="px-3 py-1 text-xs font-medium text-primary-content bg-primary rounded-md hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-base-300"
                            >
                                Generate
                            </button>
                        )}
                    </div>
                );

                return (
                    <div
                        key={task.name}
                        onClick={() => isCompleted && task.fileName && onViewPage(task.fileName)}
                        className={`p-3 rounded-lg flex items-center justify-between transition-colors duration-200 ${
                            isCompleted ? (task.fileName ? 'bg-base-300 hover:bg-base-100 cursor-pointer' : 'bg-base-300') : 'bg-base-200'
                        }`}
                        title={isCompleted && task.fileName ? `Click to view ${task.name}` : ''}
                    >
                        {content}
                    </div>
                );
            })}
        </div>
    );
};

export default ProjectChecklist;