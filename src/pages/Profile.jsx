import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { User, Phone, CheckCircle, AlertCircle, Shield, Key } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Load user data on mounted
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(null);
    setError(null);

    const payload = { name, phone };
    if (password) {
      payload.password = password;
    }

    const res = await updateProfile(payload);
    if (res.success) {
      setSuccess('Your profile details were updated successfully!');
      setPassword(''); // Clear password field
    } else {
      setError(res.error);
    }
    setSubmitting(false);
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-gray-500 font-bold">Please log in to manage your profile.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 flex-1" id="profile-settings-page">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        
        {/* Title segment */}
        <div className="border-b border-gray-100 pb-5 mb-6">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Account Core Profile</h2>
          <p className="text-xs text-gray-500 mt-1">Manage your active verification numbers, email registrations, and password keys</p>
        </div>

        {/* General Alert Banners */}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-150 text-emerald-800 p-3.5 rounded-xl text-xs font-semibold mb-6">
            <CheckCircle size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-150 text-red-800 p-3.5 rounded-xl text-xs font-semibold mb-6">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-5">
          {/* Read-only Email Registration */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Registered Email (Read-Only)</label>
            <input 
              type="text"
              readOnly
              value={user.email}
              className="w-full rounded-xl border border-gray-200 bg-gray-100 py-2.5 px-3.5 text-xs font-bold text-gray-500 focus:outline-none cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 text-gray-400" size={15} />
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ramesh Shrestha"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Telephone Number field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Mobile Contact Phone</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 text-gray-400" size={15} />
                <input 
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9841234567"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* User role Tag */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Assigned Dashboard Access Profile</label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-800">
              <Shield size={16} />
              <span>{user.role} Directory Access (Verified user : {user.isVerified ? 'Yes' : 'Pending verification'})</span>
            </div>
          </div>

          {/* Security Password updates (Optional) */}
          <div className="border-t border-gray-100 pt-5 mt-5">
            <h3 className="text-sm font-extrabold text-gray-800 mb-4 flex items-center gap-1.5">
              <Key size={16} className="text-emerald-600" /> Reset Security Access Password
            </h3>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                New Session Password (Keep blank if unchanged)
              </label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to maintain current credentials"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3.5 text-xs font-medium focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-bold text-white transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving modifications...' : 'Save Profile Changes'}
          </button>

        </form>

      </div>
    </div>
  );
}
