import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Car, 
  Users, 
  UserCheck, 
  Building2, 
  ShieldCheck, 
  Wallet, 
  TrendingUp, 
  Tag, 
  BarChart3, 
  Inbox, 
  Rocket, 
  AlertTriangle, 
  Settings, 
  Image, 
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { AdminDashboard } from './admin/AdminDashboard';
import { PortalHeader } from './PortalHeader';
import { AdminBookings } from './admin/AdminBookings';
import { AdminCars } from './admin/AdminCars';
import { AdminUsers } from './admin/AdminUsers';
import { AdminDrivers } from './admin/AdminDrivers';
import { AdminFleetOwners } from './admin/AdminFleetOwners';
import { AdminVerification } from './admin/AdminVerification';
import { AdminFinancials } from './admin/AdminFinancials';
import { AdminCarEarnings } from './admin/AdminCarEarnings';
import { AdminPricing } from './admin/AdminPricing';
import { AdminReports } from './admin/AdminReports';
import { AdminInbox } from './admin/AdminInbox';
import { AdminReviews } from './admin/AdminReviews';
import { AdminGrowthTools } from './admin/AdminGrowthTools';
import { AdminIncidentCommand } from './admin/AdminIncidentCommand';
import { AdminHeroContent } from './admin/AdminHeroContent';
import { AdminContractManager } from './admin/AdminContractManager';
import { AdminSystemHealth } from './admin/AdminSystemHealth';
import { AdminSettings } from './admin/AdminSettings';
import { AdminLogout } from './admin/AdminLogout';

// --- Types ---
type ModuleCategory = {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
  }[];
};

const MODULE_CATEGORIES: ModuleCategory[] = [
  {
    title: 'Dashboard',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Core Operations',
    items: [
      { id: 'bookings', label: 'Bookings Management', icon: Calendar },
      { id: 'cars', label: 'Cars Management', icon: Car },
      { id: 'users', label: 'Users Management', icon: Users },
      { id: 'drivers', label: 'Drivers Management', icon: UserCheck },
    ]
  },
  {
    title: 'Partner Management',
    items: [
      { id: 'fleet-owners', label: 'Fleet Owners Management', icon: Building2 },
      { id: 'verification', label: 'Verification Queue', icon: ShieldCheck },
    ]
  },
  {
    title: 'Financials & Reporting',
    items: [
      { id: 'financials', label: 'Financials', icon: Wallet },
      { id: 'car-earnings', label: 'Car Earnings', icon: TrendingUp },
      { id: 'pricing', label: 'Pricing', icon: Tag },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
    ]
  },
  {
    title: 'Communication & Growth',
    items: [
      { id: 'inbox', label: 'Inbox', icon: Inbox },
      { id: 'growth', label: 'Growth Tools', icon: Rocket },
      { id: 'incident', label: 'Incident Command', icon: AlertTriangle },
    ]
  },
  {
    title: 'System Configuration',
    items: [
      { id: 'hero', label: 'Hero Content Manager', icon: Image },
      { id: 'contracts', label: 'Contract Manager', icon: FileText },
      { id: 'settings', label: 'Settings', icon: Settings },
    ]
  }
];

// --- Components ---

const AdminSidebar = ({ 
  isCollapsed, 
  setIsCollapsed 
}: { 
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}) => {
  const location = useLocation();
  const activeModule = location.pathname.split('/')[2] || 'dashboard';

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-40 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-border">
        {!isCollapsed && (
          <span className="text-xl font-bold tracking-tighter text-primary">LINKEDUP ADMIN</span>
        )}
        {isCollapsed && <span className="text-xl font-bold text-primary mx-auto">L</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 scrollbar-hide">
        {MODULE_CATEGORIES.map((category) => (
          <div key={category.title} className="mb-6">
            {!isCollapsed && (
              <h3 className="px-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">
                {category.title}
              </h3>
            )}
            <div className="px-3 space-y-1">
              {category.items.map((item) => {
                const isActive = activeModule === item.id;
                return (
                  <Link
                    key={item.id}
                    to={item.id === 'dashboard' ? '/admin' : `/admin/${item.id}`}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {/* Active Indicator Bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                    )}
                    
                    <item.icon size={20} className={isActive ? 'text-primary' : ''} />
                    
                    {!isCollapsed && (
                      <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="h-12 border-t border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
    </aside>
  );
};

// --- Main Portal Component ---

export function AdminPortal() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const setIsDarkMode = (isDark: boolean) => setTheme(isDark ? 'dark' : 'light');

  return (
    <div className="min-h-screen bg-background flex text-foreground transition-colors duration-300">
      <AdminSidebar 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      
      <main className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'pl-20' : 'pl-72'}`}>
        <PortalHeader 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode} 
          portalType="admin" 
        />
        
        <div className="p-8">
          {/* Module Content Area */}
          <div className="max-w-[1600px] mx-auto">
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="cars" element={<AdminCars />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="drivers" element={<AdminDrivers />} />
              <Route path="fleet-owners" element={<AdminFleetOwners />} />
              <Route path="verification" element={<AdminVerification />} />
              <Route path="financials" element={<AdminFinancials />} />
              <Route path="car-earnings" element={<AdminCarEarnings />} />
              <Route path="pricing" element={<AdminPricing />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="inbox" element={<AdminInbox />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="growth" element={<AdminGrowthTools />} />
              <Route path="incident" element={<AdminIncidentCommand />} />
              <Route path="hero" element={<AdminHeroContent />} />
              <Route path="contracts" element={<AdminContractManager />} />
              <Route path="system-health" element={<AdminSystemHealth />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="logout" element={<AdminLogout />} />
              
              {/* Fallback for unknown modules */}
              <Route path=":activeModule" element={<AdminModuleFallback />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}

function AdminModuleFallback() {
  const location = useLocation();
  const activeModule = location.pathname.split('/')[2] || 'dashboard';
  const activeModuleLabel = MODULE_CATEGORIES
    .flatMap(c => c.items)
    .find(i => i.id === activeModule)?.label || 'Module';

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
        {React.createElement(MODULE_CATEGORIES.flatMap(c => c.items).find(i => i.id === activeModule)?.icon || LayoutDashboard, { size: 40 })}
      </div>
      <h1 className="text-3xl font-bold mb-2">{activeModuleLabel}</h1>
      <p className="text-muted-foreground max-w-md">
        This module is ready to be connected to Supabase. All UI components will adhere to the Modern Professional design system.
      </p>
    </div>
  );
}
