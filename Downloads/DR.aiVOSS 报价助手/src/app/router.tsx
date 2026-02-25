import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface RouterContextType {
  path: string;
  navigate: (path: string) => void;
  params: Record<string, string>;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export function SimpleRouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (newPath: string) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
  };

  // Simple param extraction for /projects/:id
  const params: Record<string, string> = {};
  const projectMatch = path.match(/^\/projects\/([^/]+)/);
  if (projectMatch) {
    params.id = projectMatch[1];
  }

  return (
    <RouterContext.Provider value={{ path, navigate, params }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useSimpleRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useSimpleRouter must be used within a SimpleRouterProvider');
  }
  return context;
}
