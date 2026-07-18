import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext.jsx';
import { Shield, Users, Home, Mail, FileText, CheckCircle2, XCircle, Trash2, AlertTriangle, RefreshCw, BarChart2, Check, X, ExternalLink, Search, Ban, Power, Calendar, Phone, Lock, Eye, Download, Info } from 'lucide-react';

export default function AdminDashboard() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Continuous / N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Continuous / N/A' : d.toLocaleDateString();
  };

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = localStorage.getItem('admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    showToast({
      type: 'success',
      title: 'Session Terminated',
      message: 'Logged out of administrator panel.'
    });
    navigate('/admin', { replace: true });
  };
  
  // Tab screens: 'properties', 'users', 'bookings'
  const [activeTab, setActiveTab] = useState('properties');

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [adminBookings, setAdminBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Identity document review and detailed profile states
  const [reviewUser, setReviewUser] = useState(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Custom action confirmations and deleted user filters
  const [confirmModal, setConfirmModal] = useState(null); // null or { type: 'suspend' | 'activate' | 'delete', userId: string }
  const [showDeletedUsers, setShowDeletedUsers] = useState(false);

  // Search and filter states for user list
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userVerificationFilter, setUserVerificationFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userRegDateFilter, setUserRegDateFilter] = useState('all');

  // Deletion modal / force delete warning state
  const [deletionWarning, setDeletionWarning] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Image zoom preview state in modal
  const [zoomImg, setZoomImg] = useState(null);

  // Modal active tab: 'profile' or 'activity' or 'actions'
  const [modalTab, setModalTab] = useState('profile');

  // Load administrative dataset
  const loadAdminDataset = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      // Async gather stats, users, properties, and bookings from admin API endpoints
      const [statsRes, usersRes, propsRes, bookingsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/properties'),
        api.get('/admin/bookings')
      ]);

      setStats(statsRes.data.stats);
      setUsers(usersRes.data);
      setProperties(propsRes.data);
      setAdminBookings(bookingsRes.data);

      // Instantly update current reviewUser profile badge state if modal is open
      if (reviewUser) {
        const matchedReviewUser = usersRes.data.find(u => u._id === reviewUser._id);
        if (matchedReviewUser) {
          setReviewUser(matchedReviewUser);
        }
      }
    } catch (err) {
      console.error('Failed fetching admin datasets:', err);
      setError('Failed to sync administrative platform datasets. Confirm system privileges.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleOpenReview = async (user) => {
    setReviewUser(user);
    setLoadingDetails(true);
    setDeletionWarning(null);
    setDeletingUserId(null);
    setSelectedUserDetails(null);
    setModalTab('profile');
    try {
      const res = await api.get(`/admin/users/${user._id}/details`);
      setSelectedUserDetails(res.data);
    } catch (err) {
      console.error('Error fetching user details:', err);
      showToast({
        type: 'error',
        title: 'Query Failed',
        message: 'Could not fetch detailed user activity record.'
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const getSpecificErrorMessage = (err, defaultFallback) => {
    const status = err.response?.status;
    const serverMsg = err.response?.data?.message || '';
    
    if (status === 403 || serverMsg.toLowerCase().includes('permission') || serverMsg.toLowerCase().includes('unauthorized') || serverMsg.toLowerCase().includes('admin')) {
      return '❌ Permission denied. Only administrators can perform this action.';
    }
    if (status === 404 || serverMsg.toLowerCase().includes('not found') || serverMsg.toLowerCase().includes('could not be found')) {
      return '❌ The requested user could not be found.';
    }
    if (serverMsg.toLowerCase().includes('active booking') || serverMsg.toLowerCase().includes('booking') || serverMsg.toLowerCase().includes('reservation')) {
      return '❌ The user has active bookings that must be completed first.';
    }
    if (serverMsg.toLowerCase().includes('property') || serverMsg.toLowerCase().includes('properties') || serverMsg.toLowerCase().includes('listing')) {
      return '❌ The user owns active properties that must be archived or transferred.';
    }
    if (status === 500) {
      return '❌ A server error occurred. Please try again later.';
    }
    return defaultFallback || '❌ Unable to complete the requested action.';
  };

  const handleUserSuspend = async (userId) => {
    const targetId = userId || reviewUser?._id || reviewUser?.id || selectedUserDetails?._id || selectedUserDetails?.id;
    if (!targetId || targetId === 'undefined' || targetId === 'null') {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: '❌ Invalid user ID. No target user identified.'
      });
      return;
    }
    try {
      await api.put(`/admin/users/${targetId}/suspend`);
      showToast({
        type: 'success',
        title: 'Account Suspended',
        message: '✅ User account has been suspended successfully.'
      });
      setReviewUser(null);
      setSelectedUserDetails(null);
      await loadAdminDataset(true);
    } catch (err) {
      console.error('Failed to suspend user:', err);
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: getSpecificErrorMessage(err, '❌ Unable to suspend the user. Please try again later.')
      });
    }
  };

  const handleUserActivate = async (userId) => {
    const targetId = userId || reviewUser?._id || reviewUser?.id || selectedUserDetails?._id || selectedUserDetails?.id;
    if (!targetId || targetId === 'undefined' || targetId === 'null') {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: '❌ Invalid user ID. No target user identified.'
      });
      return;
    }
    try {
      await api.put(`/admin/users/${targetId}/activate`);
      showToast({
        type: 'success',
        title: 'Account Activated',
        message: '✅ User account has been activated successfully.'
      });
      setReviewUser(null);
      setSelectedUserDetails(null);
      await loadAdminDataset(true);
    } catch (err) {
      console.error('Failed to activate user:', err);
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: getSpecificErrorMessage(err, '❌ Unable to activate the user. Please try again.')
      });
    }
  };

  const handleUserRestore = async (userId) => {
    const targetId = userId || reviewUser?._id || reviewUser?.id || selectedUserDetails?._id || selectedUserDetails?.id;
    if (!targetId || targetId === 'undefined' || targetId === 'null') {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: '❌ Invalid user ID. No target user identified.'
      });
      return;
    }
    try {
      await api.put(`/admin/users/${targetId}/activate`);
      showToast({
        type: 'success',
        title: 'Account Restored',
        message: '✅ User account restored successfully.'
      });
      setReviewUser(null);
      setSelectedUserDetails(null);
      await loadAdminDataset(true);
    } catch (err) {
      console.error('Failed to restore user:', err);
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: getSpecificErrorMessage(err, '❌ Unable to complete the requested action.')
      });
    }
  };

  const handleUserDelete = async (userId, force = false) => {
    const targetId = userId || reviewUser?._id || reviewUser?.id || selectedUserDetails?._id || selectedUserDetails?.id;
    if (!targetId || targetId === 'undefined' || targetId === 'null') {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: '❌ Invalid user ID. No target user identified.'
      });
      return;
    }
    setDeletingLoading(true);
    try {
      const res = await api.delete(`/admin/users/${targetId}${force ? '?force=true' : ''}`);
      if (res.data.warning) {
        setDeletionWarning(res.data.details);
        setDeletingUserId(targetId);
        showToast({
          type: 'warning',
          title: 'Safety Warning Triggered',
          message: 'This user has active items or verification records on the platform.'
        });
      } else {
        showToast({
          type: 'success',
          title: 'Account Soft-Deleted',
          message: '✅ User account has been deleted successfully.'
        });
        setDeletionWarning(null);
        setDeletingUserId(null);
        setReviewUser(null);
        setSelectedUserDetails(null);
        await loadAdminDataset(true);
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      showToast({
        type: 'error',
        title: 'Deletion Failed',
        message: getSpecificErrorMessage(err, '❌ Unable to delete the user. Please check for active bookings or properties and try again.')
      });
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleVerificationReviewWithCustom = async (userId, status, isRequestNewDoc = false) => {
    const targetId = userId || reviewUser?._id || reviewUser?.id || selectedUserDetails?._id || selectedUserDetails?.id;
    if (!targetId || targetId === 'undefined' || targetId === 'null') {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: '❌ Invalid user ID. No target user identified.'
      });
      return;
    }
    if ((status === 'Rejected' || isRequestNewDoc) && !rejectionReason.trim()) {
      showToast({
        type: 'error',
        title: 'Input Required',
        message: 'Please specify the rejection or re-upload feedback reasons.'
      });
      return;
    }
    setSubmittingReview(true);
    try {
      await api.put(`/admin/users/${targetId}/verification-review`, {
        status: isRequestNewDoc ? 'Rejected' : status,
        rejectionReason: (status === 'Rejected' || isRequestNewDoc) ? rejectionReason : undefined,
        isRequestNewDoc
      });
      
      let successMsg = `Verification decision: ${status}`;
      let successTitle = 'Action Completed';
      if (status === 'Verified') {
        successTitle = 'Verification Approved';
        successMsg = '✅ User has been verified successfully.';
      } else if (isRequestNewDoc) {
        successTitle = 'Re-upload Requested';
        successMsg = '✅ Re-upload request has been sent successfully.';
      } else if (status === 'Rejected') {
        successTitle = 'Verification Rejected';
        successMsg = '✅ Verification request has been rejected and the user has been notified.';
      }

      showToast({
        type: 'success',
        title: successTitle,
        message: successMsg
      });
      setReviewUser(null);
      setSelectedUserDetails(null);
      setRejectionReason('');
      await loadAdminDataset(true);
    } catch (err) {
      console.error('Verification review failed:', err);
      let errorMsg = 'Verification review process failed.';
      if (isRequestNewDoc) {
        errorMsg = '❌ Unable to send the re-upload request. Please try again.';
      } else {
        errorMsg = getSpecificErrorMessage(err, '❌ Unable to complete the requested action.');
      }
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: errorMsg
      });
    } finally {
      setSubmittingReview(false);
    }
  };

   useEffect(() => {
    if (adminUser && adminUser.role === 'Admin') {
      loadAdminDataset();
    }
  }, [adminUser]);

  // Compute search-filtered system users list
  const filteredUsers = users.filter((u) => {
    // 0. Filter out Deleted users by default unless showDeletedUsers is enabled OR userStatusFilter is explicitly set to 'Deleted'
    const isDeleted = u.status === 'Deleted';
    if (isDeleted && !showDeletedUsers && userStatusFilter !== 'Deleted') {
      return false;
    }

    // 1. Search text filter (name, email, phone)
    if (userSearchTerm) {
      const q = userSearchTerm.toLowerCase();
      const nameMatch = (u.name || '').toLowerCase().includes(q);
      const emailMatch = (u.email || '').toLowerCase().includes(q);
      const phoneMatch = (u.phone || '').toLowerCase().includes(q);
      if (!nameMatch && !emailMatch && !phoneMatch) {
        return false;
      }
    }

    // 2. Role filter
    if (userRoleFilter !== 'all') {
      if (u.role !== userRoleFilter) return false;
    }

    // 3. Verification filter
    if (userVerificationFilter !== 'all') {
      const status = u.verificationStatus || 'Not Submitted';
      if (status !== userVerificationFilter) return false;
    }

    // 4. Account status filter
    if (userStatusFilter !== 'all') {
      const status = u.status || 'Active';
      if (status !== userStatusFilter) return false;
    }

    // 5. Registration Date filter
    if (userRegDateFilter !== 'all') {
      const createdAt = new Date(u.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (userRegDateFilter === 'today') {
        if (diffDays > 1) return false;
      } else if (userRegDateFilter === 'week') {
        if (diffDays > 7) return false;
      } else if (userRegDateFilter === 'month') {
        if (diffDays > 30) return false;
      }
    }

    return true;
  });

  // Approve / Reject status changes
  const handleModifyPropertyApproval = async (propertyId, newStatus) => {
    try {
      await api.put(`/admin/properties/${propertyId}/status`, { status: newStatus });
      loadAdminDataset(); // Reload lists
    } catch (err) {
      console.error('Approval modification failed:', err);
      alert('Unable to modify properties status.');
    }
  };

  // Toggle landlord verification
  const handleToggleUserVerification = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/verify`);
      loadAdminDataset(); // Reload lists
    } catch (err) {
      console.error('User verification toggle failed:', err);
      alert('User verification process stalled.');
    }
  };

  // Delete listing permanently
  const executeAdminDeleteListing = async (propertyId) => {
    try {
      await api.delete(`/admin/properties/${propertyId}`);
      loadAdminDataset();
    } catch (err) {
      console.error('Purging listing failed:', err);
      setError('Administrative purging failed. Try again.');
    }
  };

  if (!adminUser || adminUser.role !== 'Admin') {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <AlertTriangle size={36} className="text-red-500 mx-auto mb-3" />
        <p className="text-gray-500 font-bold text-sm">Security: Administrative Portal Access Denied.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1" id="admin-dashboard-page">
      
      {/* Banner */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-white p-1 rounded-lg">
              <Shield size={16} />
            </span>
            <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">System Security Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5">MeroKotha Control Center</h1>
          <p className="text-xs text-gray-300 mt-1">
            Analyze platform analytics, inspect and verify owner credentials, and approve or purge room listings for Nepal.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={loadAdminDataset}
            className="rounded-xl border border-gray-700 hover:bg-gray-800 text-white py-2 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={12} /> Sync Datasets
          </button>
          <button 
            onClick={handleAdminLogout}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white py-2 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </section>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded-2xl text-center mb-8">
          <p className="font-bold text-sm">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-xs text-gray-500 font-bold mt-2">Assembling administrative system datasets...</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Section 1: Dashboard Statistics Counts */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" id="admin-stats-cards">
              {/* Total Users */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold">
                  <Users size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Platform Users</p>
                  <p className="text-lg font-black text-gray-800 mt-0.5">{stats.totalUsers}</p>
                </div>
              </div>

              {/* Verified Host Listings */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold">
                  <Home size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Approved Rentals</p>
                  <p className="text-lg font-black text-emerald-600 mt-0.5">{stats.properties.approved}</p>
                </div>
              </div>

              {/* Pending approvals */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 font-bold">
                  <AlertTriangle size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Pending Review</p>
                  <p className="text-lg font-black text-amber-600 mt-0.5">{stats.properties.pending}</p>
                </div>
              </div>

              {/* Total Booking Reservations */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 font-bold">
                  <BarChart2 size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Reservations</p>
                  <p className="text-lg font-black text-rose-600 mt-0.5">{stats.totalBookings || 0}</p>
                </div>
              </div>

              {/* Total Inquiries */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600 font-bold">
                  <FileText size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Inquiries</p>
                  <p className="text-lg font-black text-teal-600 mt-0.5">{stats.totalInquiries}</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Page Navigation Tabs */}
          <div className="flex border-b border-gray-150 flex-wrap animate-fade-in" id="admin-tab-controls">
            <button
              onClick={() => setActiveTab('properties')}
              className={`py-3 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'properties' ? 'border-emerald-600 text-emerald-700 font-extrabold' : 'border-transparent text-gray-400 hover:text-emerald-600'
              }`}
            >
              Approval Queue ({properties.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'users' ? 'border-emerald-600 text-emerald-700 font-extrabold' : 'border-transparent text-gray-400 hover:text-emerald-600'
              }`}
            >
              System User Directory ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-3 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'bookings' ? 'border-emerald-600 text-emerald-700 font-extrabold' : 'border-transparent text-gray-400 hover:text-emerald-600'
              }`}
            >
              Reservations Audit ({adminBookings.length})
            </button>
          </div>

          {/* TAB AREA: Properties approval verification desk */}
          {activeTab === 'properties' && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="font-extrabold text-gray-900 border-b border-gray-50 pb-4 mb-4">Properties Verification Queue</h2>

              {properties.length === 0 ? (
                <p className="text-xs text-gray-405 text-center py-8">No properties listed in directory.</p>
              ) : (
                <div className="space-y-4" id="admin-properties-list">
                  {properties.map((p) => (
                    <article 
                      key={p._id}
                      className={`border rounded-2xl p-4.5 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all bg-white shadow-xs ${
                        p.status === 'Pending' ? 'border-amber-200 bg-amber-50/10' : 'border-gray-100 hover:border-gray-150'
                      }`}
                    >
                      <div className="flex gap-4">
                        <img 
                          src={p.images[0]} 
                          alt={p.title} 
                          className="h-16 w-20 object-cover rounded-xl bg-gray-150 shrink-0 border border-gray-100"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {p.propertyType}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              p.status === 'Approved' ? 'bg-emerald-50 text-emerald-800' :
                              p.status === 'Rejected' ? 'bg-red-50 text-red-800' :
                              'bg-amber-50 text-amber-800'
                            }`}>
                              Status: {p.status}
                            </span>
                            <span className="text-[10px] text-gray-400">Owner: {p.ownerInfo?.name || 'Unknown'}</span>
                          </div>

                          <h3 className="font-extrabold text-sm text-gray-900 mt-2 line-clamp-1">{p.title}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{p.location}, {p.city} &bull; <strong className="text-emerald-600">Rs. {Number(p.rent).toLocaleString()}/month</strong></p>
                        </div>
                      </div>

                      {/* Control keys */}
                      <div className="flex flex-wrap items-center gap-2 self-end md:self-auto border-t border-gray-50 md:border-0 pt-3 md:pt-0 w-full md:w-auto justify-end">
                        <Link
                          to={`/properties/${p._id}`}
                          className="text-[10px] font-bold text-gray-600 hover:text-emerald-700 bg-gray-55/80 bg-gray-50 py-2 px-3 border border-gray-150 rounded-lg flex items-center gap-0.5"
                          target="_blank"
                        >
                          View <ExternalLink size={11} />
                        </Link>

                        {p.status !== 'Approved' && (
                          <button
                            onClick={() => handleModifyPropertyApproval(p._id, 'Approved')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg p-2 text-xs font-bold"
                            title="Approve Listing"
                          >
                            <Check size={14} className="stroke-[2.5]" />
                          </button>
                        )}

                        {p.status !== 'Rejected' && (
                          <button
                            onClick={() => handleModifyPropertyApproval(p._id, 'Rejected')}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-lg p-2 text-xs font-bold"
                            title="Reject Listing"
                          >
                            <X size={14} className="stroke-[2.5]" />
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteConfirmId(p._id)}
                          className="bg-red-650 bg-red-600 hover:bg-red-700 text-white rounded-lg p-2 text-xs"
                          title="Purge Listing Permanently"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB AREA: Users accounts list */}
          {activeTab === 'users' && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-4">
                <div>
                  <h2 className="font-extrabold text-lg text-gray-900">System Users Directory</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Filter, search, inspect and manage credentials or status profiles of all registrants</p>
                </div>
                <div className="text-xs bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl font-bold text-slate-700">
                  Total Records: {filteredUsers.length} of {users.length}
                </div>
              </div>

              {/* Filters Workspace Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
                {/* Search Term */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Search size={10} /> Search Name/Email/Phone
                  </label>
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Search query..."
                    className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                {/* Role Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Users size={10} /> Designated Role
                  </label>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="w-full text-xs bg-white border border-gray-200 rounded-xl px-2 py-2 focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="all">All Roles</option>
                    <option value="Tenant">Tenant</option>
                    <option value="Property Owner">Property Owner</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                {/* Verification Status Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <FileText size={10} /> Verification Status
                  </label>
                  <select
                    value={userVerificationFilter}
                    onChange={(e) => setUserVerificationFilter(e.target.value)}
                    className="w-full text-xs bg-white border border-gray-200 rounded-xl px-2 py-2 focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="all">All Verification States</option>
                    <option value="Verified">Verified</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Not Submitted">Not Submitted</option>
                  </select>
                </div>

                {/* Account Status Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Ban size={10} /> Account Status
                  </label>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="w-full text-xs bg-white border border-gray-200 rounded-xl px-2 py-2 focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="all">All Account States</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Deleted">Deleted</option>
                  </select>
                </div>

                {/* Registration Date Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={10} /> Registration Date
                  </label>
                  <select
                    value={userRegDateFilter}
                    onChange={(e) => setUserRegDateFilter(e.target.value)}
                    className="w-full text-xs bg-white border border-gray-200 rounded-xl px-2 py-2 focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Joined Today</option>
                    <option value="week">Joined this Week</option>
                    <option value="month">Joined this Month</option>
                  </select>
                </div>
              </div>

              {/* Show Deleted Users Toggle */}
              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  id="show-deleted-users-checkbox"
                  checked={showDeletedUsers}
                  onChange={(e) => setShowDeletedUsers(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="show-deleted-users-checkbox" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                  Show Soft-Deleted Accounts
                </label>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-150 rounded-2xl">
                  <Users className="mx-auto text-gray-300 mb-2" size={28} />
                  <p className="text-xs text-gray-400 font-bold">No users found matching selected search or filter criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                  <table className="w-full text-left text-xs" id="admin-users-table">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Full Name</th>
                        <th className="py-3 px-4">Contact info</th>
                        <th className="py-3 px-4">Designated Role</th>
                        <th className="py-3 px-4 text-center">Verification Status</th>
                        <th className="py-3 px-4 text-center">Account Status</th>
                        <th className="py-3 px-4 text-right">Review Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                      {filteredUsers.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {item.photo ? (
                                <img src={item.photo} alt={item.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center border border-emerald-100 uppercase">
                                  {item.name ? item.name.charAt(0) : 'U'}
                                </div>
                              )}
                              <div>
                                <span className="font-extrabold text-gray-900 block">{item.name}</span>
                                <span className="text-[10px] text-gray-400 font-semibold">Registered: {new Date(item.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-0.5 text-gray-500">
                              <span className="block truncate max-w-[180px] font-semibold">{item.email}</span>
                              <span className="block text-[10px]">{item.phone || 'No phone registered'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              item.role === 'Admin' ? 'bg-slate-900 text-white' :
                              item.role === 'Property Owner' ? 'bg-emerald-50 text-emerald-800' :
                              'bg-indigo-50 text-indigo-700'
                            }`}>
                              {item.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                              item.verificationStatus === 'Verified' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                              item.verificationStatus === 'Under Review' ? 'bg-blue-50 border-blue-100 text-blue-700 animate-pulse' :
                              item.verificationStatus === 'Rejected' ? 'bg-red-50 border-red-100 text-red-700' :
                              'bg-gray-50 border-gray-150 text-gray-500'
                            }`}>
                              {item.verificationStatus || 'Not Submitted'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                              (item.status || 'Active') === 'Active' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                              (item.status || 'Active') === 'Suspended' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                              'bg-red-50 border-red-100 text-red-700'
                            }`}>
                              {item.status || 'Active'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleOpenReview(item)}
                              className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/60 px-3 py-1.5 rounded-xl border border-emerald-100 cursor-pointer transition-colors"
                            >
                              Manage Record
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB AREA: Reservations Auditing desk */}
          {activeTab === 'bookings' && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="font-extrabold text-gray-900 border-b border-gray-50 pb-4 mb-4">Platform Reservations Registry</h2>
              
              {adminBookings.length === 0 ? (
                <div className="text-center py-12 text-gray-400 font-bold text-xs">
                  No reservations are registered on the platform.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs" id="admin-bookings-table">
                    <thead>
                      <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Property</th>
                        <th className="py-3 px-4">Landlord</th>
                        <th className="py-3 px-4">Tenant</th>
                        <th className="py-3 px-4">Timeline / Occupants</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                      {adminBookings.map((b) => (
                        <tr key={b._id} className="hover:bg-gray-50/50">
                          {/* Property info */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <img src={b.propertyImage} alt="" className="h-8 w-10 object-cover rounded-lg border bg-gray-50 shrink-0" referrerPolicy="no-referrer" />
                              <div>
                                <span className="font-bold text-gray-900 block leading-tight">{b.propertyTitle}</span>
                                <span className="text-[10px] text-gray-400">ID: {b._id}</span>
                              </div>
                            </div>
                          </td>
                          {/* Landlord details */}
                          <td className="py-4 px-4">
                            <div className="space-y-0.5">
                              <span className="font-bold text-gray-800 block">{b.ownerName || 'Host'}</span>
                              <span className="text-[10px] text-gray-500 block">{b.ownerEmail}</span>
                            </div>
                          </td>
                          {/* Tenant details */}
                          <td className="py-4 px-4">
                            <div className="space-y-0.5">
                              <span className="font-bold text-gray-800 block">{b.tenantName}</span>
                              <span className="text-[10px] text-gray-500 block">{b.tenantEmail}</span>
                            </div>
                          </td>
                          {/* Timeline details */}
                          <td className="py-4 px-4">
                            <div className="space-y-0.5 text-[10px] text-gray-650 text-gray-600">
                              <div><strong className="text-gray-800">Move-In:</strong> {formatDate(b.moveInDate || b.checkInDate)}</div>
                              {b.checkOutDate && <div><strong className="text-gray-800">Check-Out:</strong> {formatDate(b.checkOutDate)}</div>}
                              <div><strong className="text-gray-800">Occupants:</strong> {b.occupants} Person(s)</div>
                            </div>
                          </td>
                          {/* Status */}
                          <td className="py-4 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                              b.status === 'Confirmed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                              b.status === 'Rejected' ? 'bg-red-50 border-red-100 text-red-700' :
                              b.status === 'Cancelled' ? 'bg-gray-50 border-gray-150 text-gray-500' :
                              b.status === 'Completed' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                              'bg-amber-50 border-amber-100 text-amber-700'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Modern custom confirmation modal to bypass iframe window.confirm limitations */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-all duration-200">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Are you absolutely sure?</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                This operation is permanent. The property listing as well as all related inquiries, tenant messages, and platform counts will be purged forever.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  const id = deleteConfirmId;
                  setDeleteConfirmId(null);
                  await executeAdminDeleteListing(id);
                }}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed User Profile & Review Master Modal */}
      {reviewUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-all duration-200">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-fade-in flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">User Account Control Hub</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Full profile audit, document verification desk and action management</p>
              </div>
              <button 
                onClick={() => {
                  setReviewUser(null);
                  setSelectedUserDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Sub-tabs */}
            <div className="flex border-b border-gray-100 text-xs">
              <button
                onClick={() => setModalTab('profile')}
                className={`pb-2 px-4 font-bold border-b-2 transition-all cursor-pointer ${
                  modalTab === 'profile' ? 'border-emerald-600 text-emerald-700 font-extrabold' : 'border-transparent text-gray-400 hover:text-emerald-600'
                }`}
              >
                Profile & Details
              </button>
              <button
                onClick={() => setModalTab('documents')}
                className={`pb-2 px-4 font-bold border-b-2 transition-all cursor-pointer ${
                  modalTab === 'documents' ? 'border-emerald-600 text-emerald-700 font-extrabold' : 'border-transparent text-gray-400 hover:text-emerald-600'
                }`}
              >
                Identity Documents ({reviewUser.verificationDetails ? '1' : '0'})
              </button>
              <button
                onClick={() => setModalTab('activity')}
                className={`pb-2 px-4 font-bold border-b-2 transition-all cursor-pointer ${
                  modalTab === 'activity' ? 'border-emerald-600 text-emerald-700 font-extrabold' : 'border-transparent text-gray-400 hover:text-emerald-600'
                }`}
              >
                Activity & History
              </button>
              <button
                onClick={() => setModalTab('actions')}
                className={`pb-2 px-4 font-bold border-b-2 transition-all cursor-pointer ${
                  modalTab === 'actions' ? 'border-emerald-600 text-emerald-700 font-extrabold' : 'border-transparent text-gray-400 hover:text-emerald-600'
                }`}
              >
                Account Controls
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[50vh] pr-1 py-1">
              
              {/* Profile details tab */}
              {modalTab === 'profile' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="flex flex-col sm:flex-row gap-5 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {reviewUser.photo ? (
                      <img src={reviewUser.photo} alt={reviewUser.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 font-extrabold flex items-center justify-center border border-emerald-200 text-xl uppercase">
                        {reviewUser.name ? reviewUser.name.charAt(0) : 'U'}
                      </div>
                    )}
                    <div className="text-center sm:text-left space-y-1">
                      <h4 className="font-black text-base text-gray-900">{reviewUser.name}</h4>
                      <div className="flex flex-wrap gap-1.5 items-center justify-center sm:justify-start">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide uppercase ${
                          reviewUser.role === 'Admin' ? 'bg-slate-900 text-white' :
                          reviewUser.role === 'Property Owner' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-indigo-100 text-indigo-800'
                        }`}>
                          {reviewUser.role}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide uppercase ${
                          (reviewUser.status || 'Active') === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          (reviewUser.status || 'Active') === 'Suspended' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          Status: {reviewUser.status || 'Active'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-semibold">Registered: {new Date(reviewUser.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        <Info size={11} /> Personal Information
                      </span>
                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-semibold">Email Address</span>
                          <span className="font-bold text-gray-800 block truncate">{reviewUser.email}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-semibold">Phone Contact</span>
                          <span className="font-bold text-gray-800">{reviewUser.phone || 'No phone registered'}</span>
                        </div>
                        {selectedUserDetails?.profile && (
                          <>
                            <div>
                              <span className="text-[10px] text-gray-400 block font-semibold">Date of Birth</span>
                              <span className="font-bold text-gray-800">{selectedUserDetails.profile.dob || 'Not provided'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 block font-semibold">Registered Address</span>
                              <span className="font-bold text-gray-800">{selectedUserDetails.profile.address || 'Not provided'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="border border-gray-100 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                          <Shield size={11} /> Verification Status
                        </span>
                        <div className="mt-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                            reviewUser.verificationStatus === 'Verified' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                            reviewUser.verificationStatus === 'Under Review' ? 'bg-blue-50 border-blue-100 text-blue-700 animate-pulse' :
                            reviewUser.verificationStatus === 'Rejected' ? 'bg-red-50 border-red-100 text-red-700' :
                            'bg-gray-50 border-gray-150 text-gray-500'
                          }`}>
                            {reviewUser.verificationStatus || 'Not Submitted'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[9px] text-gray-400 block font-bold">LAST LOGIN ATTEMPT</span>
                        <p className="font-bold text-gray-800 text-[11px] leading-tight">
                          {selectedUserDetails?.lastLogin?.timestamp ? new Date(selectedUserDetails.lastLogin.timestamp).toLocaleString() : 'No record'}
                        </p>
                        {selectedUserDetails?.lastLogin?.ip && (
                          <span className="text-[9px] font-mono text-gray-400">IP: {selectedUserDetails.lastLogin.ip}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents tab */}
              {modalTab === 'documents' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  {reviewUser.verificationDetails ? (
                    <div className="space-y-4">
                      <div className="border border-gray-100 rounded-2xl p-4 bg-slate-50/50">
                        <h4 className="text-xs font-black text-gray-800 border-b border-gray-100 pb-2 mb-3">Submitted Identification Record</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">Document Category</span>
                            <span className="font-extrabold text-gray-800">{reviewUser.verificationDetails.documentType || 'Identity Card'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">Document Identification Number</span>
                            <span className="font-extrabold text-gray-800">{reviewUser.verificationDetails.documentNumber || 'N/A'}</span>
                          </div>
                          {reviewUser.verificationDetails.issueDate && (
                            <div>
                              <span className="text-[10px] text-gray-400 block font-semibold">Issued Date</span>
                              <span className="font-extrabold text-gray-800">{reviewUser.verificationDetails.issueDate}</span>
                            </div>
                          )}
                          {reviewUser.verificationDetails.expiryDate && (
                            <div>
                              <span className="text-[10px] text-gray-400 block font-semibold">Expiry Date</span>
                              <span className="font-extrabold text-gray-800">{reviewUser.verificationDetails.expiryDate}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {reviewUser.verificationDetails.frontSideUrl && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Front Image File</span>
                            {reviewUser.verificationDetails.frontSideUrl.endsWith('.pdf') || reviewUser.verificationDetails.frontSideUrl.startsWith('data:application/pdf') ? (
                              <a 
                                href={reviewUser.verificationDetails.frontSideUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-gray-100 transition-colors"
                              >
                                <FileText className="text-red-500" size={18} />
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-gray-700 block truncate">View Front PDF File</span>
                                  <span className="text-[9px] text-gray-400">PDF File</span>
                                </div>
                              </a>
                            ) : (
                              <div className="border border-gray-150 rounded-2xl overflow-hidden relative group bg-gray-100 h-44">
                                <img src={reviewUser.verificationDetails.frontSideUrl} alt="Front Document" className="w-full h-full object-contain bg-slate-900" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all gap-2">
                                  <button onClick={() => setZoomImg(reviewUser.verificationDetails.frontSideUrl)} className="text-white text-xs bg-emerald-600 px-3 py-1.5 rounded-xl font-bold hover:bg-emerald-700 cursor-pointer">
                                    Enlarge Zoom
                                  </button>
                                  <a href={reviewUser.verificationDetails.frontSideUrl} download={`front_doc_${reviewUser.name}.jpg`} className="text-white text-xs bg-gray-800/80 p-1.5 rounded-xl hover:bg-gray-700">
                                    <Download size={14} />
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {reviewUser.verificationDetails.backSideUrl && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Back Image File</span>
                            {reviewUser.verificationDetails.backSideUrl.endsWith('.pdf') || reviewUser.verificationDetails.backSideUrl.startsWith('data:application/pdf') ? (
                              <a 
                                href={reviewUser.verificationDetails.backSideUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-gray-100 transition-colors"
                              >
                                <FileText className="text-red-500" size={18} />
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-gray-700 block truncate">View Back PDF File</span>
                                  <span className="text-[9px] text-gray-400">PDF File</span>
                                </div>
                              </a>
                            ) : (
                              <div className="border border-gray-150 rounded-2xl overflow-hidden relative group bg-gray-100 h-44">
                                <img src={reviewUser.verificationDetails.backSideUrl} alt="Back Document" className="w-full h-full object-contain bg-slate-900" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all gap-2">
                                  <button onClick={() => setZoomImg(reviewUser.verificationDetails.backSideUrl)} className="text-white text-xs bg-emerald-600 px-3 py-1.5 rounded-xl font-bold hover:bg-emerald-700 cursor-pointer">
                                    Enlarge Zoom
                                  </button>
                                  <a href={reviewUser.verificationDetails.backSideUrl} download={`back_doc_${reviewUser.name}.jpg`} className="text-white text-xs bg-gray-800/80 p-1.5 rounded-xl hover:bg-gray-700">
                                    <Download size={14} />
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Document decision control panel */}
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3.5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Decision Actions Desk</span>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 mb-1">Feedback Note (Required if Rejecting or Requesting re-upload)</label>
                            <textarea 
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Describe the rejection context or specify exactly which details need re-uploading."
                              className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs focus:outline-none focus:border-red-400 min-h-[55px] font-semibold"
                            />
                          </div>

                          <div className="flex flex-wrap gap-2 justify-end">
                            <button 
                              onClick={() => setConfirmModal({ type: 'requestReupload', userId: reviewUser._id })}
                              disabled={submittingReview}
                              className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-xl cursor-pointer disabled:opacity-50"
                            >
                              Request Document Re-Upload
                            </button>
                            <button 
                              onClick={() => setConfirmModal({ type: 'rejectVerification', userId: reviewUser._id })}
                              disabled={submittingReview}
                              className="text-xs font-bold bg-red-650 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl cursor-pointer disabled:opacity-50"
                            >
                              Reject Credentials
                            </button>
                            <button 
                              onClick={() => setConfirmModal({ type: 'approveVerification', userId: reviewUser._id })}
                              disabled={submittingReview}
                              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-5 rounded-xl cursor-pointer disabled:opacity-50"
                            >
                              Verify & Approve Document
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400 font-bold">
                      <FileText className="mx-auto text-gray-300 mb-2" size={24} />
                      This user has not submitted any verification documents yet.
                    </div>
                  )}
                </div>
              )}

              {/* Activity statistics and reservations track */}
              {modalTab === 'activity' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  {loadingDetails ? (
                    <div className="flex justify-center py-12">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
                    </div>
                  ) : selectedUserDetails ? (
                    <div className="space-y-4">
                      {/* Platform Activity Metric Counts */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-center">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Own Properties</span>
                          <span className="text-xl font-black text-slate-800">{selectedUserDetails.propertiesCount || 0}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-center">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Reservations</span>
                          <span className="text-xl font-black text-slate-800">{selectedUserDetails.bookingsCount || 0}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-center">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Total Inquiries</span>
                          <span className="text-xl font-black text-slate-800">{selectedUserDetails.inquiriesCount || 0}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-center">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Event Logged</span>
                          <span className="text-xl font-black text-slate-800">{selectedUserDetails.auditCount || 0}</span>
                        </div>
                      </div>

                      {/* Custom User History Logs */}
                      <div className="border border-gray-100 rounded-2xl p-4">
                        <h4 className="font-extrabold text-xs text-gray-800 border-b border-gray-50 pb-2 mb-3">Recent Security Logs</h4>
                        {selectedUserDetails.userAuditLogs && selectedUserDetails.userAuditLogs.length > 0 ? (
                          <div className="space-y-2 max-h-[180px] overflow-y-auto font-sans">
                            {selectedUserDetails.userAuditLogs.map((log) => (
                              <div key={log._id} className="flex justify-between items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                                <div>
                                  <span className="font-bold text-gray-800 block">{log.action}</span>
                                  <span className="text-gray-500 leading-snug">{log.details}</span>
                                </div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase shrink-0">{new Date(log.createdAt).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-400 text-center py-4 font-semibold">No operational log entries registered for this account.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-6">Could not pull activity data.</p>
                  )}
                </div>
              )}

              {/* Account Controls and Restrictions Tab */}
              {modalTab === 'actions' && (
                <div className="space-y-4 animate-fade-in text-xs font-sans">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3.5">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Lock size={12} className="text-slate-600" /> Administrative Access & Constraints
                    </h4>

                    {/* Suspension Alerts / Switch Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      <div className="border border-amber-100 bg-amber-50/20 rounded-2xl p-3.5 space-y-2">
                        <span className="font-bold text-amber-800 flex items-center gap-1"><Ban size={13} /> Temporary Account Suspension</span>
                        <p className="text-[11px] text-amber-900/80 leading-relaxed">
                          Suspending this user will prevent them from signing in or editing any properties. Their listed spaces will remain temporarily marked as offline until activated.
                        </p>
                        <div className="pt-1">
                          {(reviewUser.status || 'Active') === 'Suspended' ? (
                            <button
                              onClick={() => setConfirmModal({ type: 'activate', userId: reviewUser._id })}
                              className="text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl flex items-center gap-1 cursor-pointer"
                            >
                              <Power size={11} /> Activate Account Now
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmModal({ type: 'suspend', userId: reviewUser._id })}
                              className="text-[10px] font-black bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-xl flex items-center gap-1 cursor-pointer"
                            >
                              <Ban size={11} /> Suspend Account Now
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="border border-red-100 bg-red-50/20 rounded-2xl p-3.5 space-y-2">
                        <span className="font-bold text-red-800 flex items-center gap-1"><Trash2 size={13} /> Soft Account Deletion</span>
                        <p className="text-[11px] text-red-900/80 leading-relaxed">
                          Soft-deleting this account flags it as inactive and logs them out. Their properties will be marked offline. Safety guards protect them from active listings or booking conflicts.
                        </p>
                        <div className="pt-1">
                          {(reviewUser.status || 'Active') === 'Deleted' ? (
                            <button
                              onClick={() => setConfirmModal({ type: 'restoreUser', userId: reviewUser._id })}
                              className="text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl flex items-center gap-1 cursor-pointer"
                            >
                              <Power size={11} /> Recover Deleted Account
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmModal({ type: 'delete', userId: reviewUser._id })}
                              className="text-[10px] font-black bg-red-650 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={11} /> Soft-Delete Account
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Force Delete Safety Warning Trigger */}
                    {deletionWarning && (
                      <div className="border border-red-200 bg-red-50 p-4 rounded-2xl space-y-3">
                        <h5 className="font-black text-red-800 flex items-center gap-1.5"><AlertTriangle size={15} /> Deletion Safety Check Warning</h5>
                        <p className="text-xs text-red-900/80 leading-normal font-semibold">
                          This user has active platform records. Direct soft-deletion is blocked for the following reasons:
                        </p>
                        <ul className="text-xs text-red-900/80 font-bold list-disc pl-5 space-y-1">
                          {deletionWarning.listedProperties > 0 && (
                            <li>Listed Properties: {deletionWarning.listedProperties} active listings</li>
                          )}
                          {deletionWarning.activeBookings > 0 && (
                            <li>Active Bookings: {deletionWarning.activeBookings} confirmed bookings</li>
                          )}
                          {deletionWarning.activeRentalAgreements > 0 && (
                            <li>Active Rental Agreements: {deletionWarning.activeRentalAgreements} confirmed agreements</li>
                          )}
                          {deletionWarning.pendingBookings > 0 && (
                            <li>Pending Bookings: {deletionWarning.pendingBookings} requests awaiting review</li>
                          )}
                          {deletionWarning.hasVerificationRecords === 1 && (
                            <li>Verification Records: User has verified credentials or active documents</li>
                          )}
                        </ul>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => {
                              setDeletionWarning(null);
                              setDeletingUserId(null);
                            }}
                            className="bg-white border border-gray-200 text-gray-700 font-extrabold text-[10px] py-2 px-4.5 rounded-xl cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUserDelete(deletingUserId, true)}
                            disabled={deletingLoading}
                            className="bg-red-700 hover:bg-red-800 text-white font-extrabold text-[10px] py-2 px-4 rounded-xl cursor-pointer"
                          >
                            Force Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 pt-3 flex justify-end">
              <button 
                onClick={() => {
                  setReviewUser(null);
                  setSelectedUserDetails(null);
                }}
                className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-5 rounded-2xl transition-all cursor-pointer"
              >
                Close Hub
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Image zoom lightbox */}
      {zoomImg && (
        <div className="fixed inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 z-55 animate-fade-in" style={{ zIndex: 1000 }} onClick={() => setZoomImg(null)}>
          <button 
            onClick={() => setZoomImg(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 bg-white/10 rounded-full cursor-pointer hover:bg-white/20 transition-all"
          >
            <X size={20} />
          </button>
          <img src={zoomImg} alt="Enlarged credentials display" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" referrerPolicy="no-referrer" />
          <p className="text-xs text-gray-400 font-semibold mt-4">Full Screen Magnifier &bull; Click anywhere or close button to exit</p>
        </div>
      )}

      {/* Action confirmation modal for Suspend, Activate, Delete, Reject Verification, Request Reupload, Approve Verification, Restore User */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] transition-all duration-200">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-md w-full p-6 shadow-xl space-y-4 animate-fade-in">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              confirmModal.type === 'delete' || confirmModal.type === 'rejectVerification' ? 'bg-red-50 text-red-600' :
              confirmModal.type === 'approveVerification' || confirmModal.type === 'activate' || confirmModal.type === 'restoreUser' ? 'bg-emerald-50 text-emerald-600' :
              'bg-amber-50 text-amber-600'
            }`}>
              {confirmModal.type === 'delete' || confirmModal.type === 'rejectVerification' ? (
                <Trash2 size={24} />
              ) : confirmModal.type === 'approveVerification' || confirmModal.type === 'activate' || confirmModal.type === 'restoreUser' ? (
                <CheckCircle2 size={24} />
              ) : (
                <AlertTriangle size={24} />
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {confirmModal.type === 'suspend' && 'Suspend User Account'}
                {confirmModal.type === 'activate' && 'Reactivate User Account'}
                {confirmModal.type === 'delete' && 'Delete User Account'}
                {confirmModal.type === 'rejectVerification' && 'Reject Verification Request'}
                {confirmModal.type === 'requestReupload' && 'Request Document Re-upload'}
                {confirmModal.type === 'approveVerification' && 'Approve User Verification'}
                {confirmModal.type === 'restoreUser' && 'Restore User Account'}
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed font-semibold">
                {confirmModal.type === 'suspend' && 'Are you sure you want to suspend this user? They will not be able to log in, make bookings, list properties, or use the platform until their account is reactivated. Their existing data will remain محفوظ (kept safely).'}
                {confirmModal.type === 'activate' && 'This user will regain full access to their account and can continue using all platform features.'}
                {confirmModal.type === 'delete' && 'Are you sure you want to delete this user? This action will deactivate the account and remove it from active users. Related bookings, properties, and history will be preserved according to system rules.'}
                {confirmModal.type === 'rejectVerification' && 'Please provide a reason for rejecting this verification request. The user will receive your feedback and can submit updated documents.'}
                {confirmModal.type === 'requestReupload' && 'The submitted document cannot be verified. Send a request asking the user to upload a clearer or valid document.'}
                {confirmModal.type === 'approveVerification' && "This will verify the user's identity and grant access to all verified features."}
                {confirmModal.type === 'restoreUser' && "This will restore the user's account and allow them to access the platform again."}
              </p>
            </div>

            {/* If verification action needs feedback, render the textarea inside the modal */}
            {(confirmModal.type === 'rejectVerification' || confirmModal.type === 'requestReupload') && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  Feedback Note (Required)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={
                    confirmModal.type === 'requestReupload'
                      ? 'Example: "The uploaded citizenship image is blurry. Please upload a clear image showing all details."'
                      : 'Describe the rejection context or specify exactly which details are incorrect.'
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 min-h-[75px] font-semibold"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setConfirmModal(null)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  const type = confirmModal.type;
                  const userId = confirmModal.userId;

                  if ((type === 'rejectVerification' || type === 'requestReupload') && !rejectionReason.trim()) {
                    showToast({
                      type: 'error',
                      title: 'Input Required',
                      message: 'Please provide a feedback note reason.'
                    });
                    return;
                  }

                  setConfirmModal(null);
                  if (type === 'suspend') {
                    await handleUserSuspend(userId);
                  } else if (type === 'activate') {
                    await handleUserActivate(userId);
                  } else if (type === 'delete') {
                    await handleUserDelete(userId);
                  } else if (type === 'restoreUser') {
                    await handleUserRestore(userId);
                  } else if (type === 'approveVerification') {
                    await handleVerificationReviewWithCustom(userId, 'Verified', false);
                  } else if (type === 'rejectVerification') {
                    await handleVerificationReviewWithCustom(userId, 'Rejected', false);
                  } else if (type === 'requestReupload') {
                    await handleVerificationReviewWithCustom(userId, 'Rejected', true);
                  }
                }}
                disabled={((confirmModal.type === 'rejectVerification' || confirmModal.type === 'requestReupload') && !rejectionReason.trim()) || submittingReview}
                className={`text-xs text-white font-bold py-2.5 px-5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
                  confirmModal.type === 'delete' || confirmModal.type === 'rejectVerification' ? 'bg-red-600 hover:bg-red-700' :
                  confirmModal.type === 'approveVerification' || confirmModal.type === 'activate' || confirmModal.type === 'restoreUser' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {confirmModal.type === 'suspend' && 'Suspend User'}
                {confirmModal.type === 'activate' && 'Activate User'}
                {confirmModal.type === 'delete' && 'Delete User'}
                {confirmModal.type === 'rejectVerification' && 'Reject Verification'}
                {confirmModal.type === 'requestReupload' && 'Send Re-upload Request'}
                {confirmModal.type === 'approveVerification' && 'Approve & Verify'}
                {confirmModal.type === 'restoreUser' && 'Restore User'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
