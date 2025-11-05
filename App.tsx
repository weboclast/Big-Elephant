import React, { useState, useCallback, useEffect, useRef } from 'react';
import DashboardScreen from './components/DashboardScreen';
import StudioScreen from './components/StudioScreen';
import NewProjectModal from './components/NewProjectModal';
import type { Project } from './types';

const PROJECTS_STORAGE_KEY = 'big-elephant-projects';
const CURRENT_DATA_VERSION = 2; // Increment this for any future breaking data structure change

interface StoredData {
  version: number;
  projects: Project[];
}

interface LoadResult {
  projects: Project[];
  errorOccurred: boolean;
}

const loadAndMigrateProjects = (): LoadResult => {
  const savedDataString = localStorage.getItem(PROJECTS_STORAGE_KEY);
  if (!savedDataString) {
    return { projects: [], errorOccurred: false }; // No data, start fresh. This is safe.
  }

  try {
    const savedData = JSON.parse(savedDataString);
    let projectsToLoad: Project[] = [];
    let storedVersion = 0;

    // --- DATA VALIDATION AND EXTRACTION ---
    if (Array.isArray(savedData)) {
      // Legacy format (v1), an array of projects.
      storedVersion = 1;
      projectsToLoad = savedData;
    } else if (savedData && typeof savedData.version === 'number' && Array.isArray(savedData.projects)) {
      // Modern versioned format.
      storedVersion = savedData.version;
      projectsToLoad = savedData.projects;
    } else {
      // Unrecognized format. This is an error condition that we will handle in the catch block.
      throw new Error("Unrecognized data format found in localStorage.");
    }
    
    // --- MIGRATION PIPELINE ---
    // Note: Always work with a new variable to avoid unexpected mutations.
    let migratedProjects = projectsToLoad;

    if (storedVersion < 2) {
      // Migrate from v1 to v2: Add the `tasks` array to each project if it doesn't exist.
      migratedProjects = migratedProjects.map(p => ({
        ...p,
        tasks: p.tasks || [],
      }));
    }
    
    // Future migrations go here...
    // if (storedVersion < 3) { ... }

    return { projects: migratedProjects, errorOccurred: false }; // Success!

  } catch (error) {
    console.error("CRITICAL: Project loading failed. Backing up potentially corrupt data.", error);
    console.warn("Original data string:", savedDataString);

    // Create a timestamped backup of the problematic data.
    const backupKey = `${PROJECTS_STORAGE_KEY}-backup-${new Date().toISOString()}`;
    localStorage.setItem(backupKey, savedDataString);
    
    // Remove the original key to prevent repeated load failures.
    localStorage.removeItem(PROJECTS_STORAGE_KEY);

    // Inform the user. This is a last resort, but it's better than silent data loss.
    alert(
      "We're sorry, there was a problem loading your projects, likely due to an application update. " +
      "To protect your work, your existing data has been safely backed up and is NOT lost. " +
      "The application will start fresh for now. Please contact support or check your browser's developer console for the backup key if you need to recover your projects."
    );

    // Return an empty array after the backup is complete, and flag that an error occurred.
    return { projects: [], errorOccurred: true };
  }
};


const App: React.FC = () => {
  // Use a ref to ensure the loading logic runs exactly once on initial mount.
  const initialLoadRef = useRef<LoadResult | null>(null);
  if (initialLoadRef.current === null) {
      initialLoadRef.current = loadAndMigrateProjects();
  }

  const [projects, setProjects] = useState<Project[]>(initialLoadRef.current.projects);
  // This state is crucial: it prevents the app from overwriting the backed-up data
  // with an empty array if the initial load failed.
  const [allowSaving, setAllowSaving] = useState<boolean>(!initialLoadRef.current.errorOccurred);

  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // This effect is now guarded. It will NOT run and overwrite localStorage
    // if the initial load failed.
    if (!allowSaving) {
      return;
    }
    try {
      const dataToSave: StoredData = {
        version: CURRENT_DATA_VERSION,
        projects: projects,
      };
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Failed to save projects to localStorage", error);
    }
  }, [projects, allowSaving]);

  const handleCreateProject = useCallback((projectData: Omit<Project, 'id' | 'lastModified'>) => {
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
      lastModified: new Date().toLocaleDateString(),
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProject(newProject);
    // If the user creates a project, it's a clear signal they want to start saving data,
    // even if a previous load failed. This allows them to recover from the error state.
    setAllowSaving(true);
  }, []);

  const handleUpdateProject = useCallback((updatedProject: Project) => {
    setActiveProject(updatedProject);
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  }, []);

  const handleRenameProject = useCallback((projectId: string, newName: string) => {
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId
          ? { ...p, name: newName, lastModified: new Date().toLocaleDateString() }
          : p
      )
    );
  }, []);

  const handleDeleteProject = useCallback((projectId: string) => {
    setProjects(prevProjects => {
      const newProjects = prevProjects.filter(p => p.id !== projectId);
      // If the user deletes their very last project, we are in a clean, empty state.
      // We should allow this empty state to be saved.
      if (newProjects.length === 0) {
        setAllowSaving(true);
      }
      return newProjects;
    });
  }, []);


  const handleSelectProject = useCallback((project: Project) => {
    setActiveProject(project);
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setActiveProject(null);
  }, []);

  return (
    <>
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
      {activeProject ? (
        <StudioScreen
          project={activeProject}
          onBack={handleBackToDashboard}
          onUpdateProject={handleUpdateProject}
        />
      ) : (
        <DashboardScreen
          projects={projects}
          onSelectProject={handleSelectProject}
          onNewProjectClick={() => setIsModalOpen(true)}
          onRenameProject={handleRenameProject}
          onDeleteProject={handleDeleteProject}
        />
      )}
    </>
  );
};

export default App;