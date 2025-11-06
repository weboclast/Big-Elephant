import React from 'react';

const BigElephantLogo = () => (
    <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <defs>
            <style>{`.cls-1{fill:#2d2d2d;}.cls-2{fill:#87868a;}.cls-3{fill:#646467;}.cls-4{fill:#d8d9dd;}`}</style>
        </defs>
        <title>elepant</title>
        <g id="goat">
            <circle className="cls-1" cx="27.5" cy="38.5" r="1.5"/>
        </g>
        <g id="elepant">
            <path className="cls-2" d="M49,22v7a20,20,0,0,1-.73,5.35l-.15.53-2.69,8.72A2,2,0,0,1,43.52,45H43V43.5a2.5,2.5,0,0,0-5,0V47A12,12,0,0,1,26,59H23a6,6,0,0,1-6-6h3a3,3,0,0,0,6,0V43.5a2.5,2.5,0,1,0-5,0V45h-.52a2,2,0,0,1-1.91-1.41l-2.69-8.72-.15-.53A20,20,0,0,1,15,29V22a17,17,0,0,1,34,0Z"/>
            <circle className="cls-1" cx="42.5" cy="29.38" r="1.5"/>
            <circle className="cls-1" cx="21.5" cy="29.38" r="1.5"/>
            <path className="cls-3" d="M61,13v7a6.13,6.13,0,0,1-.23,1.64l-2.53,9A6,6,0,0,1,52.46,35H51a6,6,0,0,1-2.73-.66A20,20,0,0,0,49,29V22a16.91,16.91,0,0,0-3.76-10.66A6,6,0,0,1,51,7h4A6,6,0,0,1,61,13Z"/>
            <path className="cls-3" d="M15,29a20,20,0,0,0,.73,5.35A6,6,0,0,1,13,35H11.54a6,6,0,0,1-5.78-4.37L3.23,21.68A6.13,6.13,0,0,1,3,20V13A6,6,0,0,1,9,7h4a6,6,0,0,1,5.76,4.34A16.91,16.91,0,0,0,15,22Z"/>
            <path className="cls-4" d="M43,43.5V51a5,5,0,0,1-5-5V43.5a2.5,2.5,0,1,1,5,0Z"/>
            <path className="cls-4" d="M26,43.5V46a5,5,0,0,1-5,5V43.5a2.5,2.5,0,0,1,5,0Z"/>
        </g>
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