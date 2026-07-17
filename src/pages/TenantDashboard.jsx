import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, Phone, Bookmark, Calendar, Inbox, ClipboardList, ArrowRight, ExternalLink, RefreshCw, MessageSquare, Check, Bell, AlertCircle, CheckSquare, Sparkles } from 'lucide-react';

export default function TenantDashboard() {
  const { user, favorites, toggleFavorite } = useAuth();
  
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Continuous / N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Continuous / N/A' : d.toLocaleDateString();
  };
  
  const [inquiries, setInquiries] = useState([]);
  const [savedProperties, setSavedProperties] = useState([]);
  const [activeTab, setActiveTab] = useState('inquiries'); // 'inquiries' or 'bookings'
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loadingInquiries, setLoadingInquiries] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const [cancellationId, setCancellationId] = useState(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

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

  // Load tenant bookings
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await api.get('/bookings/tenant');
      setBookings(res.data);
    } catch (err) {
      console.error('Failed fetching tenant bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Load tenant notifications
  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed fetching notifications:', err);
    } finally {
      setLoadingNotifications(false);
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
      fetchBookings();
      fetchNotifications();
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

  const handleCancelBooking = async (bookingId) => {
    setSubmittingCancel(true);
    try {
      await api.put(`/bookings/${bookingId}/status`, {
        status: 'Cancelled',
        cancellationReason: cancelReasonInput || 'Tenant requested cancellation.'
      });
      setCancellationId(null);
      setCancelReasonInput('');
      fetchBookings();
      fetchNotifications();
    } catch (err) {
      console.error('Failed cancelling booking:', err);
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleMarkCompleted = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'Completed' });
      fetchBookings();
      fetchNotifications();
    } catch (err) {
      console.error('Failed completing booking:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Failed marking all read:', err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed marking notification read:', err);
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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">MeroKotha Seekers Hub</h1>
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
        
        {/* Left Double Column (My Submitted rent inquiries & bookings) */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            
            {/* Tab controls */}
            <div className="flex border-b border-gray-150 mb-6" id="tenant-tab-controls">
              <button
                onClick={() => setActiveTab('inquiries')}
                className={`py-3 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'inquiries' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                My Inquiries ({inquiries.length})
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-3 px-5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'bookings' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                My Bookings ({bookings.length})
              </button>
            </div>

            {/* TAB CONTENT: Inquiries */}
            {activeTab === 'inquiries' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                    <Mail size={16} className="text-emerald-600" /> Outgoing Rent Inquiries
                  </h2>
                  <button 
                    onClick={fetchInquiries}
                    className="text-gray-400 hover:text-emerald-600 p-1 rounded-lg cursor-pointer"
                    title="Refresh inquiries"
                  >
                    <RefreshCw size={13} />
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
                            <Link 
                              to={`/properties/${inq.propertyId}`}
                              className="font-bold text-gray-900 hover:text-emerald-600 flex items-center gap-1 text-sm transition-colors"
                            >
                              {inq.propertyTitle} <ExternalLink size={12} className="shrink-0 text-gray-405" />
                            </Link>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <Calendar size={11} /> Dispatched {formatDate(inq.createdAt)}
                            </p>
                          </div>

                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusColor(inq.status)}`}>
                            {inq.status}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div className="bg-gray-50 p-3 rounded-xl">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-[9px] mb-1 flex items-center gap-1">
                              <MessageSquare size={10} /> My message
                            </p>
                            <p className="text-xs text-gray-600 italic whitespace-pre-wrap">"{inq.message}"</p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-50">
                            <span className="text-[10px] text-gray-400 font-medium">Toggle Status:</span>
                            <div className="flex gap-2">
                              {inq.status !== 'Contacted' && (
                                <button
                                  onClick={() => handleToggleStatus(inq._id, 'Contacted')}
                                  className="text-[9px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 py-1.5 px-3 rounded-lg transition-all cursor-pointer"
                                >
                                  Sent Contact details
                                </button>
                              )}
                              {inq.status !== 'Resolved' && (
                                <button
                                  onClick={() => handleToggleStatus(inq._id, 'Resolved')}
                                  className="text-[9px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-1.5 px-3 rounded-lg transition-all cursor-pointer"
                                >
                                  Mark Rent Secured
                                </button>
                              )}
                              {inq.status !== 'Pending' && (
                                <button
                                  onClick={() => handleToggleStatus(inq._id, 'Pending')}
                                  className="text-[9px] font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 py-1.5 px-2.5 rounded-lg cursor-pointer"
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
              </>
            )}

            {/* TAB CONTENT: Bookings */}
            {activeTab === 'bookings' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                    <ClipboardList size={16} className="text-emerald-600" /> My Requested Bookings
                  </h2>
                  <button 
                    onClick={fetchBookings}
                    className="text-gray-400 hover:text-emerald-600 p-1 rounded-lg cursor-pointer"
                    title="Refresh bookings"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>

                {loadingBookings ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2].map(n => <div key={n} className="bg-gray-50 h-24 rounded-xl"></div>)}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-gray-150 rounded-2xl bg-gray-50/50">
                    <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
                    <h3 className="font-bold text-gray-800 text-sm">No bookings requested yet</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                      Secure room vacancies by hitting "Book Now" on property detail pages!
                    </p>
                    <Link to="/properties" className="mt-4 inline-block text-xs font-bold text-white bg-emerald-600 px-4 p-2 rounded-lg">
                      Browse Rooms Now
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4" id="tenant-bookings-catalog">
                    {bookings.map((b) => (
                      <article 
                        key={b._id}
                        className="border border-gray-100 rounded-2xl p-5 hover:shadow-xs hover:border-gray-200 transition-all bg-white"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-50 pb-3 mb-3">
                          <div className="flex items-center gap-3">
                            <img src={b.propertyImage} className="h-10 w-12 object-cover rounded-lg bg-gray-100 border shrink-0" referrerPolicy="no-referrer" />
                            <div>
                              <Link 
                                to={`/properties/${b.propertyId}`}
                                className="font-bold text-gray-900 hover:text-emerald-600 flex items-center gap-1 text-sm transition-colors"
                              >
                                {b.propertyTitle} <ExternalLink size={12} className="shrink-0 text-gray-405" />
                              </Link>
                              <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                <Calendar size={11} /> Placed on {formatDate(b.createdAt)}
                              </p>
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            b.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-150' :
                            b.status === 'Rejected' ? 'bg-red-50 text-red-800 border-red-150' :
                            b.status === 'Cancelled' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                            b.status === 'Completed' ? 'bg-indigo-50 text-indigo-800 border-indigo-150' :
                            'bg-amber-50 text-amber-800 border-amber-150'
                          }`}>
                            {b.status}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-gray-50 p-3 rounded-xl">
                            <div>
                              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Move-In Date</span>
                              <span className="font-semibold text-gray-800">{formatDate(b.moveInDate || b.checkInDate)}</span>
                            </div>
                            {b.checkOutDate && (
                              <div>
                                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Check-Out Date</span>
                                <span className="font-semibold text-gray-800">{formatDate(b.checkOutDate)}</span>
                              </div>
                            )}
                            <div>
                              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Occupants</span>
                              <span className="font-semibold text-gray-800">{b.occupants} Occupant(s)</span>
                            </div>
                          </div>

                          {b.message && (
                            <div className="bg-gray-50 p-3 rounded-xl text-xs">
                              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">My request message</span>
                              <p className="text-gray-600 italic">"{b.message}"</p>
                            </div>
                          )}

                          {b.status === 'Cancelled' && (
                            <div className="bg-red-50/50 border border-red-100 p-3 rounded-xl text-xs text-red-800">
                              <span className="block text-[9px] font-bold text-red-600 uppercase tracking-wider mb-0.5">Cancellation Details</span>
                              <p className="font-semibold text-gray-900">Cancelled by: {b.cancelledBy}</p>
                              <p className="italic mt-0.5">Reason: "{b.cancellationReason}"</p>
                            </div>
                          )}

                          {/* Action panel */}
                          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-50">
                            {(b.status === 'Pending' || b.status === 'Confirmed') && (
                              <button
                                onClick={() => setCancellationId(b._id)}
                                className="text-[10px] font-bold bg-red-50 hover:bg-red-100 text-red-700 py-1.5 px-3 rounded-lg cursor-pointer transition-colors"
                              >
                                Cancel Booking
                              </button>
                            )}
                            {b.status === 'Confirmed' && (
                              <button
                                onClick={() => handleMarkCompleted(b._id)}
                                className="text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-1.5 px-3 rounded-lg cursor-pointer transition-colors"
                              >
                                Mark Stay Completed
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Inline reason inputs */}
                        {cancellationId === b._id && (
                          <div className="mt-4 p-4 border border-red-150 bg-red-50/10 rounded-xl space-y-3">
                            <h4 className="text-xs font-black text-red-950 flex items-center gap-1">
                              <AlertCircle size={14} className="text-red-600" /> Cancel Booking Reservation
                            </h4>
                            <p className="text-[11px] text-gray-500">Please provide a brief reason for cancelling this booking.</p>
                            <input
                              type="text"
                              value={cancelReasonInput}
                              onChange={(e) => setCancelReasonInput(e.target.value)}
                              placeholder="Write cancellation reason..."
                              className="w-full text-xs p-2.5 rounded-lg border border-red-200 focus:outline-none focus:border-red-500 bg-white"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => { setCancellationId(null); setCancelReasonInput(''); }}
                                className="text-[10px] font-bold text-gray-500 hover:text-gray-700 py-1 px-2 cursor-pointer"
                              >
                                Close
                              </button>
                              <button
                                disabled={submittingCancel}
                                onClick={() => handleCancelBooking(b._id)}
                                className="text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-lg cursor-pointer disabled:opacity-50"
                              >
                                {submittingCancel ? 'Cancelling...' : 'Cancel Booking Now'}
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Right Single Column (Alert Center & Saved Bookmarks) */}
        <section className="lg:col-span-1 space-y-6">
          
          {/* Real-time Activity Alerts Desk */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <Bell size={16} className="text-emerald-600" /> Activity Alerts 
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </h2>
              {notifications.some(n => !n.isRead) && (
                <button 
                  onClick={handleMarkAllRead}
                  className="text-[9px] font-black text-emerald-600 hover:underline cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>

            {loadingNotifications ? (
              <div className="space-y-2">
                <div className="h-10 bg-gray-50 rounded-lg animate-pulse"></div>
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic text-center py-4">No recent activity alerts.</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1" id="tenant-notifications">
                {notifications.map((n) => (
                  <div 
                    key={n._id}
                    className={`p-2.5 rounded-xl text-[11px] border transition-all ${
                      n.isRead ? 'bg-white border-gray-50 text-gray-405' : 'bg-emerald-50/20 border-emerald-100 text-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-bold text-[11px] text-gray-900 leading-tight">{n.title}</span>
                      {!n.isRead && (
                        <button 
                          onClick={() => handleMarkRead(n._id)}
                          className="text-emerald-600 hover:text-emerald-800 shrink-0 cursor-pointer"
                          title="Mark read"
                        >
                          <Check size={11} />
                        </button>
                      )}
                    </div>
                    <p className="mt-0.5 leading-relaxed text-gray-600">{n.message}</p>
                    <span className="text-[9px] text-gray-400 block mt-1">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bookmarked listings */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-extrabold text-gray-900 text-sm flex items-center gap-2 mb-5">
              <Bookmark size={16} className="text-emerald-600" /> Bookmarked Rooms ({savedProperties.length})
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
                          className="text-red-500 hover:underline font-semibold cursor-pointer"
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
