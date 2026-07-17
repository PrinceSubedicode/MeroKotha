import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Mail, Lock, LogIn, AlertCircle, Shield } from 'lucide-react';

export default function AdminLogin() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    const adminUser = localStorage.getItem('admin_user');
    if (adminToken && adminUser) {
      try {
        const parsed = JSON.parse(adminUser);
        if (parsed.role === 'Admin') {
          navigate('/admin-dashboard', { replace: true });
        }
      } catch (err) {
        // clear corrupted state
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;

      if (user.role !== 'Admin') {
        setError('Access Denied. This workspace is strictly restricted to system administrators.');
        showToast({
          type: 'error',
          title: 'Access Denied',
          message: 'This workspace is strictly restricted to system administrators.'
        });
        setLoading(false);
        return;
      }

      // Store in separate Admin storage keys to keep session completely separate
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));

      showToast({
        type: 'success',
        title: 'Security Session Initiated',
        message: `Welcome to control center, ${user.name}!`
      });

      navigate('/admin-dashboard', { replace: true });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid administrator email or password.';
      setError(errorMsg);
      showToast({
        type: 'error',
        title: 'Login failed',
        message: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md w-full px-4 py-16 flex-1 flex flex-col justify-center bg-slate-50 min-h-screen" id="admin-login-page">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-slate-900 text-white p-2.5 rounded-2xl mb-3">
            <Shield size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">MeroKotha Administrator Portal</h1>
          <p className="text-xs text-slate-500 mt-1">Authorized security access only. Activity is monitored.</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-150 text-red-700 p-3.5 rounded-xl text-xs font-semibold mb-5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="subediprince01@gmail.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-xs font-semibold focus:border-slate-800 focus:bg-white focus:outline-none"
                required
                id="admin-email-input"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Security Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-xs font-semibold focus:border-slate-800 focus:bg-white focus:outline-none"
                required
                id="admin-password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 py-3 rounded-xl text-xs font-bold text-white shadow-md transition-colors disabled:opacity-50 cursor-pointer"
            id="admin-login-submit-btn"
          >
            <LogIn size={15} /> {loading ? 'Initializing session...' : 'Sign In as Administrator'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
            Quick Test Administrator Account
          </p>
          <button 
            type="button"
            onClick={() => {
              setEmail('admin@merokotha.com');
              setPassword('admin123');
            }}
            className="w-full px-2 py-2.5 text-[11px] font-bold bg-slate-900 border border-slate-800 text-white rounded-xl hover:bg-slate-850 active:scale-95 transition-all text-center cursor-pointer"
          >
            Autofill Admin Credentials
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-medium">
            Contact systemic network operators to recover credentials or request privileges.
          </p>
        </div>
      </div>
    </div>
  );
}
