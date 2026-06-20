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
                      <th className="py-3 px-4 text-center">Status</th>
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
                            'bg-indigo-50 text-indigo-805 text-indigo-700'
                          }`}>
                            {item.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.role === 'Property Owner' ? (
                            <button
                              onClick={() => handleToggleUserVerification(item._id)}
                              className={`rounded-lg py-1 px-2.5 text-[10px] font-bold transition-all shadow-2xs border ${
                                item.isVerified 
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100' 
                                  : 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100'
                              }`}
                            >
                              {item.isVerified ? '✓ Verified Owner' : 'Verify Owner'}
                            </button>
                          ) : (
                            <span className="text-gray-400 text-[10px]">Autopass</span>
                          )}
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

    </div>
  );
}
