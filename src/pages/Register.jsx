import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { User, Mail, Phone, Lock, ClipboardList, PlusCircle, AlertCircle } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Tenant'); // Defaults to Tenant
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic client validations
    if (phone.length < 9) {
      setError('Please provide a valid Nepali telephone number.');
      showToast({
        type: 'error',
        title: 'Check phone number',
        message: 'Please provide a valid Nepali telephone number.'
      });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Security password must contain at least 6 characters.');
      showToast({
        type: 'error',
        title: 'Password too short',
        message: 'Use at least 6 characters.'
      });
      setLoading(false);
      return;
    }

    const res = await register(name, email, password, role, phone);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Account created',
        message: role === 'Property Owner'
          ? 'Your owner dashboard is ready for listings.'
          : 'Your tenant dashboard is ready.'
      });
      // Redirect based on selected user role
      if (role === 'Property Owner') {
        navigate('/owner-dashboard');
      } else {
        navigate('/tenant-dashboard');
      }
    } else {
      setError(res.error);
      showToast({
        type: 'error',
        title: 'Registration failed',
        message: res.error
      });
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-lg w-full px-4 py-12 flex-1 flex flex-col justify-center" id="register-page">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Join MeroKotha Nepal</h1>
          <p className="text-xs text-gray-500 mt-1">Rent beautiful rooms or list your rent assets commission-free</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-150 text-red-700 p-3.5 rounded-xl text-xs font-semibold mb-5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Select User Role */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 text-center">
              Choose your Account Profile
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4" id="role-selector-container">
              
              {/* Tenant Choice Card */}
              <button
                type="button"
                onClick={() => setRole('Tenant')}
                className={`py-3.5 px-4 rounded-xl border-2 text-left flex flex-col justify-between transition-all ${
                  role === 'Tenant' 
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950' 
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ClipboardList size={22} className={role === 'Tenant' ? 'text-emerald-600' : 'text-gray-400'} />
                <div className="mt-3">
                  <h4 className="text-xs font-bold">Seek Room / Bed</h4>
                  <p className="text-[10px] text-gray-450 mt-0.5">I want to find a room or flat to rent.</p>
                </div>
              </button>

              {/* Owner Choice Card */}
              <button
                type="button"
                onClick={() => setRole('Property Owner')}
                className={`py-3.5 px-4 rounded-xl border-2 text-left flex flex-col justify-between transition-all ${
                  role === 'Property Owner' 
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950' 
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <PlusCircle size={22} className={role === 'Property Owner' ? 'text-emerald-600' : 'text-gray-400'} />
                <div className="mt-3">
                  <h4 className="text-xs font-bold">List Rooms (Owner)</h4>
                  <p className="text-[10px] text-gray-450 mt-0.5">I own rooms or a flat I want to rent out.</p>
                </div>
              </button>

            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rohan Shrestha"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                required
                id="register-name-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  id="register-email-input"
                />
              </div>
            </div>

            {/* Mobile number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                <input 
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="980XXXXXXX"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                  required
                  id="register-phone-input"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Access Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                required
                id="register-password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-md shadow-emerald-700/10 transition-colors"
            id="register-submit-btn"
          >
            {loading ? 'Processing Registration...' : 'Create My Account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
            Log In here
          </Link>
        </p>
      </div>
    </div>
  );
}
