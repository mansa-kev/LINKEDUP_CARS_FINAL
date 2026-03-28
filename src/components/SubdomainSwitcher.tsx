import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubdomain, Subdomain } from '../contexts/SubdomainContext';

const sites: { id: Subdomain; label: string; color: string; path: string }[] = [
  { id: 'www', label: 'Public Site', color: 'bg-orange-500', path: '/' },
  { id: 'app', label: 'App Portal', color: 'bg-blue-500', path: '/client' },
  { id: 'fleet', label: 'Fleet Portal', color: 'bg-green-500', path: '/fleet' },
  { id: 'admin', label: 'Admin Command', color: 'bg-red-500', path: '/admin' },
];

export function SubdomainSwitcher() {
  const { subdomain, setPreviewSubdomain } = useSubdomain();
  const navigate = useNavigate();

  // Always show in development/preview environments
  const isDev = 
    window.location.hostname.includes('run.app') || 
    window.location.hostname === 'localhost' ||
    window.location.hostname.includes('google.com'); // AI Studio context

  if (!isDev) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2">
      <div className="flex gap-2 p-2 bg-black/90 backdrop-blur-xl rounded-full border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {sites.map((site) => (
          <button
            key={site.id}
            onClick={() => {
              console.log('Switching to:', site.id);
              setPreviewSubdomain(site.id);
              navigate(site.path);
            }}
            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              subdomain === site.id
                ? `${site.color} text-white scale-110 shadow-[0_0_20px_rgba(255,77,0,0.4)]`
                : 'text-gray-500 hover:text-white hover:bg-white/10'
            }`}
          >
            {site.label}
          </button>
        ))}
      </div>
      <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">
        Environment: {subdomain}
      </p>
    </div>
  );
}
