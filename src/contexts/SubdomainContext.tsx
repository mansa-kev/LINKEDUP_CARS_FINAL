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
    const searchParams = new URLSearchParams(window.location.search);
    
    // 1. Check for query parameter override (for preview environment)
    const siteParam = searchParams.get('site');
    if (siteParam === 'app' || siteParam === 'admin' || siteParam === 'www' || siteParam === 'fleet') {
      console.log('[SubdomainContext] Detected via query param:', siteParam);
      setSubdomain(siteParam as Subdomain);
      return;
    }

    // 2. Check actual subdomain (for production)
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
    const url = new URL(window.location.href);
    url.searchParams.set('site', newSubdomain);
    window.history.pushState({}, '', url.toString());
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
