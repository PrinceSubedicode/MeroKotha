import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" id="loading-spinner"></div>
          <p className="text-sm font-medium text-gray-500">Loading MeroKotha...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page, but check current location for redirects
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Unauthorized, send back to home page
    return <Navigate to="/" replace />;
  }

  return children;
}
