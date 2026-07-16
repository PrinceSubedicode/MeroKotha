import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import MeroKothaLogo from './MeroKothaLogo.jsx';
import { Menu, X, User, LogOut, PlusCircle, Bookmark, ClipboardList, Shield, Moon, Sun, ArrowLeftRight } from 'lucide-react';

export default function Navbar() {
  const { user, logout, favorites, switchRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const location = useLocation();

  const handleRoleSwitch = async () => {
    const targetRole = user.role === 'Tenant' ? 'Property Owner' : 'Tenant';
    const res = await switchRole(targetRole);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Role Switched',
        message: `Switched to ${targetRole} mode.`
      });
      const nextDashboard = targetRole === 'Property Owner' ? '/owner-dashboard' : '/tenant-dashboard';
      navigate(nextDashboard);
    } else {
      showToast({
        type: 'error',
        title: 'Failed to switch role',
        message: res.error
      });
    }
  };

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'Admin') return '/admin-dashboard';
    if (user.role === 'Property Owner') return '/owner-dashboard';
    return '/tenant-dashboard';
  };

  const isActive = (path) => {
    return location.pathname === path ? 'text-emerald-600 bg-emerald-50 rounded-lg' : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50';
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md" id="merokotha-header">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" id="logo-link">
              <MeroKothaLogo iconSize={34} textClass="text-lg" />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/properties" className={`px-4 py-2 text-sm font-medium transition-all ${isActive('/properties')}`}>
              Find Rooms & Flats
            </Link>
            <Link to="/contact" className={`px-4 py-2 text-sm font-medium transition-all ${isActive('/contact')}`}>
              Contact Help
            </Link>
          </nav>

          {/* User Session Menus */}
          <div className="hidden md:flex items-center gap-4">

            {user ? (
              <div className="flex items-center gap-3">
                {/* Favorites indicators */}
                {user.role === 'Tenant' && (
                  <Link 
                    to="/tenant-dashboard" 
                    title="My Favorites"
                    className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Bookmark size={18} />
                    {favorites.length > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {favorites.length}
                      </span>
                    )}
                  </Link>
                )}

                {/* Dashboard Shortcut Tag */}
                <Link 
                  to={getDashboardLink()} 
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
                >
                  {user.role === 'Admin' ? (
                    <Shield size={14} className="text-emerald-500" />
                  ) : user.role === 'Property Owner' ? (
                    <PlusCircle size={14} className="text-emerald-500" />
                  ) : (
                    <ClipboardList size={14} className="text-emerald-500" />
                  )}
                  {user.role} Dashboard
                </Link>

                {/* Role Switcher Button */}
                {user.role !== 'Admin' && (
                  <button
                    onClick={handleRoleSwitch}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer shadow-sm"
                    id="switch-role-desktop-btn"
                  >
                    <ArrowLeftRight size={13} className="text-emerald-600" />
                    Switch to {user.role === 'Tenant' ? 'Owner' : 'Tenant'} Mode
                  </button>
                )}

                <div className="flex items-center gap-2 ml-1">
                  <Link to="/profile" className="flex items-center gap-2 group">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100/80 text-emerald-700 group-hover:bg-emerald-200 transition-colors">
                      <User size={18} className="stroke-[2.5]" />
                    </span>
                    <span className="text-sm font-semibold text-gray-800 hover:text-emerald-600 transition-colors">
                      {user.name.split(' ')[0]}
                    </span>
                  </Link>
                  <button 
                    onClick={logout}
                    title="Log Out"
                    className="ml-2 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-emerald-600 transition-colors"
                >
                  Log In
                </Link>
                <Link 
                  to="/register" 
                  className="rounded-xl bg-emerald-600 px-4.5 py-2 text-sm font-bold text-white shadow-md shadow-emerald-100 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition-all"
                  id="nav-register-btn"
                >
                  Join MeroKotha
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center md:hidden gap-3">

            {user && user.role === 'Tenant' && (
              <Link 
                to="/tenant-dashboard" 
                className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500"
              >
                <Bookmark size={16} />
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                    {favorites.length}
                  </span>
                )}
              </Link>
            )}

            {/* Mobile burger button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-50 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 shadow-inner" id="mobile-navigation-bar">
          <div className="flex flex-col gap-3">
            <Link 
              to="/properties" 
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-semibold text-gray-700 hover:bg-gray-50 hover:text-emerald-600"
            >
              Find Rooms & Flats
            </Link>
            <Link 
              to="/contact" 
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-semibold text-gray-700 hover:bg-gray-50 hover:text-emerald-600"
            >
              Contact Help
            </Link>

            {user ? (
              <div className="border-t border-gray-100 pt-3 mt-1 flex flex-col gap-3">
                <div className="px-3 py-1 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                </div>

                <Link 
                  to={getDashboardLink()}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700"
                >
                  Go to {user.role} Dashboard
                </Link>

                {user.role !== 'Admin' && (
                  <button 
                    onClick={() => {
                      setMobileOpen(false);
                      handleRoleSwitch();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg bg-emerald-50/50 border border-emerald-150 px-3 py-2 text-sm font-bold text-emerald-700 text-left cursor-pointer"
                    id="switch-role-mobile-btn"
                  >
                    <ArrowLeftRight size={16} className="text-emerald-600" /> Switch to {user.role === 'Tenant' ? 'Owner' : 'Tenant'} Mode
                  </button>
                )}

                <Link 
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  My Profile Settings
                </Link>

                <button 
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 text-left"
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
                <Link 
                  to="/login" 
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-base font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Log In
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-base font-bold text-white shadow-md shadow-emerald-150 hover:bg-emerald-700"
                >
                  Join MeroKotha
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
