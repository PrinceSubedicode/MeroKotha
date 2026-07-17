import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { Shield, Users, Home, Mail, FileText, CheckCircle2, XCircle, Trash2, AlertTriangle, RefreshCw, BarChart2, Check, X, ExternalLink } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // Tab screens: 'properties', 'users', 'stats'
  const [activeTab, setActiveTab] = useState('properties');

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Identity document review states
  const [reviewUser, setReviewUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Load administrative dataset
  const loadAdminDataset = async () => {
    setLoading(true);
    setError(null);
    try {
      // Async gather stats, users, and properties from admin API endpoints
      const [statsRes, usersRes, propsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/properties')
      ]);

      setStats(statsRes.data.stats);
      setUsers(usersRes.data);
      setProperties(propsRes.data);
    } catch (err) {
      console.error('Failed fetching admin datasets:', err);
      setError('Failed to sync administrative platform datasets. Confirm system privileges.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationReview = async (userId, status) => {
    if (status === 'Rejected' && !rejectionReason.trim()) {
      alert('Please provide a rejection feedback note before rejecting credentials.');
      return;
    }
    setSubmittingReview(true);
    try {
      await api.put(`/admin/users/${userId}/verification-review`, {
        status,
        rejectionReason: status === 'Rejected' ? rejectionReason : undefined
      });
      setReviewUser(null);
      setRejectionReason('');
      loadAdminDataset();
    } catch (err) {
      console.error('Verification review failed:', err);
      alert(err.response?.data?.message || 'Verification review process failed.');
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'Admin') {
      loadAdminDataset();
    }
  }, [user]);

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

  if (!user || user.role !== 'Admin') {
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
        <button 
          onClick={loadAdminDataset}
          className="rounded-xl border border-gray-700 hover:bg-gray-800 text-white py-2 px-4 text-xs font-bold flex items-center gap-1.5"
        >
          <RefreshCw size={12} /> Sync Datasets
        </button>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="admin-stats-cards">
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
          <div className="flex border-b border-gray-150" id="admin-tab-controls">
            <button
              onClick={() => setActiveTab('properties')}
              className={`py-3 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'properties' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-400'
              }`}
            >
              Approval Queue ({properties.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'users' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-400'
              }`}
            >
              System User Directory ({users.length})
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
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="font-extrabold text-gray-900 border-b border-gray-50 pb-4 mb-4">Registered System Users</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs" id="admin-users-table">
                  <thead>
                    <tr className="border-b border-gray-150 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Full Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Designated Role</th>
                      <th className="py-3 px-4 text-center">Verification Status</th>
                      <th className="py-3 px-4 text-right">Review Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                    {users.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50/50">
                        <td className="py-3.5 px-4 font-bold text-gray-900">{item.name}</td>
                        <td className="py-3.5 px-4">{item.email}</td>
                        <td className="py-3.5 px-4">{item.phone}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            item.role === 'Admin' ? 'bg-slate-900 text-white' :
                            item.role === 'Property Owner' ? 'bg-emerald-50 text-emerald-800' :
                            'bg-indigo-50 text-indigo-700'
                          }`}>
                            {item.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                            item.verificationStatus === 'Verified' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                            item.verificationStatus === 'Under Review' ? 'bg-blue-50 border-blue-100 text-blue-700 animate-pulse' :
                            item.verificationStatus === 'Rejected' ? 'bg-red-50 border-red-100 text-red-700' :
                            'bg-gray-50 border-gray-150 text-gray-500'
                          }`}>
                            {item.verificationStatus || 'Not Submitted'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setReviewUser(item);
                              setRejectionReason('');
                            }}
                            className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/60 px-2.5 py-1.5 rounded-lg border border-emerald-100"
                          >
                            Review Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

      {/* Identity Verification Document Review Modal Overlay */}
      {reviewUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-all duration-200">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Document Verification Desk</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Inspect user credentials and make a review decision</p>
              </div>
              <button 
                onClick={() => setReviewUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Applicant Information</span>
                <p className="font-extrabold text-sm text-gray-900">{reviewUser.name}</p>
                <p className="text-gray-500 font-semibold">{reviewUser.email}</p>
                <p className="text-gray-500 font-semibold">{reviewUser.phone}</p>
                <p className="mt-1">
                  Role Profile: <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">{reviewUser.role}</span>
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Current Status</span>
                  <div className="mt-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      reviewUser.verificationStatus === 'Verified' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                      reviewUser.verificationStatus === 'Under Review' ? 'bg-blue-50 border-blue-100 text-blue-700 animate-pulse' :
                      reviewUser.verificationStatus === 'Rejected' ? 'bg-red-50 border-red-100 text-red-700' :
                      'bg-gray-50 border-gray-150 text-gray-500'
                    }`}>
                      {reviewUser.verificationStatus || 'Not Submitted'}
                    </span>
                  </div>
                </div>

                {reviewUser.verificationDetails?.uploadedDate && (
                  <p className="text-[10px] text-gray-400 mt-2 font-bold">
                    Submitted on: {new Date(reviewUser.verificationDetails.uploadedDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {reviewUser.verificationDetails ? (
              <div className="space-y-4">
                <div className="border border-gray-150 rounded-2xl p-4 space-y-3 bg-white">
                  <h4 className="text-xs font-extrabold text-gray-800 border-b border-gray-50 pb-2">Submitted Credentials Details</h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">Document Type</span>
                      <span className="font-bold text-gray-800">{reviewUser.verificationDetails.documentType}</span>
                    </div>
                    {reviewUser.verificationDetails.documentNumber && (
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Document ID Number</span>
                        <span className="font-bold text-gray-800">{reviewUser.verificationDetails.documentNumber}</span>
                      </div>
                    )}
                    {reviewUser.verificationDetails.issuingAuthority && (
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Issuing Authority</span>
                        <span className="font-bold text-gray-800">{reviewUser.verificationDetails.issuingAuthority}</span>
                      </div>
                    )}
                    {(reviewUser.verificationDetails.issueDate || reviewUser.verificationDetails.expiryDate) && (
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Validity Dates</span>
                        <span className="font-bold text-gray-800">
                          {reviewUser.verificationDetails.issueDate || 'N/A'} to {reviewUser.verificationDetails.expiryDate || 'Present'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {reviewUser.verificationDetails.frontSideUrl && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Front Side File</span>
                      {reviewUser.verificationDetails.frontSideUrl.endsWith('.pdf') || reviewUser.verificationDetails.frontSideUrl.startsWith('data:application/pdf') ? (
                        <a 
                          href={reviewUser.verificationDetails.frontSideUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-gray-100 transition-colors"
                        >
                          <FileText className="text-red-500" size={18} />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-gray-700 block truncate font-sans">Open Front PDF File</span>
                            <span className="text-[9px] text-gray-400">PDF Document</span>
                          </div>
                        </a>
                      ) : (
                        <div className="border border-gray-150 rounded-2xl overflow-hidden relative group bg-gray-100">
                          <img src={reviewUser.verificationDetails.frontSideUrl} alt="Front Document" className="w-full h-36 object-contain bg-slate-900" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <a href={reviewUser.verificationDetails.frontSideUrl} target="_blank" rel="noopener noreferrer" className="text-white text-xs font-bold underline">
                              Open in New Tab
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {reviewUser.verificationDetails.backSideUrl && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Back Side File</span>
                      {reviewUser.verificationDetails.backSideUrl.endsWith('.pdf') || reviewUser.verificationDetails.backSideUrl.startsWith('data:application/pdf') ? (
                        <a 
                          href={reviewUser.verificationDetails.backSideUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-2xl hover:bg-gray-100 transition-colors"
                        >
                          <FileText className="text-red-500" size={18} />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-gray-700 block truncate font-sans">Open Back PDF File</span>
                            <span className="text-[9px] text-gray-400">PDF Document</span>
                          </div>
                        </a>
                      ) : (
                        <div className="border border-gray-150 rounded-2xl overflow-hidden relative group bg-gray-100">
                          <img src={reviewUser.verificationDetails.backSideUrl} alt="Back Document" className="w-full h-36 object-contain bg-slate-900" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <a href={reviewUser.verificationDetails.backSideUrl} target="_blank" rel="noopener noreferrer" className="text-white text-xs font-bold underline">
                              Open in New Tab
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-xs font-bold">
                No identity verification documents have been submitted by this user.
              </div>
            )}

            {/* Decision panel */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 sm:p-5 space-y-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Review Decision Workspace</span>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Rejection Feedback Notes (Required if Rejecting)</label>
                  <textarea 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Document image is blurry or expired ID card."
                    className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs focus:outline-none focus:border-red-400 min-h-[60px]"
                  />
                </div>

                <div className="flex flex-wrap gap-2.5 justify-end">
                  <button 
                    onClick={() => setReviewUser(null)}
                    className="text-xs font-bold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 py-2 px-4 rounded-xl cursor-pointer"
                  >
                    Close Workspace
                  </button>
                  <button 
                    onClick={() => handleVerificationReview(reviewUser._id, 'Rejected')}
                    disabled={submittingReview}
                    className="text-xs font-bold bg-red-650 bg-red-600 hover:bg-red-700 text-white py-2 px-4.5 rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    Reject Credentials
                  </button>
                  <button 
                    onClick={() => handleVerificationReview(reviewUser._id, 'Verified')}
                    disabled={submittingReview}
                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-5 rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    Approve & Verify User
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
