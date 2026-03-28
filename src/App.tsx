import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { useSubdomain } from './contexts/SubdomainContext';
import { SubdomainSwitcher } from './components/SubdomainSwitcher';
import { AdminPortal } from './components/AdminPortal';
import { DriverOnboardingForm } from './components/public/DriverOnboardingForm';
import { FleetLayout } from './components/fleet/FleetLayout';
import { ClientLayout } from './components/client/ClientLayout';
import { PublicLayout } from './components/public/PublicLayout';
import { PublicHome } from './components/public/PublicHome';
import { AboutUs } from './components/public/AboutUs';
import { Contact } from './components/public/Contact';
import { BrowseCars } from './components/public/BrowseCars';
import { CarDetails } from './components/public/CarDetails';
import { BookingConfirmation } from './components/public/BookingConfirmation';

export default function App() {
  const { subdomain } = useSubdomain();

  // Debug log for subdomain detection
  console.log('Current Subdomain:', subdomain);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <div className="relative min-h-screen">
            <Toaster position="top-right" richColors />
            
            {subdomain === 'www' && (
            <PublicLayout>
              <Routes>
                <Route path="/" element={<PublicHome />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/cars" element={<BrowseCars />} />
                <Route path="/cars/:id" element={<CarDetails />} />
                <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </PublicLayout>
          )}
          
          {subdomain === 'onboarding' && (
            <Routes>
              <Route path="/" element={<DriverOnboardingForm />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
          
          {subdomain === 'app' && (
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/client/*" element={<ClientLayout />} />
                <Route path="*" element={<Navigate to="/client" replace />} />
              </Routes>
            </div>
          )}
          
          {subdomain === 'admin' && (
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/admin/*" element={<AdminPortal />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </div>
          )}
          
          {subdomain === 'fleet' && (
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/fleet/*" element={<FleetLayout />} />
                <Route path="*" element={<Navigate to="/fleet" replace />} />
              </Routes>
            </div>
          )}
          
          {/* Dev Switcher for previewing subdomains */}
          <SubdomainSwitcher />
        </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
