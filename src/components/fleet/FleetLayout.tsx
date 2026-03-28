import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  LayoutDashboard, 
  Car, 
  Wrench, 
  AlertTriangle, 
  DollarSign, 
  Receipt,
  Inbox, 
  CalendarCheck,
  FileText, 
  TrendingUp, 
  Settings as SettingsIcon,
  Menu,
  X,
  Bell,
  Search,
  User,
  Sun,
  Moon
} from 'lucide-react';
import { FleetDashboard } from './FleetDashboard';
import { MyCars } from './MyCars';
import { MyInbox } from './MyInbox';
import { ExpenseTracker } from './ExpenseTracker';
import { BookingRequests } from './BookingRequests';
import { DigitalVault } from './DigitalVault';
import { GrowthAndInsights } from './GrowthAndInsights';
import MaintenanceLogs from './MaintenanceLogs';
import DamageReports from './DamageReports';
import { FinancialCenter } from './FinancialCenter';
import { FleetSettings } from './FleetSettings';
import { PortalHeader } from '../PortalHeader';

const navGroups = [
  {
    category: 'Strategic Dashboard',
    items: [
      { name: 'Dashboard', path: '/fleet', icon: LayoutDashboard }
    ]
  },
  {
    category: 'Fleet Management',
    items: [
      { name: 'My Cars', path: '/fleet/cars', icon: Car },
      { name: 'Maintenance Logs', path: '/fleet/maintenance', icon: Wrench },
      { name: 'Damage Reports', path: '/fleet/damage', icon: AlertTriangle },
    ]
  },
  {
    category: 'Financials',
    items: [
      { name: 'Earnings & Payouts', path: '/fleet/financials', icon: DollarSign },
      { name: 'Expense Tracker', path: '/fleet/expenses', icon: Receipt },
    ]
  },
  {
    category: 'Operations & Communication',
    items: [
      { name: 'My Inbox', path: '/fleet/inbox', icon: Inbox },
      { name: 'Booking Requests', path: '/fleet/booking-requests', icon: CalendarCheck },
      { name: 'Digital Vault', path: '/fleet/vault', icon: FileText },
    ]
  },
  {
    category: 'Growth & Optimization',
    items: [
      { name: 'Growth & Insights', path: '/fleet/growth', icon: TrendingUp },
    ]
  },
  {
    category: 'Account Settings',
    items: [
      { name: 'Settings', path: '/fleet/settings', icon: SettingsIcon },
    ]
  }
];

export function FleetLayout() {
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
          portalType="fleet" 
        />

        <main className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route index element={<FleetDashboard />} />
            <Route path="cars" element={<MyCars />} />
            <Route path="maintenance" element={<MaintenanceLogs />} />
            <Route path="damage" element={<DamageReports />} />
            <Route path="financials" element={<FinancialCenter />} />
            <Route path="expenses" element={<ExpenseTracker />} />
            <Route path="inbox" element={<MyInbox />} />
            <Route path="booking-requests" element={<BookingRequests />} />
            <Route path="vault" element={<DigitalVault />} />
            <Route path="growth" element={<GrowthAndInsights />} />
            <Route path="settings" element={<FleetSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
