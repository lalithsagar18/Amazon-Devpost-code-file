import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

const routeTitles: Record<string, string> = {
  '/': 'Overview Dashboard',
  '/chat': 'AI Productivity Assistant',
  '/tasks': 'Task Management',
  '/schedule': 'Calendar & Free-Time Planning',
  '/notes': 'Notes Management',
  '/study-planner': 'Exam & Study Planner',
  '/agent': 'Agent Runs & Execution History',
  '/tools': 'Connected MCP Tools',
  '/settings': 'Application Settings',
};

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const currentTitle = routeTitles[location.pathname] || 'LifePilot AI';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Navbar onMenuClick={() => setMobileOpen(true)} title={currentTitle} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
