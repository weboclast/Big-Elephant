import React from 'react';

const BigElephantLogo = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-base-content">
        <path fillRule="evenodd" clipRule="evenodd" d="M16.5 7.5C16.5 5.29086 14.7091 3.5 12.5 3.5C10.2909 3.5 8.5 5.29086 8.5 7.5V11.5H5.75C5.47386 11.5 5.25 11.7239 5.25 12C5.25 12.2761 5.47386 12.5 5.75 12.5H8.5V17.5C8.5 18.0523 8.94772 18.5 9.5 18.5C10.0523 18.5 10.5 18.0523 10.5 17.5V12.5H13.5V17.5C13.5 18.0523 13.9477 18.5 14.5 18.5C15.0523 18.5 15.5 18.0523 15.5 17.5V12.5H18.25C18.5261 12.5 18.75 12.2761 18.75 12C18.75 11.7239 18.5261 11.5 18.25 11.5H15.5V7.5H16.5ZM12.5 5.5C13.6046 5.5 14.5 6.39543 14.5 7.5V11.5H10.5V7.5C10.5 6.39543 11.3954 5.5 12.5 5.5Z" fill="currentColor"/>
        <path d="M4 14.5C4 14.5 4.5 18.5 7.5 19.5C7.5 19.5 8 15 4 14.5Z" fill="currentColor"/>
        <path d="M20 14.5C20 14.5 19.5 18.5 16.5 19.5C16.5 19.5 16 15 20 14.5Z" fill="currentColor"/>
    </svg>
);


interface LayoutProps {
  children: React.ReactNode;
  currentPage: 'home' | 'workspaces';
  onNavigate: (page: 'home' | 'workspaces') => void;
  onNewProjectClick: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate, onNewProjectClick }) => {
  return (
    <div className="flex h-screen bg-base-100 text-base-content font-sans">
      {/* Sidebar */}
      <aside className="w-60 bg-base-200 border-r border-base-300 flex flex-col p-3">
        <div className="flex items-center space-x-2 p-2 mb-6">
          <BigElephantLogo />
          <h1 className="text-xl font-bold">Big Elephant</h1>
        </div>
        <nav className="flex-grow">
          <p className="text-xs text-subtle-text uppercase px-2 mb-2 font-semibold">Menu</p>
          <ul>
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
                className={`flex items-center space-x-3 p-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 'home' ? 'bg-base-300' : 'hover:bg-base-300/50'
                }`}
              >
                <span className="material-symbols-outlined text-xl">home</span>
                <span>Home</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); onNavigate('workspaces'); }}
                className={`flex items-center space-x-3 p-2 rounded-lg text-sm font-medium transition-colors mt-1 ${
                  currentPage === 'workspaces' ? 'bg-base-300' : 'hover:bg-base-300/50'
                }`}
              >
                <span className="material-symbols-outlined text-xl">workspaces</span>
                <span>Workspaces</span>
              </a>
            </li>
          </ul>
        </nav>
        <div className="mt-auto space-y-1">
            <a href="#" className="flex items-center space-x-3 p-2 rounded-lg text-sm font-medium transition-colors hover:bg-base-300/50 text-subtle-text hover:text-base-content">
                <span className="material-symbols-outlined text-xl">help</span>
                <span>Help Center</span>
            </a>
            <a href="#" className="flex items-center space-x-3 p-2 rounded-lg text-sm font-medium transition-colors hover:bg-base-300/50 text-subtle-text hover:text-base-content">
                <span className="material-symbols-outlined text-xl">settings</span>
                <span>Settings</span>
            </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 border-b border-base-300 shrink-0">
           <button onClick={onNewProjectClick} className="bg-primary text-primary-content px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 hover:bg-primary-focus transition-colors">
               <span className="material-symbols-outlined text-base">add</span>
               <span>New Prototype</span>
           </button>
           <div className="flex items-center space-x-4">
             {/* Github & Language selector can be added here */}
           </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
        <footer className="p-4 border-t border-base-300 text-xs text-subtle-text flex justify-between items-center shrink-0">
            <p>© 2025 Big Elephant. All rights reserved.</p>
            <div className="space-x-4">
                <a href="#" className="hover:text-base-content">Privacy Policy</a>
                <a href="#" className="hover:text-base-content">Terms of Service</a>
                <a href="#" className="hover:text-base-content">Cookie Settings</a>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
