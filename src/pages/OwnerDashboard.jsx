import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { NEPAL_GEOGRAPHY, GENERAL_FACILITIES, PROPERTY_TYPES } from '../utils/nepalLocations.js';
import { PlusCircle, ClipboardList, Home, Mail, Phone, Edit, Trash2, CheckCircle2, AlertTriangle, RefreshCw, X, Image as ImageIcon, Send, MapPin, Map as MapIcon, Bell, Check } from 'lucide-react';
import MapIntegrationWrapper from '../components/MapIntegrationWrapper.jsx';
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

export default function OwnerDashboard() {
  const { user } = useAuth();

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Continuous / N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Continuous / N/A' : d.toLocaleDateString();
  };

  const handleUpdatePropertyStatus = async (propertyId, newStatus) => {
    try {
      await api.put(`/properties/${propertyId}/status`, { status: newStatus });
      loadListings();
      loadBookings();
    } catch (err) {
      console.error('Failed to update property status:', err);
      alert(err.response?.data?.message || 'Failed to update property status.');
    }
  };

  // Active Screen view: 'listings', 'add', 'edit', 'inquiries'
  const [activeTab, setActiveTab] = useState('listings');

  // Owner state data
  const [listings, setListings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingInquiries, setLoadingInquiries] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  // Booking & Alert action managers
  const [rejectionId, setRejectionId] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Form Field State managers (Shared for Create / Edit)
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formRent, setFormRent] = useState('');
  const [formType, setFormType] = useState('Room');
  const [formProvince, setFormProvince] = useState('');
  const [formDistrict, setFormDistrict] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formBedrooms, setFormBedrooms] = useState('1');
  const [formBathrooms, setFormBathrooms] = useState('1');
  const [formFacilities, setFormFacilities] = useState([]);
  const [formImagesBase64, setFormImagesBase64] = useState([]); // Array of base64 image keys
  const [formLat, setFormLat] = useState('');
  const [formLng, setFormLng] = useState('');
  const [showFormMap, setShowFormMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 27.7172, lng: 85.3240 });

  // Auto-geocode client-side when geographic selections update
  useEffect(() => {
    if (formProvince || formDistrict || formCity || formLocation) {
      const searchTerms = [
        formLocation || '',
        formCity || '',
        formDistrict || '',
        formProvince || ''
      ];

      const lookup = {
        'jhamsikhel': { lat: 27.6787, lng: 85.3094 },
        'koteshwor': { lat: 27.6749, lng: 85.3486 },
        'lakeside': { lat: 28.2104, lng: 83.9575 },
        'milanchowk': { lat: 27.6976, lng: 83.4542 },
        'durbar area': { lat: 27.6722, lng: 85.4278 },
        'kathmandu': { lat: 27.7172, lng: 85.3240 },
        'lalitpur': { lat: 27.6710, lng: 85.3240 },
        'bhaktapur': { lat: 27.6722, lng: 85.4278 },
        'pokhara': { lat: 28.2096, lng: 83.9856 },
        'butwal': { lat: 27.6876, lng: 83.4486 },
        'dharan': { lat: 26.8125, lng: 87.2835 },
        'biratnagar': { lat: 26.4525, lng: 87.2718 },
        'nepalgunj': { lat: 28.0500, lng: 81.6167 },
        'chitwan': { lat: 27.6833, lng: 84.4333 },
        'bharatpur': { lat: 27.6833, lng: 84.4333 },
        'kaski': { lat: 28.2096, lng: 83.9856 },
        'rupandehi': { lat: 27.6876, lng: 83.4486 },
        'sunsari': { lat: 26.8125, lng: 87.2835 },
        'morang': { lat: 26.4525, lng: 87.2718 },
        'hetauda': { lat: 27.4262, lng: 85.0322 },
        'janakpur': { lat: 26.7275, lng: 85.9225 },
        'birgunj': { lat: 27.0131, lng: 84.8725 },
        'birendranagar': { lat: 28.5912, lng: 81.6247 },
        'surkhet': { lat: 28.5912, lng: 81.6247 },
        'dhangadhi': { lat: 28.6853, lng: 80.6214 },
        'mahendranagar': { lat: 28.9667, lng: 80.1833 },
        'itahari': { lat: 26.6650, lng: 87.2740 },
        'damak': { lat: 26.6667, lng: 87.6833 },
        'birtamode': { lat: 26.6333, lng: 87.9833 },
        'bagmati province': { lat: 27.7172, lng: 85.3240 },
        'gandaki province': { lat: 28.2096, lng: 83.9856 },
        'lumbini province': { lat: 27.6876, lng: 83.4486 },
        'koshi province': { lat: 26.4525, lng: 87.2718 },
        'madhesh province': { lat: 26.7275, lng: 85.9225 },
        'karnali province': { lat: 28.5912, lng: 81.6247 },
        'sudurpashchim province': { lat: 28.6853, lng: 80.6214 }
      };

      let match = null;
      for (const term of searchTerms) {
        if (!term) continue;
        const cleanTerm = term.toLowerCase().trim();
        for (const key of Object.keys(lookup)) {
          if (cleanTerm.includes(key) || key.includes(cleanTerm)) {
            match = lookup[key];
            break;
          }
        }
        if (match) break;
      }

      if (match) {
        setFormLat(String(match.lat));
        setFormLng(String(match.lng));
        setMapCenter({ lat: match.lat, lng: match.lng });
      }
    }
  }, [formProvince, formDistrict, formCity, formLocation]);
  
  // Edit listing identifier
  const [editingId, setEditingId] = useState(null);

  // Status Alerts
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState(null);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Fetch owner custom listings
  const loadListings = async () => {
    setLoadingListings(true);
    try {
      const res = await api.get('/properties/my-listings');
      setListings(res.data);
    } catch (err) {
      console.error('Failed fetching listings:', err);
    } finally {
      setLoadingListings(false);
    }
  };

  // Fetch incoming tenant requests
  const loadInquiries = async () => {
    setLoadingInquiries(true);
    try {
      const res = await api.get('/inquiries/owner');
      setInquiries(res.data);
    } catch (err) {
      console.error('Failed fetching owner inquiries:', err);
    } finally {
      setLoadingInquiries(false);
    }
  };

  // Fetch incoming bookings
  const loadBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await api.get('/bookings/owner');
      setBookings(res.data);
    } catch (err) {
      console.error('Failed fetching owner bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch owner activity alerts
  const loadNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed fetching owner notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadListings();
      loadInquiries();
      loadBookings();
      loadNotifications();
    }
  }, [user]);

  const handleAcceptBooking = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'Confirmed' });
      loadBookings();
      loadListings();
      loadNotifications();
    } catch (err) {
      console.error('Failed to accept booking:', err);
      alert(err.response?.data?.message || 'Failed to accept booking.');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    setSubmittingAction(true);
    try {
      await api.put(`/bookings/${bookingId}/status`, { 
        status: 'Rejected',
        rejectionReason: rejectReasonInput || 'Owner rejected the booking request.'
      });
      setRejectionId(null);
      setRejectReasonInput('');
      loadBookings();
      loadListings();
      loadNotifications();
    } catch (err) {
      console.error('Failed to reject booking:', err);
      alert(err.response?.data?.message || 'Failed to reject booking.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCancelBookingByOwner = async (bookingId) => {
    setSubmittingAction(true);
    try {
      await api.put(`/bookings/${bookingId}/status`, { 
        status: 'Cancelled',
        cancellationReason: cancelReasonInput || 'Owner cancelled this booking.'
      });
      setCancellingId(null);
      setCancelReasonInput('');
      loadBookings();
      loadListings();
      loadNotifications();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleMarkBookingCompleted = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'Completed' });
      loadBookings();
      loadListings();
      loadNotifications();
    } catch (err) {
      console.error('Failed to complete booking:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  // Clean form input states
  const resetForm = () => {
    setFormTitle('');
    setFormDesc('');
    setFormRent('');
    setFormType('Room');
    setFormProvince('');
    setFormDistrict('');
    setFormCity('');
    setFormLocation('');
    setFormBedrooms('1');
    setFormBathrooms('1');
    setFormFacilities([]);
    setFormImagesBase64([]);
    setFormLat('');
    setFormLng('');
    setShowFormMap(false);
    setMapCenter({ lat: 27.7172, lng: 85.3240 });
    setEditingId(null);
    setFormSuccess(null);
    setFormError(null);
  };

  // Trigger editing modes
  const handleStartEdit = (prop) => {
    resetForm();
    setEditingId(prop._id);
    setFormTitle(prop.title || '');
    setFormDesc(prop.description || '');
    setFormRent(prop.rent || '');
    setFormType(prop.propertyType || 'Room');
    setFormProvince(prop.province || '');
    setFormDistrict(prop.district || '');
    setFormCity(prop.city || '');
    setFormLocation(prop.location || '');
    setFormBedrooms(String(prop.bedrooms || '1'));
    setFormBathrooms(String(prop.bathrooms || '1'));
    setFormFacilities(prop.facilities || []);
    // Seed initial server images to prevent overwriting
    setFormImagesBase64(prop.images || []);
    setFormLat(prop.lat ? String(prop.lat) : '');
    setFormLng(prop.lng ? String(prop.lng) : '');
    if (prop.lat && prop.lng) {
      setMapCenter({ lat: Number(prop.lat), lng: Number(prop.lng) });
    }
    setShowFormMap(false);
    setActiveTab('edit');
  };

  // Handle Photo selection from machine
  const handlePhotoUploadSelected = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Append base64 encoded stream to state
        setFormImagesBase64(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove pending file selection
  const handleRemoveSelectedImage = (index) => {
    setFormImagesBase64(prev => prev.filter((_, idx) => idx !== index));
  };

  // Toggle dynamic amenity selectors
  const handleFacilityCheckmarkToggle = (facility) => {
    if (formFacilities.includes(facility)) {
      setFormFacilities(prev => prev.filter(f => f !== facility));
    } else {
      setFormFacilities(prev => [...prev, facility]);
    }
  };

  // Submit Listing creation or modifications
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmittingForm(true);
    setFormSuccess(null);
    setFormError(null);

    // Validate that the selected municipality belongs to the selected district before saving
    if (formProvince && formDistrict && formCity) {
      const allowedCities = NEPAL_GEOGRAPHY[formProvince]?.municipalities?.[formDistrict] || [];
      if (!allowedCities.includes(formCity)) {
        setFormError(`Selected municipality "${formCity}" does not belong to district "${formDistrict}".`);
        setSubmittingForm(false);
        return;
      }
    }

    // Validate coordinates
    if (!formLat || !formLng || isNaN(Number(formLat)) || isNaN(Number(formLng))) {
      setFormError('Latitude and Longitude are required. Please select a location on the interactive map or verify your coordinates.');
      setSubmittingForm(false);
      return;
    }

    // Form payload construction
    const payload = {
      title: formTitle,
      description: formDesc,
      rent: Number(formRent),
      propertyType: formType,
      province: formProvince,
      district: formDistrict,
      city: formCity,
      location: formLocation,
      bedrooms: Number(formBedrooms),
      bathrooms: Number(formBathrooms),
      facilities: formFacilities,
      images: formImagesBase64,
      lat: formLat ? Number(formLat) : null,
      lng: formLng ? Number(formLng) : null
    };

    try {
      if (activeTab === 'edit' && editingId) {
        const res = await api.put(`/properties/${editingId}`, payload);
        setFormSuccess(res.data.message);
        setTimeout(() => {
          resetForm();
          loadListings();
          setActiveTab('listings');
        }, 1500);
      } else {
        const res = await api.post('/properties', payload);
        setFormSuccess(res.data.message);
        setTimeout(() => {
          resetForm();
          loadListings();
          setActiveTab('listings');
        }, 1500);
      }
    } catch (err) {
      console.error('Form submission failure:', err);
      setFormError(err.response?.data?.message || 'Transaction could not complete. Try again.');
    } finally {
      setSubmittingForm(false);
    }
  };

  // Delete listing permanently
  const executeDeleteListing = async (propertyId) => {
    try {
      await api.delete(`/properties/${propertyId}`);
      loadListings();
      loadInquiries();
    } catch (err) {
      console.error('Property deletion failing:', err);
      setFormError('Unable to delete property ad. Try again.');
    }
  };

  // Update status of individual incoming rent lead
  const handleUpdateInquiryStatus = async (inquiryId, newStatus) => {
    try {
      await api.put(`/inquiries/${inquiryId}/status`, { status: newStatus });
      loadInquiries();
    } catch (err) {
      console.error('Failed toggling inquiry status:', err);
      alert('Inquiry state update stalled.');
    }
  };

  // Helper lists districts and cities based on province chosen
  const currentProvinceData = formProvince ? NEPAL_GEOGRAPHY[formProvince] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1" id="owner-dashboard-root">
      
      {/* Title Segment */}
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Kotha Landlord Portal</h1>
      <p className="text-sm text-gray-500 mt-1">
        Welcome Ramesh Adhikari! Complete listings, evaluate lead notifications, and interact with tenants in Nepal.
      </p>

      {/* Dashboard Custom Tab Controls */}
      <div className="flex flex-wrap border-b border-gray-150 mt-8 mb-8" id="owner-tabs-container">
        <button
          onClick={() => { setActiveTab('listings'); resetForm(); }}
          className={`py-3 px-5 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'listings' ? 'border-emerald-600 text-emerald-700 font-extrabold' : 'border-transparent text-gray-500 hover:text-emerald-600'
          }`}
        >
          <Home size={16} /> My Properties ({listings.length})
        </button>

        <button
          onClick={() => { resetForm(); setActiveTab('add'); }}
          className={`py-3 px-5 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'add' ? 'border-emerald-600 text-emerald-700 font-extrabold' : 'border-transparent text-gray-500 hover:text-emerald-600'
          }`}
          id="owner-add-listing-tab"
        >
          <PlusCircle size={16} /> Add New Rental
        </button>

        <button
          onClick={() => { setActiveTab('inquiries'); resetForm(); }}
          className={`py-3 px-5 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'inquiries' ? 'border-emerald-600 text-emerald-700 font-extrabold' : 'border-transparent text-gray-500 hover:text-emerald-600'
          }`}
        >
          <Mail size={16} /> Tenant Inquiries ({inquiries.length})
        </button>

        <button
          onClick={() => { setActiveTab('bookings'); resetForm(); }}
          className={`py-3 px-5 text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'bookings' ? 'border-emerald-600 text-emerald-700 font-extrabold' : 'border-transparent text-gray-500 hover:text-emerald-600'
          }`}
        >
          <ClipboardList size={16} /> Booking Reservations ({bookings.length})
        </button>
      </div>

      {/* VIEW: Listings Directory table */}
      {activeTab === 'listings' && (
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-extrabold text-gray-800 text-base">My Registered Rooms & Flats</h2>
            <button onClick={loadListings} className="text-gray-400 hover:text-emerald-600">
              <RefreshCw size={14} className="animate-spin" style={{ animationDuration: '4s' }} />
            </button>
          </div>

          {loadingListings ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map(n => <div key={n} className="bg-gray-50 h-[80px] rounded-xl"></div>)}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-150 rounded-2xl bg-gray-50/55">
              <Home size={36} className="mx-auto text-gray-300 mb-3" />
              <h3 className="font-bold text-gray-800 text-sm">No vacancies listed yet</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                List single student rooms, family flats, or houses. Provide detailed facilities checklists to attract tenants instantly!
              </p>
              <button 
                onClick={() => setActiveTab('add')}
                className="mt-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-700/10"
              >
                Create First ad listing
              </button>
            </div>
          ) : (
            <div className="space-y-4" id="owner-listings-checklist">
              {listings.map((prop) => (
                <article 
                  key={prop._id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-gray-50 rounded-2xl hover:bg-gray-50/60 transition-all bg-white justify-between"
                >
                  <div className="flex gap-4">
                    <img 
                      src={prop.images[0]} 
                      alt={prop.title} 
                      className="h-16 w-20 object-cover rounded-xl shrink-0 bg-gray-150 border border-gray-100"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{prop.title}</h3>
                      <p className="text-xs text-gray-550 mt-1 text-gray-500">{prop.location}, {prop.city} &bull; <strong className="text-emerald-600">Rs. {Number(prop.rent).toLocaleString()}/m</strong></p>
                      
                      {/* State badge */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {prop.status === 'Approved' ? (
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-0.5" title="Available for rent and visible on search & homepage">
                            <CheckCircle2 size={11} className="text-emerald-600" /> Available
                          </span>
                        ) : prop.status === 'Occupied' ? (
                          <span className="text-[9px] font-bold text-indigo-800 bg-indigo-100/70 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-0.5" title="Currently occupied by a tenant">
                            <Check size={11} className="text-indigo-600" /> Occupied
                          </span>
                        ) : prop.status === 'Hidden' ? (
                          <span className="text-[9px] font-bold text-gray-850 bg-gray-100 border border-gray-250 px-2 py-0.5 rounded-md flex items-center gap-0.5 text-gray-700" title="Hidden manually by you from public listings">
                            <X size={11} className="text-gray-500" /> Hidden
                          </span>
                        ) : prop.status === 'Archived' ? (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-0.5" title="Archived manually by you. Booking history is preserved">
                            <AlertTriangle size={11} className="text-amber-500" /> Archived
                          </span>
                        ) : prop.status === 'Rejected' ? (
                          <span className="text-[9px] font-bold text-red-800 bg-red-50 border border-red-150 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                            <AlertTriangle size={11} className="text-red-500" /> Rejected ad
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-150 px-2 py-0.5 rounded-md">
                            Pending Manual approval
                          </span>
                        )}
                        <span className="text-[9px] font-semibold text-gray-400">({prop.bedrooms} BHK / {prop.propertyType})</span>
                      </div>

                      {/* Occupant Detail block if Occupied */}
                      {prop.status === 'Occupied' && (() => {
                        const activeBooking = bookings.find(b => b.propertyId === prop._id && (b.status === 'Confirmed' || b.status === 'Completed'));
                        if (!activeBooking) return null;
                        return (
                          <div className="mt-2.5 p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 text-xs text-indigo-950 space-y-1 max-w-md">
                            <p className="font-bold text-[9px] text-indigo-800 uppercase tracking-wider mb-1">Active Tenant & Stay Details</p>
                            <p><strong>Tenant Name:</strong> {activeBooking.tenantName}</p>
                            <p><strong>Contact:</strong> {activeBooking.tenantPhone} &bull; {activeBooking.tenantEmail}</p>
                            <p><strong>Booking Placed On:</strong> {formatDate(activeBooking.createdAt)}</p>
                            <p><strong>Move-In Date:</strong> {formatDate(activeBooking.moveInDate || activeBooking.checkInDate)}</p>
                            <p><strong>Check-Out Date:</strong> {activeBooking.checkOutDate ? formatDate(activeBooking.checkOutDate) : 'Continuous Stay'}</p>
                            <p className="flex items-center gap-1">
                              <strong>Booking Status:</strong> 
                              <span className="bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase">{activeBooking.status}</span>
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-col sm:items-end gap-2 sm:self-center border-t border-gray-50 sm:border-0 pt-3 sm:pt-0 w-full sm:w-auto">
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      <button
                        onClick={() => handleStartEdit(prop)}
                        className="flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-emerald-700 py-1.5 px-3 rounded-lg border border-gray-100 shadow-xs cursor-pointer"
                      >
                        <Edit size={12} /> Edit
                      </button>

                      {prop.status === 'Approved' && (
                        <>
                          <button
                            onClick={() => handleUpdatePropertyStatus(prop._id, 'Hidden')}
                            className="text-[11px] font-bold text-gray-600 bg-gray-50 hover:bg-gray-150 py-1.5 px-2.5 rounded-lg border border-gray-200 cursor-pointer"
                            title="Temporarily hide listing from public search and homepage"
                          >
                            Hide Listing
                          </button>
                          <button
                            onClick={() => handleUpdatePropertyStatus(prop._id, 'Archived')}
                            className="text-[11px] font-bold text-gray-600 bg-gray-50 hover:bg-gray-150 py-1.5 px-2.5 rounded-lg border border-gray-200 cursor-pointer"
                            title="Remove from public search but keep history"
                          >
                            Archive
                          </button>
                        </>
                      )}

                      {(prop.status === 'Hidden' || prop.status === 'Archived') && (
                        <button
                          onClick={() => handleUpdatePropertyStatus(prop._id, 'Approved')}
                          className="text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 py-1.5 px-2.5 rounded-lg cursor-pointer shadow-xs"
                        >
                          Mark as Available
                        </button>
                      )}

                      {prop.status === 'Occupied' && (
                        <button
                          onClick={() => {
                            // Find active booking to mark as completed
                            const activeBooking = bookings.find(b => b.propertyId === prop._id && b.status === 'Confirmed');
                            if (activeBooking) {
                              handleMarkBookingCompleted(activeBooking._id);
                            } else {
                              // If no active booking found, reset property status to approved
                              handleUpdatePropertyStatus(prop._id, 'Approved');
                            }
                          }}
                          className="text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-1.5 px-2.5 rounded-lg cursor-pointer shadow-xs"
                        >
                          Tenant Checked Out
                        </button>
                      )}

                      <button
                        onClick={() => {
                          const hasActiveBookings = bookings.some(b => b.propertyId === prop._id && (b.status === 'Confirmed' || b.status === 'Pending'));
                          if (hasActiveBookings) {
                            alert('Cannot delete property listing with active or pending bookings.');
                          } else {
                            setDeleteConfirmId(prop._id);
                          }
                        }}
                        className={`flex items-center gap-1 text-[11px] font-bold py-1.5 px-3 rounded-lg border cursor-pointer ${
                          bookings.some(b => b.propertyId === prop._id && (b.status === 'Confirmed' || b.status === 'Pending'))
                            ? 'text-gray-300 bg-gray-50 border-gray-150 cursor-not-allowed'
                            : 'text-red-600 bg-red-50 hover:bg-red-100 border-red-100'
                        }`}
                        title={bookings.some(b => b.propertyId === prop._id && (b.status === 'Confirmed' || b.status === 'Pending')) ? "Active bookings prevent deletion" : "Delete Listing"}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* VIEW: Create / Redact listing */}
      {(activeTab === 'add' || activeTab === 'edit') && (
        <section className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
            <h2 className="font-extrabold text-gray-900 text-lg">
              {activeTab === 'edit' ? `Modify Vacancy Details: "${formTitle}"` : 'Submit New Property Vacancy'}
            </h2>
            <button 
              onClick={() => { resetForm(); setActiveTab('listings'); }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Success Banner */}
          {formSuccess && (
            <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 p-4 rounded-xl text-xs font-bold mb-6 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {formError && (
            <div className="bg-red-50 border border-red-150 text-red-800 p-4 rounded-xl text-xs font-bold mb-6 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-6" id="vacancy-creation-form">
            
            {/* Row 1: Title & Rent */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Property Listing Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Spacious 2 BHK Flat with garden near Lakeside"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3.5 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                  id="form-title-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 font-sans">Monthly Rent Cost (NPR)</label>
                <input 
                  type="number"
                  required
                  placeholder="e.g. 15000"
                  value={formRent}
                  onChange={(e) => setFormRent(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3.5 text-xs font-bold focus:border-emerald-500 focus:bg-white focus:outline-none"
                  id="form-rent-input"
                />
              </div>
            </div>

            {/* Row 2: Asset Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Property Category</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold focus:border-emerald-500 focus:bg-white"
                  id="form-type-select"
                >
                  {PROPERTY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Bedroom requirements</label>
                <select
                  value={formBedrooms}
                  onChange={(e) => setFormBedrooms(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold"
                >
                  <option value="1">1 Bedroom / Studio</option>
                  <option value="2">2 BHK (Double Bedrooms)</option>
                  <option value="3">3 BHK (Triple Bedrooms)</option>
                  <option value="4">4+ Bedrooms (Villas)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 font-sans">Attached Bathrooms</label>
                <select
                  value={formBathrooms}
                  onChange={(e) => setFormBathrooms(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold"
                >
                  <option value="1">1 Bathroom</option>
                  <option value="2">2 Bathrooms</option>
                  <option value="3">3 Bathrooms</option>
                </select>
              </div>
            </div>

            {/* Row 3: Physical Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Detailed Room Description</label>
              <textarea
                required
                rows={4}
                placeholder="Include drinking water status, solar water heater access, school distances, curfew lists, specific parking spaces, and contact info rules..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs font-medium focus:border-emerald-500 focus:bg-white focus:outline-none"
                id="form-description-textarea"
              />
            </div>

            {/* Row 4: Nepal Administrative Locations Select Range */}
            <div className="bg-emerald-50/50 rounded-2xl border border-emerald-500/10 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-4 flex items-center gap-1">
                <Home size={14} /> Location specifications (Nepal geography details)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                
                {/* Provinces selector */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">State Province</label>
                  <select 
                    value={formProvince}
                    onChange={(e) => {
                      setFormProvince(e.target.value);
                      setFormDistrict('');
                      setFormCity('');
                    }}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-semibold focus:border-emerald-500"
                    id="form-province-select"
                  >
                    <option value="">Choose Province</option>
                    {Object.keys(NEPAL_GEOGRAPHY).map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                {/* District selector */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">District Selector</label>
                  <select 
                    value={formDistrict}
                    onChange={(e) => {
                      setFormDistrict(e.target.value);
                      setFormCity('');
                    }}
                    disabled={!formProvince}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-semibold disabled:bg-gray-100"
                    id="form-district-select"
                  >
                    <option value="">Select District</option>
                    {formProvince && NEPAL_GEOGRAPHY[formProvince].districts.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                {/* Municipality/City Selector */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Municipality/City</label>
                  <select 
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    disabled={!formProvince || !formDistrict}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-semibold disabled:bg-gray-100"
                    id="form-city-select"
                  >
                    <option value="">Select City</option>
                    {formProvince && formDistrict && NEPAL_GEOGRAPHY[formProvince].municipalities?.[formDistrict]?.map(ct => (
                      <option key={ct} value={ct}>{ct}</option>
                    ))}
                  </select>
                </div>

                {/* Ward Area Tole */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Local Area (Tole/Ward)</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Baneshwor Height-10"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 px-3 text-xs font-semibold focus:border-emerald-500"
                    id="form-location-input"
                  />
                </div>

              </div>

              {/* Map Coordinates Integration */}
              <div className="mt-6 pt-6 border-t border-emerald-500/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0d233e]">Map Coordinates (Pinpoint)</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">Pins will display on our interactive marketplace map for tenants.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextShow = !showFormMap;
                      setShowFormMap(nextShow);
                      if (nextShow && !formLat && !formLng) {
                        if (formCity === 'Kathmandu' || formDistrict === 'Kathmandu') {
                          setFormLat('27.7172');
                          setFormLng('85.3240');
                        } else if (formCity === 'Lalitpur' || formDistrict === 'Lalitpur') {
                          setFormLat('27.6787');
                          setFormLng('85.3094');
                        } else if (formCity === 'Pokhara' || formDistrict === 'Kaski') {
                          setFormLat('28.2104');
                          setFormLng('83.9575');
                        } else {
                          setFormLat('27.7172');
                          setFormLng('85.3240');
                        }
                      }
                    }}
                    className="self-start sm:self-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <MapIcon size={14} /> {showFormMap ? 'Hide Pinpicker Map' : 'Select Pin on Interactive Map'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Latitude</label>
                    <input 
                      type="number"
                      step="any"
                      placeholder="e.g. 27.7172"
                      value={formLat}
                      onChange={(e) => setFormLat(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2 px-3 text-xs font-semibold focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Longitude</label>
                    <input 
                      type="number"
                      step="any"
                      placeholder="e.g. 85.3240"
                      value={formLng}
                      onChange={(e) => setFormLng(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2 px-3 text-xs font-semibold focus:border-emerald-500"
                    />
                  </div>
                </div>

                {showFormMap && (
                  <div className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-xs">
                    <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 flex items-center justify-between text-[11px] text-gray-500">
                      <span className="font-bold flex items-center gap-1"><MapPin size={12} className="text-emerald-600" /> Draggable Location Marker</span>
                      <span>Tip: Click on the map or drag the green marker to position your listing.</span>
                    </div>
                    <div className="h-64 w-full relative">
                      <MapIntegrationWrapper fallbackHeight="256px">
                        <Map
                          center={mapCenter}
                          onCameraChanged={(e) => {
                            setMapCenter(e.detail.center);
                          }}
                          defaultZoom={13}
                          mapId="OWNER_DASHBOARD_PICKER_MAP"
                          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                          style={{ width: '100%', height: '100%' }}
                          gestureHandling="cooperative"
                          onClick={(e) => {
                            if (e.detail.latLng) {
                              const newLat = e.detail.latLng.lat.toFixed(6);
                              const newLng = e.detail.latLng.lng.toFixed(6);
                              setFormLat(String(newLat));
                              setFormLng(String(newLng));
                              setMapCenter({ lat: Number(newLat), lng: Number(newLng) });
                            }
                          }}
                        >
                          <AdvancedMarker
                            position={{ lat: Number(formLat) || 27.7172, lng: Number(formLng) || 85.3240 }}
                            draggable={true}
                            onDragEnd={(e) => {
                              if (e.latLng) {
                                const newLat = e.latLng.lat().toFixed(6);
                                const newLng = e.latLng.lng().toFixed(6);
                                setFormLat(String(newLat));
                                setFormLng(String(newLng));
                                setMapCenter({ lat: Number(newLat), lng: Number(newLng) });
                              }
                            }}
                          >
                            <Pin background="#059669" glyphColor="#ffffff" borderColor="#ffffff" />
                          </AdvancedMarker>
                        </Map>
                      </MapIntegrationWrapper>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Row 5: Amenities tags Checkboxes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Facility & Amenity checklists</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 border border-gray-150 rounded-2xl h-44 overflow-y-auto">
                {GENERAL_FACILITIES.map(facility => {
                  const check = formFacilities.includes(facility);
                  return (
                    <label key={facility} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer py-1 group">
                      <input 
                        type="checkbox"
                        checked={check}
                        onChange={() => handleFacilityCheckmarkToggle(facility)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0"
                      />
                      <span className="group-hover:text-emerald-700 font-semibold truncate">{facility}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Row 6: Image Selection Media boxes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-550 mb-2 text-gray-500">Property Photos Showcase</label>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-center">
                
                {/* Upload Button */}
                <label className="flex flex-col items-center justify-center p-4 h-24 border-2 border-dashed border-gray-200 hover:border-emerald-500 bg-gray-55/40 hover:bg-emerald-50/20 rounded-2xl cursor-pointer text-center group transition-all">
                  <ImageIcon size={22} className="text-gray-400 group-hover:text-emerald-600 shrink-0" />
                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-emerald-700 mt-1">Select Files</span>
                  <input 
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUploadSelected}
                    className="hidden"
                    id="property-image-selector"
                  />
                </label>

                {/* Chosen Images Gallery Thumbnail */}
                {formImagesBase64.map((imgBase, idz) => (
                  <div key={idz} className="relative h-24 rounded-2xl overflow-hidden border border-gray-100 bg-gray-100 group shadow-xs">
                    <img src={imgBase} alt="Thumbnail view" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveSelectedImage(idz)}
                      className="absolute top-1.5 right-1.5 bg-red-650/80 hover:bg-red-700 text-white rounded-full p-1 shadow-md bg-red-600 hover:scale-105"
                    >
                      <X size={12} className="stroke-[2.5]" />
                    </button>
                  </div>
                ))}

              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 justify-end border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={() => { resetForm(); setActiveTab('listings'); }}
                className="rounded-xl border border-gray-205 text-gray-600 hover:bg-gray-105 font-bold py-3 px-6 text-xs transition-colors border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={submittingForm}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold py-3 px-8 text-xs text-white shadow-md shadow-emerald-700/10 transition-colors disabled:opacity-50"
              >
                {activeTab === 'edit'
                  ? (submittingForm ? 'Saving Updates...' : 'Publish Update')
                  : (submittingForm ? 'Submitting Ad...' : 'Submit Vacancy for approval')
                }
              </button>
            </div>

          </form>
        </section>
      )}

      {/* VIEW: Incoming Inquiries lead records */}
      {activeTab === 'inquiries' && (
        <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-extrabold text-gray-800 text-base">Incoming Tenant Contacts</h2>
            <button onClick={loadInquiries} className="text-gray-400 hover:text-emerald-600">
              <RefreshCw size={14} />
            </button>
          </div>

          {loadingInquiries ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map(n => <div key={n} className="bg-gray-50 h-24 rounded-xl"></div>)}
            </div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-150 rounded-2xl bg-gray-50/50">
              <Mail size={36} className="mx-auto text-gray-300 mb-3" />
              <h3 className="font-bold text-gray-800 text-sm">No incoming requests</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Applications filed by verified tenants interested in your houses, flats, or single rooms will appear listings here. Check approved state metrics!
              </p>
            </div>
          ) : (
            <div className="space-y-4" id="owner-inquiries-catalog">
              {inquiries.map((inq) => (
                <article 
                  key={inq._id}
                  className="border border-gray-50 rounded-2xl p-5 hover:bg-gray-50/30 transition-all bg-white shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-50 pb-3 mb-3">
                    <div>
                      <h4 className="text-xs text-gray-400 uppercase tracking-widest text-[9px]">Requested listing:</h4>
                      <h3 className="font-bold text-gray-900 text-sm">{inq.propertyTitle}</h3>
                      <p className="text-[10px] text-gray-455 text-gray-500 mt-0.5">Application filed on {new Date(inq.createdAt).toLocaleDateString()}</p>
                    </div>

                    {/* Status picker dropdown */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="text-[10px] text-gray-500 font-semibold">Contact Status:</span>
                      <select
                        value={inq.status}
                        onChange={(e) => handleUpdateInquiryStatus(inq._id, e.target.value)}
                        className={`text-[10px] font-bold rounded-lg border py-1 px-2.5 ${
                          inq.status === 'Resolved' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                          inq.status === 'Contacted' ? 'bg-indigo-50 text-indigo-800 border-indigo-100' :
                          'bg-amber-50 text-amber-805 text-amber-800 border-amber-100'
                        }`}
                      >
                        <option value="Pending">Pending Contact</option>
                        <option value="Contacted">Contact Initiated</option>
                        <option value="Resolved">Resolved (Rent Confirmed)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Message */}
                    <div className="md:col-span-2 bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Tenant message request</p>
                      <p className="text-xs text-gray-700 italic">"{inq.message}"</p>
                    </div>

                    {/* Tenant contacts */}
                    <div className="bg-emerald-50/20 border border-emerald-100/50 p-3.5 rounded-xl text-xs space-y-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-800">Tenant Coordinates</p>
                      <div className="font-bold text-gray-800">{inq.tenantName}</div>
                      <div className="flex items-center gap-1 text-gray-650 text-gray-600">
                        <Phone size={13} className="text-emerald-500" />
                        <span>{inq.tenantPhone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-650 text-gray-600">
                        <Mail size={13} className="text-emerald-500" />
                        <span className="truncate">{inq.tenantEmail}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* VIEW: Booking Reservations Panel */}
      {activeTab === 'bookings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Bookings List (2 columns) */}
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-extrabold text-gray-800 text-base">Booking Requests & Reservations</h2>
                <button onClick={loadBookings} className="text-gray-400 hover:text-emerald-600 cursor-pointer">
                  <RefreshCw size={14} />
                </button>
              </div>

              {loadingBookings ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2].map(n => <div key={n} className="bg-gray-50 h-32 rounded-xl"></div>)}
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-150 rounded-2xl bg-gray-50/50">
                  <ClipboardList size={36} className="mx-auto text-gray-300 mb-3" />
                  <h3 className="font-bold text-gray-800 text-sm">No bookings found</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    When tenants click "Book Now" on your property listing pages, their request details and contact credentials will be collected here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4" id="owner-bookings-catalog">
                  {bookings.map((b) => (
                    <article 
                      key={b._id}
                      className="border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-all bg-white shadow-xs"
                    >
                      {/* Header block */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-50 pb-3 mb-3">
                        <div className="flex items-center gap-3">
                          <img src={b.propertyImage} alt={b.propertyTitle} className="h-10 w-12 object-cover rounded-lg bg-gray-50 border shrink-0" referrerPolicy="no-referrer" />
                          <div>
                            <h4 className="text-[9px] text-gray-400 uppercase tracking-wider">Booked Property:</h4>
                            <h3 className="font-extrabold text-gray-900 text-sm">{b.propertyTitle}</h3>
                            <p className="text-[10px] text-gray-500">Filed on {formatDate(b.createdAt)}</p>
                          </div>
                        </div>

                        {/* Status Label */}
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

                      {/* Content segments */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* Booking dates and specs */}
                        <div className="md:col-span-2 space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-xs bg-gray-50 p-3 rounded-xl">
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
                              <span className="font-semibold text-gray-800">{b.occupants} Person(s)</span>
                            </div>
                          </div>

                          {b.message && (
                            <div className="bg-gray-50 p-3 rounded-xl text-xs">
                              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Special message request</span>
                              <p className="text-gray-600 italic">"{b.message}"</p>
                            </div>
                          )}

                          {b.status === 'Rejected' && (
                            <div className="bg-red-50/40 border border-red-100 p-3 rounded-xl text-xs text-red-800">
                              <span className="block text-[9px] font-bold text-red-600 uppercase tracking-wider mb-0.5 font-sans">Rejection Reason</span>
                              <p className="italic">"{b.rejectionReason}"</p>
                            </div>
                          )}

                          {b.status === 'Cancelled' && (
                            <div className="bg-red-50/40 border border-red-100 p-3 rounded-xl text-xs text-red-800">
                              <span className="block text-[9px] font-bold text-red-600 uppercase tracking-wider mb-0.5 font-sans">Cancellation Details</span>
                              <p className="font-semibold text-gray-950">Cancelled by: {b.cancelledBy || 'Tenant'}</p>
                              <p className="italic mt-0.5">Reason: "{b.cancellationReason}"</p>
                            </div>
                          )}
                        </div>

                        {/* Tenant Contacts */}
                        <div className="bg-emerald-50/10 border border-emerald-500/5 p-3.5 rounded-xl text-xs space-y-2">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-800">Tenant Details</p>
                          <div className="font-bold text-gray-900">{b.tenantName}</div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Phone size={12} className="text-emerald-600" />
                            <span>{b.tenantPhone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Mail size={12} className="text-emerald-600" />
                            <span className="truncate" title={b.tenantEmail}>{b.tenantEmail}</span>
                          </div>
                        </div>

                      </div>

                      {/* Booking Action decisions panel */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-3 mt-3 border-t border-gray-50">
                        {b.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleAcceptBooking(b._id)}
                              className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-4 rounded-lg cursor-pointer shadow-sm transition-colors"
                            >
                              Accept Booking
                            </button>
                            <button
                              onClick={() => { setRejectionId(b._id); setRejectReasonInput(''); }}
                              className="text-[10px] font-black uppercase tracking-wider bg-red-50 hover:bg-red-100 text-red-700 py-1.5 px-4 rounded-lg cursor-pointer transition-colors"
                            >
                              Reject Request
                            </button>
                          </>
                        )}

                        {b.status === 'Confirmed' && (
                          <>
                            <button
                              onClick={() => handleMarkBookingCompleted(b._id)}
                              className="text-[10px] font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-4 rounded-lg cursor-pointer shadow-sm transition-colors"
                            >
                              Mark Stay Completed
                            </button>
                            <button
                              onClick={() => { setCancellingId(b._id); setCancelReasonInput(''); }}
                              className="text-[10px] font-black uppercase tracking-wider bg-red-50 hover:bg-red-100 text-red-700 py-1.5 px-4 rounded-lg cursor-pointer transition-colors"
                            >
                              Cancel Booking
                            </button>
                          </>
                        )}
                      </div>

                      {/* Inline forms for rejection reasons */}
                      {rejectionId === b._id && (
                        <div className="mt-4 p-4 border border-red-150 bg-red-50/10 rounded-xl space-y-3">
                          <h4 className="text-xs font-black text-red-950 flex items-center gap-1">
                            <AlertTriangle size={14} className="text-red-600" /> State Rejection Reason
                          </h4>
                          <p className="text-[11px] text-gray-500">Provide feedback to the tenant about why their booking cannot be fulfilled.</p>
                          <input
                            type="text"
                            value={rejectReasonInput}
                            onChange={(e) => setRejectReasonInput(e.target.value)}
                            placeholder="e.g. Room is currently undergoing maintenance/painting..."
                            className="w-full text-xs p-2.5 rounded-lg border border-red-200 focus:outline-none focus:border-red-500 bg-white"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => { setRejectionId(null); setRejectReasonInput(''); }}
                              className="text-[10px] font-bold text-gray-500 hover:text-gray-700 py-1 px-2 cursor-pointer"
                            >
                              Close
                            </button>
                            <button
                              disabled={submittingAction}
                              onClick={() => handleRejectBooking(b._id)}
                              className="text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-lg cursor-pointer disabled:opacity-50"
                            >
                              {submittingAction ? 'Rejecting...' : 'Reject Booking Now'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Inline forms for cancel reasons */}
                      {cancellingId === b._id && (
                        <div className="mt-4 p-4 border border-red-150 bg-red-50/10 rounded-xl space-y-3">
                          <h4 className="text-xs font-black text-red-950 flex items-center gap-1">
                            <AlertTriangle size={14} className="text-red-600" /> Cancel Confirmed Booking
                          </h4>
                          <p className="text-[11px] text-gray-500">Please provide a reason why you must cancel this confirmed booking reservation.</p>
                          <input
                            type="text"
                            value={cancelReasonInput}
                            onChange={(e) => setCancelReasonInput(e.target.value)}
                            placeholder="Reason for cancel..."
                            className="w-full text-xs p-2.5 rounded-lg border border-red-200 focus:outline-none focus:border-red-500 bg-white"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => { setCancellingId(null); setCancelReasonInput(''); }}
                              className="text-[10px] font-bold text-gray-500 hover:text-gray-700 py-1 px-2 cursor-pointer"
                            >
                              Close
                            </button>
                            <button
                              disabled={submittingAction}
                              onClick={() => handleCancelBookingByOwner(b._id)}
                              className="text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded-lg cursor-pointer disabled:opacity-50"
                            >
                              {submittingAction ? 'Cancelling...' : 'Confirm Cancel Booking'}
                            </button>
                          </div>
                        </div>
                      )}

                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Owner Notifications Alert Sidebar (1 column) */}
          <section className="lg:col-span-1">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
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
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1" id="owner-notifications">
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
          </section>

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
                This operation is permanent. Your property listing as well as all related inquiries, messages, and chats will be purged forever.
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
                  await executeDeleteListing(id);
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
