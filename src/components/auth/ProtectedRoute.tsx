import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'fleet_owner' | 'client';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  // TEMPORARILY BYPASSED FOR DEVELOPMENT
  // All authentication checks are disabled so you can focus on UI refinement.
  return <>{children}</>;
}
