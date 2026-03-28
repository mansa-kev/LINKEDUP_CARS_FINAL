import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Calendar, 
  User, 
  Menu, 
  X, 
  Phone, 
  Info, 
  HelpCircle, 
  FileText, 
  Shield 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const mainNav: NavItem[] = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Browse', path: '/cars', icon: Search },
  { label: 'Bookings', path: '/bookings', icon: Calendar },
  { label: 'Account', path: '/account', icon: User },
];

const secondaryNav: NavItem[] = [
  { label: 'About Us', path: '/about', icon: Info },
  { label: 'How It Works', path: '/how-it-works', icon: HelpCircle },
  { label: 'Contact', path: '/contact', icon: Phone },
  { label: 'FAQ', path: '/faq', icon: HelpCircle },
  { label: 'Terms', path: '/terms', icon: FileText },
  { label: 'Privacy', path: '/privacy', icon: Shield },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Desktop Header */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 h-20 glass z-50 items-center justify-between px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-serif font-black tracking-tighter text-primary italic">LINKEDUP</span>
        </Link>

        <nav className="flex items-center gap-8">
          {mainNav.slice(0, 2).map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                location.pathname === item.path ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
          {secondaryNav.slice(0, 2).map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                location.pathname === item.path ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Search size={20} />
          </button>
          <Link 
            to="/contact" 
            className="px-6 py-2 border border-primary/20 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary/10 transition-all"
          >
            Contact
          </Link>
          <Link 
            to="/login" 
            className="px-6 py-2 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
          >
            Login / Sign Up
          </Link>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 glass z-50 flex items-center justify-between px-6">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu size={24} />
        </button>
        <Link to="/" className="font-serif font-black tracking-tighter text-primary italic text-xl">
          LINKEDUP
        </Link>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-card z-[70] p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <span className="font-serif font-black tracking-tighter text-primary italic text-2xl">LINKEDUP</span>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-muted-foreground">
                  <X size={24} />
                </button>
              </div>

              <nav className="flex flex-col gap-6">
                {secondaryNav.map((item) => (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-4 text-lg font-bold text-muted-foreground hover:text-primary transition-colors"
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto pt-8 border-t border-border">
                <Link 
                  to="/login" 
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-center block shadow-lg shadow-primary/20"
                >
                  Login / Sign Up
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 pt-16 md:pt-20 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 glass-dark z-50 flex items-center justify-around px-4 border-t border-white/5">
        {mainNav.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className="flex flex-col items-center gap-1 group"
            >
              <div className={`p-2 rounded-xl transition-all ${
                isActive ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'text-muted-foreground group-hover:text-foreground'
              }`}>
                <item.icon size={20} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-tighter ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Footer */}
      <footer className="hidden md:block bg-card border-t border-border py-20 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-4 gap-12">
          <div className="col-span-2">
            <span className="text-3xl font-serif font-black tracking-tighter text-primary italic mb-6 block">LINKEDUP</span>
            <p className="text-muted-foreground max-w-sm leading-relaxed">
              Experience the pinnacle of luxury car rentals. Our curated fleet and personalized service ensure every journey is unforgettable.
            </p>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-foreground">Quick Links</h4>
            <div className="flex flex-col gap-4">
              {secondaryNav.slice(0, 4).map(item => (
                <Link key={item.path} to={item.path} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs mb-6 text-foreground">Legal</h4>
            <div className="flex flex-col gap-4">
              {secondaryNav.slice(4).map(item => (
                <Link key={item.path} to={item.path} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-border flex justify-between items-center">
          <p className="text-xs text-muted-foreground">© 2026 LinkedUp Car Rentals. All rights reserved.</p>
          <div className="flex gap-6">
            {/* Social icons would go here */}
          </div>
        </div>
      </footer>
    </div>
  );
}
