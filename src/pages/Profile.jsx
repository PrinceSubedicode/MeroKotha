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
  AlertTriangle,
  Upload,
  Check,
  X,
  File,
  Clock
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

  // Document Verification States
  const [docType, setDocType] = useState('Citizenship Certificate');
  const [docNumber, setDocNumber] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [frontSide, setFrontSide] = useState(''); // base64 or file path
  const [backSide, setBackSide] = useState('');   // base64 or file path
  const [frontFilename, setFrontFilename] = useState('');
  const [backFilename, setBackFilename] = useState('');
  
  const [frontDragActive, setFrontDragActive] = useState(false);
  const [backDragActive, setBackDragActive] = useState(false);
  const [frontProgress, setFrontProgress] = useState(0);
  const [backProgress, setBackProgress] = useState(0);

  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  const [verifyError, setVerifyError] = useState(null);

  // Load user data on mounted/changed
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setDob(user.dob || '');
      setGovtId(user.govtId || '');
      setPhoto(user.photo || '');
      
      if (user.verificationDetails) {
        setDocType(user.verificationDetails.documentType || 'Citizenship Certificate');
        setDocNumber(user.verificationDetails.documentNumber || '');
        setIssuingAuthority(user.verificationDetails.issuingAuthority || '');
        setIssueDate(user.verificationDetails.issueDate || '');
        setExpiryDate(user.verificationDetails.expiryDate || '');
        setFrontSide(user.verificationDetails.frontSideUrl || '');
        setBackSide(user.verificationDetails.backSideUrl || '');
      }
    }
  }, [user]);

  // Calculate completeness status
  const isVerifiedStatus = user?.verificationStatus === 'Verified';
  const requiredFields = [
    { key: 'photo', label: 'Profile Photo', val: photo },
    { key: 'name', label: 'Full Name', val: name },
    { key: 'email', label: 'Email Address', val: user?.email },
    { key: 'phone', label: 'Phone Number', val: phone },
    { key: 'address', label: 'Address', val: address },
    { key: 'dob', label: 'Date of Birth', val: dob },
    { key: 'identityVerification', label: 'Identity Verification', val: isVerifiedStatus ? 'Verified' : '' }
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

  // Document upload helper with mock loading indicator for great feedback
  const handleFileReadWithProgress = (file, side) => {
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setVerifyError('Unsupported file format. Please upload JPG, JPEG, PNG, or PDF.');
      return;
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    if (file.size > maxSize) {
      setVerifyError('File size exceeds the 10MB limit.');
      return;
    }

    setVerifyError(null);
    
    if (side === 'front') {
      setFrontProgress(10);
    } else {
      setBackProgress(10);
    }

    const interval = setInterval(() => {
      if (side === 'front') {
        setFrontProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 20;
        });
      } else {
        setBackProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 20;
        });
      }
    }, 80);

    const reader = new FileReader();
    reader.onload = (e) => {
      setTimeout(() => {
        clearInterval(interval);
        if (side === 'front') {
          setFrontSide(e.target.result);
          setFrontFilename(file.name);
          setFrontProgress(100);
          setTimeout(() => setFrontProgress(0), 400);
        } else {
          setBackSide(e.target.result);
          setBackFilename(file.name);
          setBackProgress(100);
          setTimeout(() => setBackProgress(0), 400);
        }
      }, 400);
    };
    reader.readAsDataURL(file);
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
      photo
    };
    if (password) {
      payload.password = password;
    }

    // Include verification details if documents have been chosen and editing is allowed
    const isEditingVerification = !user.verificationStatus || user.verificationStatus === 'Not Submitted' || user.verificationStatus === 'Rejected';
    if (isEditingVerification && frontSide) {
      payload.documentType = docType;
      payload.documentNumber = docNumber;
      payload.issuingAuthority = issuingAuthority;
      payload.issueDate = issueDate;
      payload.expiryDate = expiryDate;
      payload.frontSide = frontSide;
      payload.backSide = backSide;
    }

    const res = await updateProfile(payload);
    if (res.success) {
      setSuccess('Your profile details and identity verification files were updated successfully!');
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
        {user?.verificationStatus === 'Under Review' && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8 transition-all" id="review-banner">
            <div className="flex items-start gap-3">
              <Clock className="text-blue-500 shrink-0 mt-0.5 animate-pulse" size={20} />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-blue-900">🔵 Identity Verification Under Review</h4>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  Your identity documents have been uploaded successfully and are currently being reviewed by our system administrators. This process typically takes less than 24 hours.
                </p>
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center text-xs font-bold text-blue-800 mb-1">
                    <span>Profile Status (Pending Review)</span>
                    <span>{completionPercentage}% Complete</span>
                  </div>
                  <div className="w-full bg-blue-200/50 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {user?.verificationStatus === 'Rejected' && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-8 transition-all" id="rejected-banner">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-red-900">🔴 Identity Verification Rejected</h4>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">
                  Your identity documents were rejected by the administrator. Please review the feedback, update your files, and re-submit.
                </p>
                {user.verificationDetails?.rejectionReason && (
                  <div className="mt-2.5 bg-red-100/50 text-red-800 p-3 rounded-xl text-xs font-bold border border-red-200">
                    Reason: {user.verificationDetails.rejectionReason}
                  </div>
                )}
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center text-xs font-bold text-red-800 mb-1">
                    <span>Profile Completion Status</span>
                    <span>{completionPercentage}% Complete</span>
                  </div>
                  <div className="w-full bg-red-200/50 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(!user?.verificationStatus || user?.verificationStatus === 'Not Submitted') && !isComplete && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-8 transition-all" id="incomplete-banner">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-900">⚠️ Profile Not Fully Verified</h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Please complete your profile to access all features. Uploading your identity verification documents is required to unlock full system capabilities.
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
                <h4 className="text-sm font-bold text-emerald-900">✅ Identity Verified</h4>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                  Your profile and documents have been successfully verified! All features are unlocked and your credentials are secure.
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

            {/* Identity Document Verification Section */}
            <div className="sm:col-span-2 border-t border-gray-100 pt-6 mt-2">
              <h3 className="text-sm font-extrabold text-gray-800 mb-4 flex items-center gap-1.5">
                <Shield size={16} className="text-emerald-600" /> Identity Document Verification
              </h3>

              {verifyError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-800 p-3 rounded-xl text-xs font-semibold mb-4">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              {user?.verificationStatus === 'Verified' || user?.verificationStatus === 'Under Review' ? (
                // Read-only Layout for Verified or Under Review status
                <div className="bg-gray-50 rounded-2xl border border-gray-150 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Document Type</span>
                      <p className="text-xs font-extrabold text-gray-800 mt-0.5">{docType}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                      user.verificationStatus === 'Verified' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {user.verificationStatus === 'Verified' ? '● Verified' : '● Under Review'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {docNumber && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Document Number</span>
                        <span className="font-semibold text-gray-700">{docNumber}</span>
                      </div>
                    )}
                    {issuingAuthority && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Issuing Authority</span>
                        <span className="font-semibold text-gray-700">{issuingAuthority}</span>
                      </div>
                    )}
                    {issueDate && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Issue Date</span>
                        <span className="font-semibold text-gray-700">{issueDate}</span>
                      </div>
                    )}
                    {expiryDate && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Expiry Date</span>
                        <span className="font-semibold text-gray-700">{expiryDate}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {frontSide && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Front Side</span>
                        {frontSide.endsWith('.pdf') || frontSide.startsWith('data:application/pdf') ? (
                          <a 
                            href={frontSide} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <File className="text-red-500 shrink-0" size={16} />
                            <span className="text-xs font-bold text-gray-700 truncate">View Front Document (PDF)</span>
                          </a>
                        ) : (
                          <div className="relative group rounded-xl overflow-hidden border border-gray-200 max-h-36">
                            <img src={frontSide} alt="Document Front" className="w-full h-28 object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <a href={frontSide} target="_blank" rel="noopener noreferrer" className="text-white text-[10px] font-bold underline">
                                View Full Size
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {backSide && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Back Side</span>
                        {backSide.endsWith('.pdf') || backSide.startsWith('data:application/pdf') ? (
                          <a 
                            href={backSide} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <File className="text-red-500 shrink-0" size={16} />
                            <span className="text-xs font-bold text-gray-700 truncate">View Back Document (PDF)</span>
                          </a>
                        ) : (
                          <div className="relative group rounded-xl overflow-hidden border border-gray-200 max-h-36">
                            <img src={backSide} alt="Document Back" className="w-full h-28 object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <a href={backSide} target="_blank" rel="noopener noreferrer" className="text-white text-[10px] font-bold underline">
                                View Full Size
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Editable Upload section for Not Submitted or Rejected states
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">Document Type <span className="text-red-500">*</span></label>
                      <select 
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3.5 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                      >
                        <option value="Citizenship Certificate">Citizenship Certificate</option>
                        <option value="National ID Card">National ID Card</option>
                        <option value="Passport">Passport</option>
                        <option value="Driving License">Driving License</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="PAN Card">PAN Card</option>
                        <option value="Other Government-Issued ID">Other Government-Issued ID</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">Document ID Number</label>
                      <input 
                        type="text"
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        placeholder="e.g. 12-34-56-7890"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3.5 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">Issuing Authority</label>
                      <input 
                        type="text"
                        value={issuingAuthority}
                        onChange={(e) => setIssuingAuthority(e.target.value)}
                        placeholder="e.g. District Administration Office"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3.5 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Issue Date</label>
                        <input 
                          type="date"
                          value={issueDate}
                          onChange={(e) => setIssueDate(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 px-2.5 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1.5">Expiry Date (If any)</label>
                        <input 
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 px-2.5 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    {/* Front Side Upload */}
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-gray-500 mb-1.5">
                        Front Side of Document <span className="text-red-500">*</span>
                      </label>
                      {frontSide ? (
                        <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            {frontSide.startsWith('data:application/pdf') || frontSide.endsWith('.pdf') ? (
                              <div className="bg-red-50 text-red-600 p-2 rounded-lg shrink-0">
                                <FileText size={20} />
                              </div>
                            ) : (
                              <img 
                                src={frontSide} 
                                alt="Front Preview" 
                                className="h-12 w-12 object-cover rounded-lg border border-gray-200 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate">
                                {frontFilename || (frontSide.startsWith('data:') ? 'Document_Front' : frontSide.split('/').pop())}
                              </p>
                              <p className="text-[10px] text-gray-400">Selected</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => frontInputRef.current?.click()}
                              className="text-[10px] font-bold text-emerald-600 hover:underline px-2 py-1"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => { setFrontSide(''); setFrontFilename(''); }}
                              className="text-[10px] font-bold text-red-500 hover:underline px-2 py-1"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onDragEnter={(e) => { e.preventDefault(); setFrontDragActive(true); }}
                          onDragOver={(e) => { e.preventDefault(); setFrontDragActive(true); }}
                          onDragLeave={(e) => { e.preventDefault(); setFrontDragActive(false); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setFrontDragActive(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleFileReadWithProgress(e.dataTransfer.files[0], 'front');
                            }
                          }}
                          onClick={() => frontInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                            frontDragActive 
                              ? 'border-emerald-500 bg-emerald-50/50' 
                              : 'border-gray-200 hover:border-emerald-500 hover:bg-gray-50'
                          }`}
                        >
                          {frontProgress > 0 ? (
                            <div className="py-2">
                              <div className="w-full bg-gray-100 rounded-full h-1.5 max-w-[150px] mx-auto overflow-hidden">
                                <div className="bg-emerald-500 h-1.5 transition-all duration-150" style={{ width: `${frontProgress}%` }} />
                              </div>
                              <p className="text-[10px] text-gray-400 font-bold mt-1.5">Reading {frontProgress}%...</p>
                            </div>
                          ) : (
                            <>
                              <Upload className="mx-auto text-gray-400 mb-1.5" size={20} />
                              <p className="text-xs font-bold text-gray-700">Drag & Drop or <span className="text-emerald-600 hover:underline">browse</span></p>
                              <p className="text-[9px] text-gray-400 mt-0.5">Supports PNG, JPG, PDF (Max 10MB)</p>
                            </>
                          )}
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={frontInputRef}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileReadWithProgress(e.target.files[0], 'front');
                          }
                        }}
                        accept="image/*,application/pdf"
                        className="hidden" 
                      />
                    </div>

                    {/* Back Side Upload */}
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-gray-500 mb-1.5">
                        Back Side of Document (Optional)
                      </label>
                      {backSide ? (
                        <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            {backSide.startsWith('data:application/pdf') || backSide.endsWith('.pdf') ? (
                              <div className="bg-red-50 text-red-600 p-2 rounded-lg shrink-0">
                                <FileText size={20} />
                              </div>
                            ) : (
                              <img 
                                src={backSide} 
                                alt="Back Preview" 
                                className="h-12 w-12 object-cover rounded-lg border border-gray-200 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate">
                                {backFilename || (backSide.startsWith('data:') ? 'Document_Back' : backSide.split('/').pop())}
                              </p>
                              <p className="text-[10px] text-gray-400">Selected</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => backInputRef.current?.click()}
                              className="text-[10px] font-bold text-emerald-600 hover:underline px-2 py-1"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => { setBackSide(''); setBackFilename(''); }}
                              className="text-[10px] font-bold text-red-500 hover:underline px-2 py-1"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onDragEnter={(e) => { e.preventDefault(); setBackDragActive(true); }}
                          onDragOver={(e) => { e.preventDefault(); setBackDragActive(true); }}
                          onDragLeave={(e) => { e.preventDefault(); setBackDragActive(false); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setBackDragActive(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleFileReadWithProgress(e.dataTransfer.files[0], 'back');
                            }
                          }}
                          onClick={() => backInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                            backDragActive 
                              ? 'border-emerald-500 bg-emerald-50/50' 
                              : 'border-gray-200 hover:border-emerald-500 hover:bg-gray-50'
                          }`}
                        >
                          {backProgress > 0 ? (
                            <div className="py-2">
                              <div className="w-full bg-gray-100 rounded-full h-1.5 max-w-[150px] mx-auto overflow-hidden">
                                <div className="bg-emerald-500 h-1.5 transition-all duration-150" style={{ width: `${backProgress}%` }} />
                              </div>
                              <p className="text-[10px] text-gray-400 font-bold mt-1.5">Reading {backProgress}%...</p>
                            </div>
                          ) : (
                            <>
                              <Upload className="mx-auto text-gray-400 mb-1.5" size={20} />
                              <p className="text-xs font-bold text-gray-700">Drag & Drop or <span className="text-emerald-600 hover:underline">browse</span></p>
                              <p className="text-[9px] text-gray-400 mt-0.5">Supports PNG, JPG, PDF (Max 10MB)</p>
                            </>
                          )}
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={backInputRef}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileReadWithProgress(e.target.files[0], 'back');
                          }
                        }}
                        accept="image/*,application/pdf"
                        className="hidden" 
                      />
                    </div>
                  </div>
                </div>
              )}
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
