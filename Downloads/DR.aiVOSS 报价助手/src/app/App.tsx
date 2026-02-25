import React from 'react';
import { SimpleRouterProvider, useSimpleRouter } from './router';
import { Sidebar } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import { Button } from './components/ui/shared';
import { AlertCircle } from 'lucide-react';

function AppContent() {
  const { path } = useSimpleRouter();

  let content;
  if (path === '/') {
    content = <Dashboard />;
  } else if (path.startsWith('/projects/')) {
    content = <ProjectDetail />;
  } else {
    // Placeholder for other routes
    content = (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-center p-8">
        <div className="bg-slate-100 p-4 rounded-full mb-4 dark:bg-slate-800">
           <AlertCircle size={32} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Page Under Construction</h2>
        <p className="text-slate-500 max-w-md mt-2 mb-6">
           The page "{path}" is currently being built. Please check back later or return to the dashboard.
        </p>
        <Button onClick={() => window.history.back()} variant="outline">
           Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar className="hidden md:flex" />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {content}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SimpleRouterProvider>
      <AppContent />
    </SimpleRouterProvider>
  );
}
