import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAdminTheme } from '../contexts/AdminThemeContext';
import { motion, AnimatePresence } from 'motion/react';
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
  ChevronRight,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Truck,
  Clock,
  CreditCard,
  Loader2,
  Star,
  PenLine
} from 'lucide-react';

import { PortalHeader } from './PortalHeader';
import { Logo } from './shared/Logo';
import { LogoLoader } from './shared/LogoLoader';

// Lazy load admin components
const AdminDashboard = React.lazy(() => import('./admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminBookings = React.lazy(() => import('./admin/AdminBookings').then(m => ({ default: m.AdminBookings })));
const AdminCars = React.lazy(() => import('./admin/AdminCars').then(m => ({ default: m.AdminCars })));
const AdminUsers = React.lazy(() => import('./admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminDrivers = React.lazy(() => import('./admin/AdminDrivers').then(m => ({ default: m.AdminDrivers })));
const AdminFleetOwners = React.lazy(() => import('./admin/AdminFleetOwners').then(m => ({ default: m.AdminFleetOwners })));
const AdminVerification = React.lazy(() => import('./admin/AdminVerification').then(m => ({ default: m.AdminVerification })));
const AdminFinancials = React.lazy(() => import('./admin/AdminFinancials').then(m => ({ default: m.AdminFinancials })));
const AdminCarEarnings = React.lazy(() => import('./admin/AdminCarEarnings').then(m => ({ default: m.AdminCarEarnings })));
const AdminPricing = React.lazy(() => import('./admin/AdminPricing').then(m => ({ default: m.AdminPricing })));
const AdminReports = React.lazy(() => import('./admin/AdminReports').then(m => ({ default: m.AdminReports })));
const AdminInbox = React.lazy(() => import('./admin/AdminInbox').then(m => ({ default: m.AdminInbox })));
const AdminReviews = React.lazy(() => import('./admin/AdminReviews').then(m => ({ default: m.AdminReviews })));
const AdminGrowthTools = React.lazy(() => import('./admin/AdminGrowthTools').then(m => ({ default: m.AdminGrowthTools })));
const AdminIncidentCommand = React.lazy(() => import('./admin/AdminIncidentCommand').then(m => ({ default: m.AdminIncidentCommand })));
const AdminHeroContent = React.lazy(() => import('./admin/AdminHeroContent').then(m => ({ default: m.AdminHeroContent })));
const AdminContractManager = React.lazy(() => import('./admin/AdminContractManager').then(m => ({ default: m.AdminContractManager })));
const AdminSystemHealth = React.lazy(() => import('./admin/AdminSystemHealth').then(m => ({ default: m.AdminSystemHealth })));
const AdminSettings = React.lazy(() => import('./admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AdminLogout = React.lazy(() => import('./admin/AdminLogout').then(m => ({ default: m.AdminLogout })));
const AdminOutsourcedCars = React.lazy(() => import('./admin/AdminOutsourcedCars').then(m => ({ default: m.AdminOutsourcedCars })));
const AdminPromotions = React.lazy(() => import('./admin/AdminPromotions').then(m => ({ default: m.AdminPromotions })));
const AdminReservations = React.lazy(() => import('./admin/AdminReservations').then(m => ({ default: m.AdminReservations })));
const AdminPendingPayments = React.lazy(() => import('./admin/AdminPendingPayments').then(m => ({ default: m.AdminPendingPayments })));
const AdminBlog = React.lazy(() => import('./admin/AdminBlog').then(m => ({ default: m.AdminBlog })));

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
      { id: 'pending-payments', label: 'Pending Payments', icon: CreditCard },
      { id: 'reservations', label: 'Reservations', icon: Clock },
      { id: 'cars', label: 'Cars Management', icon: Car },
      { id: 'outsourced', label: 'Outsourced Cars', icon: Truck },
      { id: 'users', label: 'Users Management', icon: Users },
      { id: 'drivers', label: 'Drivers Management', icon: UserCheck },
    ]
  },
  {
    title: 'Partner Management',
    items: [
      { id: 'fleet-owners', label: 'Fleet Owners', icon: Building2 },
      { id: 'verification', label: 'Verification Queue', icon: ShieldCheck },
    ]
  },
  {
    title: 'Financials & Reporting',
    items: [
      { id: 'financials', label: 'Financials', icon: Wallet },
      { id: 'car-earnings', label: 'Car Earnings', icon: TrendingUp },
      { id: 'pricing', label: 'Pricing & Promotions', icon: Tag },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
    ]
  },
  {
    title: 'Communication & Growth',
    items: [
      { id: 'inbox', label: 'Inbox', icon: Inbox },
      { id: 'reviews', label: 'Reviews', icon: Star },
      { id: 'blog', label: 'Blog & Insights', icon: PenLine },
      { id: 'growth', label: 'Growth Tools', icon: Rocket },
      { id: 'incident', label: 'Incident Command', icon: AlertTriangle },
    ]
  },
  {
    title: 'System Configuration',
    items: [
      { id: 'hero', label: 'Hero Content', icon: Image },
      { id: 'contracts', label: 'Contracts', icon: FileText },
      { id: 'settings', label: 'Settings', icon: Settings },
    ]
  }
];

export function AdminPortal() {
  const location = useLocation();
  const { theme, setTheme } = useAdminTheme();
  const isDarkMode = theme === 'dark';
  const setIsDarkMode = (isDark: boolean) => setTheme(isDark ? 'dark' : 'light');

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(() => {
    const activeModule = location.pathname.split('/')[2] || 'dashboard';
    const active = MODULE_CATEGORIES.find(g => g.items.some(i => i.id === activeModule));
    return active?.title ?? 'Dashboard';
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const toggleGroup = useCallback((category: string) => {
    setExpandedGroup(prev => prev === category ? null : category);
  }, []);

  const activeModule = location.pathname.split('/')[2] || 'dashboard';

  const sidebarContent = (
    <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
      {MODULE_CATEGORIES.map((category) => {
        const isExpanded = expandedGroup === category.title;
        const hasActive = category.items.some(i => i.id === activeModule);

        return (
          <div key={category.title} className="mb-1">
            {(!isCollapsed || isMobile) ? (
              <button
                onClick={() => toggleGroup(category.title)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  hasActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{category.title}</span>
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            ) : (
              <div className="px-3 py-2">
                <div className="w-full h-px bg-border" />
              </div>
            )}

            <AnimatePresence initial={false}>
              {(isExpanded || isCollapsed) && (
                <motion.div
                  initial={isCollapsed ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={isCollapsed ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
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
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                          )}
                          <item.icon size={18} className={isActive ? 'text-primary' : ''} />
                          {(!isCollapsed || isMobile) && (
                            <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                          )}
                          {isCollapsed && !isMobile && (
                            <div className="absolute left-full ml-4 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                              {item.label}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background flex text-foreground transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex bg-card border-r border-border flex-col flex-shrink-0 sticky top-0 h-screen transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className="min-h-16 md:min-h-20 flex items-center px-6 border-b border-border">
          {!isCollapsed && <Logo size="lg" showText={false} />}
          {isCollapsed && <Logo size="md" showText={false} />}
        </div>
        {sidebarContent}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-12 border-t border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-72 bg-card border-r border-border z-50 flex flex-col shadow-2xl"
            >
              <div className="p-6 flex items-center justify-between">
                <Logo size="xl" showText={false} />
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
                >
                  <X size={20} />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header with Hamburger */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-4 text-muted-foreground hover:text-foreground"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>
        </div>

        <PortalHeader
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          portalType="admin"
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">
            <Suspense fallback={<LogoLoader />}>
              <Routes>
                <Route index element={<AdminDashboard />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="pending-payments" element={<AdminPendingPayments />} />
                <Route path="reservations" element={<AdminReservations />} />
                <Route path="cars" element={<AdminCars />} />
                <Route path="outsourced" element={<AdminOutsourcedCars />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="drivers" element={<AdminDrivers />} />
                <Route path="fleet-owners" element={<AdminFleetOwners />} />
                <Route path="verification" element={<AdminVerification />} />
                <Route path="financials" element={<AdminFinancials />} />
                <Route path="car-earnings" element={<AdminCarEarnings />} />
                <Route path="pricing" element={<AdminPromotions />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="inbox" element={<AdminInbox />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="blog" element={<AdminBlog />} />
                <Route path="growth" element={<AdminGrowthTools />} />
                <Route path="incident" element={<AdminIncidentCommand />} />
                <Route path="hero" element={<AdminHeroContent />} />
                <Route path="contracts" element={<AdminContractManager />} />
                <Route path="system-health" element={<AdminSystemHealth />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="logout" element={<AdminLogout />} />
                <Route path=":activeModule" element={<AdminModuleFallback />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
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
        This module is ready to be connected to Supabase.
      </p>
    </div>
  );
}
