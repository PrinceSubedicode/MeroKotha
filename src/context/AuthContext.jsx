import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  // Check storage on boots
  useEffect(() => {
    async function loadSession() {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Double verify on server
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (error) {
          console.warn('Session invalid or expired, logging out:', error.message);
          // Token expired or invalid
          logout();
        }
      }
      setLoading(false);
    }
    loadSession();
  }, []);

  // Sync favorites when user loads
  useEffect(() => {
    let mounted = true;

    async function loadFavorites() {
      if (!user) {
        setFavorites([]);
        return;
      }

      const savedFavs = localStorage.getItem(`favs_${user._id}`);
      if (savedFavs) {
        setFavorites(JSON.parse(savedFavs));
      }

      if (user.role !== 'Tenant') {
        setFavorites([]);
        return;
      }

      try {
        const res = await api.get('/auth/favorites');
        if (!mounted) return;
        const serverFavorites = res.data.favorites || [];
        setFavorites(serverFavorites);
        localStorage.setItem(`favs_${user._id}`, JSON.stringify(serverFavorites));
      } catch (error) {
        console.warn('Using local favorite cache because server favorites could not load:', error);
      }
    }

    loadFavorites();

    return () => {
      mounted = false;
    };
  }, [user]);

  // Keep local fallback favorites in sync
  useEffect(() => {
    if (user) {
      localStorage.setItem(`favs_${user._id}`, JSON.stringify(favorites));
    }
  }, [favorites, user]);

  // Auth: Email/Password Login
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user: loggedUser } = res.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      
      setToken(token);
      setUser(loggedUser);
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Invalid email or password.';
      return { success: false, error: errorMsg };
    }
  };

  // Auth: Sign Up
  const register = async (name, email, password, role, phone) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, role, phone });
      const { token, user: newUser } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));

      setToken(token);
      setUser(newUser);
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Try again.';
      return { success: false, error: errorMsg };
    }
  };

  // Auth: Sign Out
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setFavorites([]);
    window.location.href = '/login';
  };

  // Auth: Update Profile Details
  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/auth/profile', profileData);
      const updatedUser = res.data.user;
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { success: true, message: res.data.message };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update profile details.';
      return { success: false, error: errorMsg };
    }
  };

  // Auth: Switch Role (between Tenant and Owner)
  const switchRole = async (targetRole) => {
    try {
      const res = await api.post('/auth/switch-role', { role: targetRole });
      const { token: newToken, user: updatedUser } = res.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setToken(newToken);
      setUser(updatedUser);
      return { success: true, message: res.data.message };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to switch role.';
      return { success: false, error: errorMsg };
    }
  };

  // Tenant Favorite toggling
  const toggleFavorite = async (propertyId) => {
    if (!user) return false;

    const previousFavorites = favorites;
    let updated;
    if (favorites.includes(propertyId)) {
      updated = favorites.filter(id => id !== propertyId);
    } else {
      updated = [...favorites, propertyId];
    }

    setFavorites(updated);
    localStorage.setItem(`favs_${user._id}`, JSON.stringify(updated));

    if (user.role === 'Tenant') {
      try {
        const res = await api.post(`/auth/favorites/${propertyId}`);
        const serverFavorites = res.data.favorites || updated;
        setFavorites(serverFavorites);
        localStorage.setItem(`favs_${user._id}`, JSON.stringify(serverFavorites));
      } catch (error) {
        console.error('Favorite sync failed:', error);
        setFavorites(previousFavorites);
        localStorage.setItem(`favs_${user._id}`, JSON.stringify(previousFavorites));
      }
    }

    return true;
  };

  const isFavorite = (propertyId) => {
    return favorites.includes(propertyId);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      favorites,
      login,
      register,
      logout,
      updateProfile,
      switchRole,
      toggleFavorite,
      isFavorite
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be called inside an AuthProvider');
  }
  return context;
}
