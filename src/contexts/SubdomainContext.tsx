import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Subdomain = 'www' | 'app' | 'admin' | 'fleet';

interface SubdomainContextType {
  subdomain: Subdomain;
  setPreviewSubdomain: (newSubdomain: Subdomain) => void;
}

const SubdomainContext = createContext<SubdomainContextType | undefined>(undefined);

export function SubdomainProvider({ children }: { children: ReactNode }) {
  const [subdomain, setSubdomain] = useState<Subdomain>('www');

  const detectSubdomain = () => {
    const hostname = window.location.hostname;
    
    // SECURITY: Removed query parameter override to prevent unauthorized access
    // Admin access now requires proper authentication
    
    // Check actual subdomain (for production)
    if (hostname.startsWith('admin.')) {
      console.log('[SubdomainContext] Detected via hostname: admin');
      setSubdomain('admin');
    } else if (hostname.startsWith('app.')) {
      console.log('[SubdomainContext] Detected via hostname: app');
      setSubdomain('app');
    } else if (hostname.startsWith('fleet.')) {
      console.log('[SubdomainContext] Detected via hostname: fleet');
      setSubdomain('fleet');
    } else {
      console.log('[SubdomainContext] Detected via hostname: default (www)');
      setSubdomain('www');
    }
  };

  useEffect(() => {
    detectSubdomain();
    
    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', detectSubdomain);
    return () => window.removeEventListener('popstate', detectSubdomain);
  }, []);

  const setPreviewSubdomain = (newSubdomain: Subdomain) => {
    console.log('[SubdomainContext] Manually switching to:', newSubdomain);
    // SECURITY: Removed URL parameter manipulation to prevent unauthorized access
    // This function now only updates the internal state for development
    setSubdomain(newSubdomain);
  };

  return (
    <SubdomainContext.Provider value={{ subdomain, setPreviewSubdomain }}>
      {children}
    </SubdomainContext.Provider>
  );
}

export function useSubdomain() {
  const context = useContext(SubdomainContext);
  if (context === undefined) {
    throw new Error('useSubdomain must be used within a SubdomainProvider');
  }
  return context;
}
