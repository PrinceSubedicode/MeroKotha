import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  User, 
  Phone, 
  CheckCircle, 
  AlertCircle, 
  Shield, 
  Key, 
  Camera, 
  Trash2, 
  MapPin, 
  Calendar, 
  FileText, 
  AlertTriangle 
} from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [govtId, setGovtId] = useState('');
  const [photo, setPhoto] = useState('');
  const [password, setPassword] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [highlightMissing, setHighlightMissing] = useState(false);
  
  const fileInputRef = useRef(null);

  // Load user data on mounted/changed
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setDob(user.dob || '');
      setGovtId(user.govtId || '');
      setPhoto(user.photo || '');
    }
  }, [user]);

  // Calculate completeness status
  const requiredFields = [
    { key: 'photo', label: 'Profile Photo', val: photo },
    { key: 'name', label: 'Full Name', val: name },
    { key: 'email', label: 'Email Address', val: user?.email },
    { key: 'phone', label: 'Phone Number', val: phone },
    { key: 'address', label: 'Address', val: address },
    { key: 'dob', label: 'Date of Birth', val: dob },
    { key: 'govtId', label: 'Government ID / Citizenship', val: govtId }
  ];

  const completedCount = requiredFields.filter(f => !!f.val).length;
  const totalCount = requiredFields.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);
  const isComplete = completedCount === totalCount;
  const missingFields = requiredFields.filter(f => !f.val);

  const isFieldMissing = (val) => !val && highlightMissing;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Invalid file type. Please upload an image file.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removePhoto = () => {
    setPhoto('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(null);
    setError(null);

    const payload = { 
      name, 
      phone,
      address,
      dob,
      govtId,
      photo
    };
    if (password) {
      payload.password = password;
    }

    const res = await updateProfile(payload);
    if (res.success) {
      setSuccess('Your profile details were updated successfully!');
      setPassword(''); // Clear password field
      setHighlightMissing(false);
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
          <p className="text-xs text-gray-500 mt-1">Manage your active verification details, email registrations, and profile picture</p>
        </div>

        {/* Completeness & Verification Banners */}
        {!isComplete && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-8 transition-all" id="incomplete-banner">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-900">⚠️ Profile Not Fully Verified</h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Please complete your profile to access all features. Missing details prevent full identity verification.
                </p>
                
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center text-xs font-bold text-amber-800 mb-1">
                    <span>Profile Completion Status</span>
                    <span>{completionPercentage}% Complete</span>
                  </div>
                  <div className="w-full bg-amber-200/50 rounded-full h-2">
                    <div 
                      className="bg-amber-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Missing fields list */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider self-center mr-1">Missing:</span>
                  {missingFields.map(f => (
                    <span key={f.key} className="text-[10px] font-medium bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {f.label}
                    </span>
                  ))}
                </div>

                {/* Complete Profile button */}
                <button
                  type="button"
                  onClick={() => {
                    setHighlightMissing(true);
                    const firstMissing = missingFields[0]?.key;
                    if (firstMissing) {
                      const element = document.getElementById(`input-${firstMissing}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.focus();
                      }
                    }
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  Complete Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-8 transition-all" id="complete-banner">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-emerald-900">✅ Profile Verified</h4>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                  Your profile is complete. All identity attributes have been verified and full permissions are granted.
                </p>
                
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-800 mb-1">
                    <span>Profile Status</span>
                    <span>100% Complete</span>
                  </div>
                  <div className="w-full bg-emerald-200/50 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* General Alert Banners */}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-xl text-xs font-semibold mb-6">
            <CheckCircle size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-800 p-3.5 rounded-xl text-xs font-semibold mb-6">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-5">
          {/* Profile Photo Upload Section */}
          <div className="border-b border-gray-100 pb-6 mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Profile Picture</label>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Photo Display */}
              <div className="relative group">
                {photo ? (
                  <img 
                    src={photo} 
                    alt="Profile Preview" 
                    referrerPolicy="no-referrer"
                    className="h-24 w-24 rounded-full object-cover border-2 border-emerald-500 shadow-md" 
                  />
                ) : (
                  <div className={`h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 transition-all ${
                    isFieldMissing(photo) ? 'border-2 border-amber-400' : 'border border-gray-200'
                  }`}>
                    <User size={40} className="stroke-[1.5]" />
                  </div>
                )}
                {photo && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    title="Remove Photo"
                    className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Drag and Drop Zone */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`flex-1 w-full border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-emerald-500 bg-emerald-50/50' 
                    : isFieldMissing(photo)
                      ? 'border-amber-400 bg-amber-50/20'
                      : 'border-gray-200 hover:border-emerald-500 hover:bg-gray-50'
                }`}
                id="input-photo"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileSelect(); }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden" 
                />
                <Camera className="mx-auto text-gray-400 mb-1.5" size={24} />
                <p className="text-xs font-bold text-gray-700">Drag and drop your picture, or <span className="text-emerald-600 hover:underline">browse</span></p>
                <p className="text-[10px] text-gray-400 mt-1">Supports PNG, JPG, JPEG (Max 5MB)</p>
              </div>
            </div>
          </div>

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
                  id="input-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ramesh Shrestha"
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-xs font-semibold focus:bg-white focus:outline-none transition-all ${
                    isFieldMissing(name)
                      ? 'border-amber-400 bg-amber-50 focus:border-amber-500'
                      : 'border-gray-200 bg-gray-50 focus:border-emerald-500'
                  }`}
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
                  id="input-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9841234567"
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-xs font-semibold focus:bg-white focus:outline-none transition-all ${
                    isFieldMissing(phone)
                      ? 'border-amber-400 bg-amber-50 focus:border-amber-500'
                      : 'border-gray-200 bg-gray-50 focus:border-emerald-500'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Address field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Primary Residence Address</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 text-gray-400" size={15} />
                <input 
                  type="text"
                  id="input-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Maitighar, Kathmandu"
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-xs font-semibold focus:bg-white focus:outline-none transition-all ${
                    isFieldMissing(address)
                      ? 'border-amber-400 bg-amber-50 focus:border-amber-500'
                      : 'border-gray-200 bg-gray-50 focus:border-emerald-500'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Date of Birth field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 text-gray-400" size={15} />
                <input 
                  type="date"
                  id="input-dob"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-xs font-semibold focus:bg-white focus:outline-none transition-all ${
                    isFieldMissing(dob)
                      ? 'border-amber-400 bg-amber-50 focus:border-amber-500'
                      : 'border-gray-200 bg-gray-50 focus:border-emerald-500'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Government ID field */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Government ID / Citizenship Number</label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 text-gray-400" size={15} />
                <input 
                  type="text"
                  id="input-govtId"
                  value={govtId}
                  onChange={(e) => setGovtId(e.target.value)}
                  placeholder="e.g. Citizenship No. 12-34-56-7890"
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-xs font-semibold focus:bg-white focus:outline-none transition-all ${
                    isFieldMissing(govtId)
                      ? 'border-amber-400 bg-amber-50 focus:border-amber-500'
                      : 'border-gray-200 bg-gray-50 focus:border-emerald-500'
                  }`}
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
            className="w-full mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-bold text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Saving modifications...' : 'Save Profile Changes'}
          </button>

        </form>

      </div>
    </div>
  );
}
