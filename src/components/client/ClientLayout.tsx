import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  LayoutDashboard, 
  Car, 
  FileText, 
  Award, 
  Inbox, 
  Settings as SettingsIcon,
  Menu,
  X,
  Bell,
  Search,
  User,
  Sun,
  Moon
} from 'lucide-react';
import { Dashboard } from './Dashboard';
import { DigitalGlovebox } from './DigitalGlovebox';
import { MyBookings } from './MyBookings';
import { MyProfile } from './MyProfile';
import { MyInbox } from './MyInbox';
import { Settings } from './Settings';
import { LoyaltyRewards } from './LoyaltyRewards';
import { PortalHeader } from '../PortalHeader';

const navGroups = [
  {
    category: 'Main',
    items: [
      { name: 'Dashboard', path: '/client', icon: LayoutDashboard },
      { name: 'My Bookings', path: '/client/bookings', icon: Car },
    ]
  },
  {
    category: 'Account',
    items: [
      { name: 'My Profile', path: '/client/profile', icon: User },
      { name: 'Digital Glovebox', path: '/client/glovebox', icon: FileText },
      { name: 'Loyalty & Rewards', path: '/client/rewards', icon: Award },
    ]
  },
  {
    category: 'Support',
    items: [
      { name: 'My Inbox', path: '/client/inbox', icon: Inbox },
      { name: 'Settings', path: '/client/settings', icon: SettingsIcon },
    ]
  }
];

export function ClientLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const setIsDarkMode = (isDark: boolean) => setTheme(isDark ? 'dark' : 'light');

  return (
    <div className="min-h-screen bg-background flex text-foreground transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-card border-r border-border transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && <span className="font-bold text-xl text-primary">LinkedUp</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-muted rounded-lg">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-6 overflow-y-auto pb-4">
          {navGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-2">
              {isSidebarOpen && (
                <h3 className="px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {group.category}
                </h3>
              )}
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                    title={!isSidebarOpen ? item.name : undefined}
                  >
                    <item.icon size={20} />
                    {isSidebarOpen && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <PortalHeader 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode} 
          portalType="client" 
        />

        <main className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="profile" element={<MyProfile />} />
            <Route path="glovebox" element={<DigitalGlovebox />} />
            <Route path="rewards" element={<LoyaltyRewards />} />
            <Route path="inbox" element={<MyInbox />} />
            <Route path="settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
