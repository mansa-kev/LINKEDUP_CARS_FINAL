import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'fleet_owner' | 'client';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if requiredRole is specified
  if (requiredRole && profile?.role !== requiredRole) {
    // Redirect to appropriate portal based on user role
    const userRole = profile?.role || 'client';
    const redirectPath = userRole === 'admin' ? '/admin' : 
                        userRole === 'fleet_owner' ? '/fleet' : 
                        '/client';
    
    return <Navigate to={redirectPath} replace />;
  }

  // User is authenticated and has correct role
  return <>{children}</>;
}
