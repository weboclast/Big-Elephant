import React, { useRef } from 'react';
import type { Project, ProjectFile } from '../types';
import { createProjectFile } from '../utils/fileUtils';

interface DesignInspirationsProps {
  project: Project;
  onUpdateInspirations: (newImages: ProjectFile[], newActiveIndex: number) => void;
}

const DesignInspirations: React.FC<DesignInspirationsProps> = ({ project, onUpdateInspirations }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const newImageFile = await createProjectFile(file);
            const newImages = [...project.inspirationImages, newImageFile];
            // When a new image is added, make it the active one.
            const newActiveIndex = newImages.length - 1;
            onUpdateInspirations(newImages, newActiveIndex);
        }
    };
    
    const handleSelectImage = (index: number) => {
        if (project.activeInspirationImageIndex !== index) {
            onUpdateInspirations(project.inspirationImages, index);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h3 className="text-base font-semibold mb-2 text-gray-400">Inspiration Images</h3>
                <p className="text-sm text-gray-500 mb-4">
                    {project.inspirationImages.length > 0
                        ? 'Select an image to guide the visual design. The AI will adopt its colors and style.'
                        : 'Upload an image to inspire the design. Otherwise, the default theme styles will be used.'}
                </p>
                <div className="grid grid-cols-2 gap-4">
                    {project.inspirationImages.map((image, index) => {
                        const isActive = index === project.activeInspirationImageIndex;
                        return (
                            <div 
                                key={index}
                                onClick={() => handleSelectImage(index)}
                                className={`relative rounded-lg overflow-hidden cursor-pointer group transition-all duration-200 ${isActive ? 'ring-4 ring-primary ring-offset-2 ring-offset-base-200' : 'ring-2 ring-transparent hover:ring-accent'}`}
                            >
                                <img 
                                    src={`data:${image.type};base64,${image.content}`} 
                                    alt={`Inspiration ${index + 1}`}
                                    className="w-full h-32 object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                                    {isActive && (
                                        <div className="absolute top-2 right-2 p-1 bg-primary rounded-full">
                                            <span className="material-symbols-outlined text-primary-content text-lg">check</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-32 border-2 border-dashed border-base-300 rounded-lg flex flex-col items-center justify-center text-subtle-text hover:bg-base-300 hover:border-accent hover:text-accent transition-colors"
                    >
                         <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                         <span className="text-sm font-medium mt-1">Upload Image</span>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default DesignInspirations;
