import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import Home from './pages/Home.jsx';
import Properties from './pages/Properties.jsx';
import PropertyDetails from './pages/PropertyDetails.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import Contact from './pages/Contact.jsx';
import TenantDashboard from './pages/TenantDashboard.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800" id="merokotha-app">
            
            {/* Responsive Header Navigation */}
            <Navbar />

            {/* Core Route Screens */}
            <main className="flex-grow flex flex-col">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/properties" element={<Properties />} />
                <Route path="/properties/:id" element={<PropertyDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/contact" element={<Contact />} />

                {/* General Protected Routes */}
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />

                {/* Role-Based Secured Dashboards */}
                <Route 
                  path="/tenant-dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['Tenant']}>
                      <TenantDashboard />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/owner-dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['Property Owner']}>
                      <OwnerDashboard />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/admin-dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />

                {/* Fallback Catch-All */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Platform Footer */}
            <Footer />

          </div>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
