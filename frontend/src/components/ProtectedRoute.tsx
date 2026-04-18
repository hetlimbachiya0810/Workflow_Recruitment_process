import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard
    switch (user.role) {
      case Role.Admin:
        return <Navigate to="/admin/users" replace />;
      case Role.Recruiter:
        return <Navigate to="/recruiter/jds" replace />;
      case Role.Vendor:
        return <Navigate to="/vendor/jds" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
};
