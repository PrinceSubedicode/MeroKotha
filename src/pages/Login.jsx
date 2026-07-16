import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Return url or role dashboards
  const from = location.state?.from?.pathname || null;

  useEffect(() => {
    if (user) {
      if (user.role === 'Admin') {
        navigate('/admin-dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const result = await login(email, password);
    if (result.success) {
      // Fetch user from storage or state after context login completes
      const storedUser = JSON.parse(localStorage.getItem('user'));
      let redirectPath = '/';
      if (storedUser.role === 'Admin') {
        redirectPath = '/admin-dashboard';
      } else {
        redirectPath = '/';
      }

      if (from && from !== '/login' && from !== '/register') {
        if (from === '/admin-dashboard' && storedUser.role !== 'Admin') {
          redirectPath = '/';
        } else {
          redirectPath = from;
        }
      }

      showToast({
        type: 'success',
        title: 'Welcome back',
        message: `Signed in successfully!`
      });
      navigate(redirectPath, { replace: true });
    } else {
      setError(result.error);
      showToast({
        type: 'error',
        title: 'Login failed',
        message: result.error
      });
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-md w-full px-4 py-16 flex-1 flex flex-col justify-center" id="login-page">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Log In to MeroKotha</h1>
          <p className="text-xs text-gray-500 mt-1">Converse directly with landlords and track room bookmarking</p>
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
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                required
                id="login-email-input"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Security Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                required
                id="login-password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 py-3 rounded-xl text-xs font-bold text-white shadow-md shadow-emerald-700/10 transition-colors disabled:opacity-50"
            id="login-submit-btn"
          >
            <LogIn size={15} /> {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-150">
          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Quick Test Accounts (Click to Autofill)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button 
              type="button"
              onClick={() => {
                setEmail('admin@merokotha.com');
                setPassword('admin123');
              }}
              className="px-2 py-2 text-[10px] font-bold bg-slate-900 border border-slate-800 text-white rounded-xl hover:bg-slate-850 active:scale-95 transition-all text-center cursor-pointer"
            >
              Admin Dashboard
            </button>
            <button 
              type="button"
              onClick={() => {
                setEmail('owner@merokotha.com');
                setPassword('owner123');
              }}
              className="px-2 py-2 text-[10px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl hover:bg-emerald-100 active:scale-95 transition-all text-center cursor-pointer"
            >
              Owner Partner
            </button>
            <button 
              type="button"
              onClick={() => {
                setEmail('tenant@merokotha.com');
                setPassword('tenant123');
              }}
              className="px-2 py-2 text-[10px] font-bold bg-gray-50 border border-gray-150 text-slate-700 rounded-xl hover:bg-gray-100 active:scale-95 transition-all text-center cursor-pointer"
            >
              Tenant seeker
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6 pt-1">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
            Create account
          </Link>
        </p>

      </div>
    </div>
  );
}
