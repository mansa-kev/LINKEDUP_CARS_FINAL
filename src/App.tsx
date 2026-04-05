import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { useSubdomain } from './contexts/SubdomainContext';
import { SubdomainSwitcher } from './components/SubdomainSwitcher';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ContractDebug } from './components/debug/ContractDebug';
import { Login } from './components/auth/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
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
import { HowItWorks } from './components/public/HowItWorks';
import { FAQ } from './components/public/FAQ';
import { Terms } from './components/public/Terms';
import { Privacy } from './components/public/Privacy';
import { SunsetRays } from './components/SunsetRays';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  const { subdomain } = useSubdomain();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <div className="relative min-h-screen">
              <Toaster position="top-right" richColors />
              <SunsetRays />
              
              {subdomain === 'www' && (
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={
                  <PublicLayout>
                    <Routes>
                      <Route path="/" element={<PublicHome />} />
                      <Route path="/about" element={<AboutUs />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/cars" element={<BrowseCars />} />
                      <Route path="/cars/:id" element={<CarDetails />} />
                      <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
                      <Route path="/how-it-works" element={<HowItWorks />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/debug-contracts" element={<ContractDebug />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </PublicLayout>
                } />
              </Routes>
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
                <Route path="/login" element={<Login />} />
                <Route path="/client/*" element={
                  <ProtectedRoute requiredRole="client">
                    <ClientLayout />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/client" replace />} />
              </Routes>
            </div>
          )}

          {subdomain === 'admin' && (
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/admin/*" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPortal />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </div>
          )}

          {subdomain === 'fleet' && (
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/fleet/*" element={
                  <ProtectedRoute requiredRole="fleet_owner">
                    <FleetLayout />
                  </ProtectedRoute>
                } />
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
    <Analytics />
    </ErrorBoundary>
  );
}
