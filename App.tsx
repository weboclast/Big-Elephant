import React, { useState, useCallback, useEffect, useRef } from 'react';
import StudioScreen from './components/StudioScreen';
import type { Project } from './types';
import Layout from './components/Layout';
import HomeScreen from './components/HomeScreen';
import DashboardScreen from './components/DashboardScreen';

const PROJECTS_STORAGE_KEY = 'big-elephant-projects';
const CURRENT_DATA_VERSION = 4; // Increment this for any future breaking data structure change

interface StoredData {
  version: number;
  projects: Project[];
}

interface LoadResult {
  projects: Project[];
  errorOccurred: boolean;
}

/**
 * Checks if localStorage is available and writable.
 * @returns {boolean} True if localStorage is supported, false otherwise.
 */
const isLocalStorageSupported = (): boolean => {
    try {
        const testKey = '__testLocalStorage__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
};


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
    let migratedProjects = projectsToLoad;

    if (storedVersion < 2) {
      // Migrate from v1 to v2: Add the `tasks` array to each project if it doesn't exist.
      migratedProjects = migratedProjects.map(p => ({
        ...p,
        tasks: p.tasks || [],
      }));
    }
    if (storedVersion < 3) {
      // Migrate from v2 to v3: Add the `theme` property to each project.
       migratedProjects = migratedProjects.map(p => ({
        ...p,
        theme: p.theme || 'Material Design',
      }));
    }
     if (storedVersion < 4) {
      // Migrate from v3 to v4: Convert single inspirationImage to inspirationImages array.
      migratedProjects = migratedProjects.map(p => {
        const newProject = { ...p } as any; // Use any to handle dynamic properties
        const oldInspiration = newProject.inspirationImage;
        if (oldInspiration) {
          newProject.inspirationImages = [oldInspiration];
          newProject.activeInspirationImageIndex = 0;
        } else {
          newProject.inspirationImages = [];
          newProject.activeInspirationImageIndex = -1;
        }
        delete newProject.inspirationImage;
        return newProject as Project;
      });
    }
    
    // Future migrations go here...
    // if (storedVersion < 5) { ... }

    return { projects: migratedProjects, errorOccurred: false }; // Success!

  } catch (error) {
    console.error("CRITICAL: Project loading failed. Backing up potentially corrupt data.", error);
    console.warn("Original data string:", savedDataString);

    const backupKey = `${PROJECTS_STORAGE_KEY}-backup-${new Date().toISOString()}`;
    localStorage.setItem(backupKey, savedDataString);
    
    localStorage.removeItem(PROJECTS_STORAGE_KEY);

    alert(
      "We're sorry, there was a problem loading your projects, likely due to an application update. " +
      "To protect your work, your existing data has been safely backed up and is NOT lost. " +
      "The application will start fresh for now. Please contact support or check your browser's developer console for the backup key if you need to recover your projects."
    );

    return { projects: [], errorOccurred: true };
  }
};


const App: React.FC = () => {
  const initialLoadRef = useRef<LoadResult | null>(null);
  if (initialLoadRef.current === null) {
      initialLoadRef.current = loadAndMigrateProjects();
  }

  const [projects, setProjects] = useState<Project[]>(initialLoadRef.current.projects);
  const [allowSaving, setAllowSaving] = useState<boolean>(!initialLoadRef.current.errorOccurred);

  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'workspaces'>('home');
  
  useEffect(() => {
    if (!isLocalStorageSupported()) {
        alert("Warning: Your browser appears to have Local Storage disabled. Project data will not be saved between sessions.");
    }
  }, []);

  useEffect(() => {
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
      alert("Error: Could not save your project. Your browser's local storage might be full or disabled. Please check the browser console for more details.");
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
    setCurrentPage('workspaces'); 
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
    setCurrentPage('workspaces');
  }, []);

  const handleNavigate = useCallback((page: 'home' | 'workspaces') => {
    setCurrentPage(page);
  }, []);


  if (activeProject) {
    return (
       <StudioScreen
          project={activeProject}
          onBack={handleBackToDashboard}
          onUpdateProject={handleUpdateProject}
        />
    )
  }

  return (
    <>
      <Layout 
        currentPage={currentPage} 
        onNavigate={handleNavigate}
        onNewProjectClick={() => handleNavigate('home')}
      >
        {currentPage === 'home' && (
            <HomeScreen onCreateProject={handleCreateProject} />
        )}
        {currentPage === 'workspaces' && (
            <DashboardScreen
                projects={projects}
                onSelectProject={handleSelectProject}
                onRenameProject={handleRenameProject}
                onDeleteProject={handleDeleteProject}
            />
        )}
      </Layout>
    </>
  );
};

export default App;
