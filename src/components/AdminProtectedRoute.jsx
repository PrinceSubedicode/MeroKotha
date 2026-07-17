import React from 'react';
import { Navigate } from 'react-router-dom';

export default function AdminProtectedRoute({ children }) {
  const adminToken = localStorage.getItem('admin_token');
  const adminUser = localStorage.getItem('admin_user');

  if (!adminToken || !adminUser) {
    return <Navigate to="/admin" replace />;
  }

  try {
    const user = JSON.parse(adminUser);
    if (user.role !== 'Admin') {
      return <Navigate to="/admin" replace />;
    }
  } catch (err) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
