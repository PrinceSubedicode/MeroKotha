import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, Phone, Bookmark, Calendar, Inbox, ClipboardList, ArrowRight, ExternalLink, RefreshCw, MessageSquare } from 'lucide-react';

export default function TenantDashboard() {
  const { user, favorites, toggleFavorite } = useAuth();
  
  const [inquiries, setInquiries] = useState([]);
  const [savedProperties, setSavedProperties] = useState([]);
  
  const [loadingInquiries, setLoadingInquiries] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  // Load tenant inquiries
  const fetchInquiries = async () => {
    setLoadingInquiries(true);
    try {
      const res = await api.get('/inquiries/tenant');
      setInquiries(res.data);
    } catch (err) {
      console.error('Failed fetching tenant inquiries:', err);
    } finally {
      setLoadingInquiries(false);
    }
  };

  // Load all properties to cross-reference saved bookmarks
  const fetchFavorites = async () => {
    setLoadingFavorites(true);
    try {
      const res = await api.get('/properties');
      // Filter by the tenant's global favorites list
      const filtered = res.data.filter(p => favorites.includes(p._id));
      setSavedProperties(filtered);
    } catch (err) {
      console.error('Failed loading favorited properties:', err);
    } finally {
      setLoadingFavorites(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInquiries();
    }
  }, [user]);

  useEffect(() => {
    if (user && favorites.length >= 0) {
      fetchFavorites();
    }
  }, [user, favorites]);

  // Toggle state of an inquiry (e.g. mark Resolved)
  const handleToggleStatus = async (inquiryId, newStatus) => {
    try {
      await api.put(`/inquiries/${inquiryId}/status`, { status: newStatus });
      fetchInquiries(); // Reload
    } catch (err) {
      console.error('Failed toggling inquiry state:', err);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Resolved') return 'bg-emerald-50 text-emerald-800 border-emerald-150';
    if (status === 'Contacted') return 'bg-indigo-50 text-indigo-800 border-indigo-150';
    return 'bg-amber-50 text-amber-800 border-amber-150';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1" id="tenant-dashboard-page">
      
      {/* Welcome header banner */}
      <section className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-md mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Katha Seekers Hub</h1>
          <p className="text-sm text-emerald-100/90 mt-1">
            Namaste, <strong className="text-white">{user?.name}</strong>! Review your rent applications, inspect chat leads, and check bookmarked rooms.
          </p>
        </div>
        <div className="flex gap-2">
          <Link 
            to="/properties" 
            className="rounded-xl bg-white text-emerald-950 px-4 py-2.5 text-xs font-extrabold shadow-sm hover:bg-emerald-50 transition-colors"
          >
            Find more rooms
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Double Column (My Submitted rent inquiries) */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                <Mail size={18} className="text-emerald-600" /> Outgoing Rent Inquiries
              </h2>
              <button 
                onClick={fetchInquiries}
                className="text-gray-400 hover:text-emerald-600 p-1 rounded-lg"
                title="Refresh listings"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {loadingInquiries ? (
              <div className="animate-pulse space-y-3">
                {[1, 2].map(n => <div key={n} className="bg-gray-50 h-24 rounded-xl"></div>)}
              </div>
            ) : inquiries.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-150 rounded-2xl bg-gray-50/50">
                <Inbox size={32} className="mx-auto text-gray-300 mb-3" />
                <h3 className="font-bold text-gray-800 text-sm">No inquiry pipelines initiated</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                  When you send inquiries to room owners on the Details page, they will appear here dynamically. No brokers!
                </p>
                <Link to="/properties" className="mt-4 inline-block text-xs font-bold text-white bg-emerald-600 px-4 p-2 rounded-lg">
                  Browse Rooms Now
                </Link>
              </div>
            ) : (
              <div className="space-y-4" id="tenant-inquiries-catalog">
                {inquiries.map((inq) => (
                  <article 
                    key={inq._id}
                    className="border border-gray-100 rounded-2xl p-5 hover:shadow-xs hover:border-gray-200 transition-all bg-white"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-50 pb-3 mb-3">
                      <div>
                        {/* Title of room list */}
                        <Link 
                          to={`/properties/${inq.propertyId}`}
                          className="font-bold text-gray-900 hover:text-emerald-600 flex items-center gap-1 text-sm transition-colors"
                        >
                          {inq.propertyTitle} <ExternalLink size={12} className="shrink-0 text-gray-405" />
                        </Link>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={11} /> Dispatched {new Date(inq.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Status indicator pill */}
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusColor(inq.status)}`}>
                        {inq.status}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Message body */}
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-[9px] mb-1 flex items-center gap-1">
                          <MessageSquare size={10} /> My message
                        </p>
                        <p className="text-xs text-gray-600 italic whitespace-pre-wrap">"{inq.message}"</p>
                      </div>

                      {/* Status modifiers by tenant */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-50">
                        <span className="text-[10px] text-gray-400 font-medium">Toggle Status:</span>
                        <div className="flex gap-2">
                          {inq.status !== 'Contacted' && (
                            <button
                              onClick={() => handleToggleStatus(inq._id, 'Contacted')}
                              className="text-[9px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-1.5 px-3 rounded-lg transition-all"
                            >
                              Sent Contact details
                            </button>
                          )}
                          {inq.status !== 'Resolved' && (
                            <button
                              onClick={() => handleToggleStatus(inq._id, 'Resolved')}
                              className="text-[9px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-1.5 px-3 rounded-lg transition-all"
                            >
                              Mark Rent Secured
                            </button>
                          )}
                          {inq.status !== 'Pending' && (
                            <button
                              onClick={() => handleToggleStatus(inq._id, 'Pending')}
                              className="text-[9px] font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 py-1.5 px-2.5 rounded-lg"
                            >
                              Set Open
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right Single Column (My Saved Bookmarks) */}
        <section className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-24">
            <h2 className="font-extrabold text-gray-900 text-lg flex items-center gap-2 mb-5">
              <Bookmark size={18} className="text-emerald-600" /> Bookmarked Rooms ({savedProperties.length})
            </h2>

            {loadingFavorites ? (
              <div className="animate-pulse space-y-3">
                {[1, 2].map(n => <div key={n} className="bg-gray-50 h-16 rounded-xl"></div>)}
              </div>
            ) : savedProperties.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-dashed border-gray-150 bg-gray-50/50">
                <Bookmark className="text-gray-300 mx-auto mb-2" size={24} />
                <p className="text-xs text-gray-500 font-bold">No saved rentals found</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Click the heart button on listing cards to bookmark here!</p>
              </div>
            ) : (
              <div className="space-y-3" id="tenant-saved-bookmarks">
                {savedProperties.map((prop) => (
                  <div 
                    key={prop._id} 
                    className="flex gap-3 p-2.5 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <img 
                      src={prop.images[0]} 
                      alt={prop.title} 
                      className="h-14 w-18 object-cover rounded-lg shrink-0 bg-gray-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="min-w-0">
                        <Link 
                          to={`/properties/${prop._id}`}
                          className="text-xs font-bold text-gray-900 hover:text-emerald-600 line-clamp-1 transition-colors"
                        >
                          {prop.title}
                        </Link>
                        <p className="text-[10px] text-gray-500 truncate">{prop.location}, {prop.city}</p>
                      </div>

                      <div className="flex items-center justify-between mt-1 text-[10px]">
                        <span className="font-bold text-emerald-600">Rs. {Number(prop.rent).toLocaleString()}/m</span>
                        <button 
                          onClick={() => toggleFavorite(prop._id)}
                          className="text-red-500 hover:underline font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>

    </div>
  );
}
