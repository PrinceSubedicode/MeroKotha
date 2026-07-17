import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { MapPin, Phone, Mail, User, ShieldCheck, CheckSquare, Calendar, ChevronLeft, Send, Sparkles, AlertCircle } from 'lucide-react';
import MapIntegrationWrapper from '../components/MapIntegrationWrapper.jsx';
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inquiry message fields
  const [inquiryMsg, setInquiryMsg] = useState('Hi, I am interested in renting this vacancy. Please share more details on inspection dates!');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState(null);

  // Active slideshow index
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  useEffect(() => {
    async function loadDetails() {
      try {
        const res = await api.get(`/properties/${id}`);
        setProperty(res.data);
      } catch (err) {
        console.error('Failed to load property details:', err);
        setError('Listing could not be loaded. It might have been deleted.');
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [id]);

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setSubmittingInquiry(true);
    setInquiryError(null);
    try {
      await api.post('/inquiries', {
        propertyId: property._id,
        message: inquiryMsg
      });
      setInquirySuccess(true);
    } catch (err) {
      console.error('Inquiry dispatch error:', err);
      setInquiryError(err.response?.data?.message || 'Failed to dispatch inquiry. Please try again.');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-xs font-semibold text-gray-500">Retrieving rental verification details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <AlertCircle size={44} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Details Not Available</h2>
        <p className="text-gray-500 mt-2">{error || 'This property listing does not exist'}</p>
        <Link 
          to="/properties" 
          className="mt-6 inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors"
        >
          <ChevronLeft size={16} /> Back to Listings Search
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1" id="property-details-view">
      
      {/* Back button */}
      <div className="mb-6">
        <Link 
          to="/properties" 
          className="inline-flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-emerald-600 transition-colors"
        >
          <ChevronLeft size={16} /> Back to verified map
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Photos, Description, Facilities */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Slideshow Media Card */}
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm" id="details-media-showcase">
            <div className="relative h-96 sm:h-[450px] bg-slate-900 flex items-center justify-center">
              <img 
                src={property.images[activeImgIndex]} 
                alt={property.title} 
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
              />
              
              <div className="absolute bottom-4 left-4 bg-black/75 text-white py-1 px-3 rounded text-xs font-bold font-mono">
                Photo {activeImgIndex + 1} of {property.images.length}
              </div>
            </div>

            {/* Thumbnail Select Carousel */}
            {property.images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50 border-t border-gray-100">
                {property.images.map((img, idy) => (
                  <button
                    key={idy}
                    onClick={() => setActiveImgIndex(idy)}
                    className={`h-16 w-24 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      activeImgIndex === idy ? 'border-emerald-500 scale-95 shadow-md' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Thumbnail thumbnail" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Core Info details Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider">
                  {property.propertyType} Verified
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
                  <Calendar size={13} /> Listed {new Date(property.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 leading-tight">
                {property.title}
              </h1>

              <div className="flex items-center gap-1 text-gray-500 text-sm font-semibold mt-3">
                <MapPin size={16} className="text-emerald-500" />
                <span>{property.location}, {property.city}, {property.district}, {property.province}</span>
              </div>
            </div>

            {/* Price block */}
            <div className="grid grid-cols-3 gap-4 border-y border-gray-100 py-6 text-center">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Monthly Rent</p>
                <p className="text-lg sm:text-xl font-extrabold text-emerald-600 mt-1">Rs. {Number(property.rent).toLocaleString()}/m</p>
              </div>
              <div className="border-x border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Bedrooms Available</p>
                <p className="text-lg sm:text-xl font-extrabold text-gray-800 mt-1">{property.bedrooms} Bed</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Bathrooms Attached</p>
                <p className="text-lg sm:text-xl font-extrabold text-gray-800 mt-1">{property.bathrooms} Bath</p>
              </div>
            </div>

            {/* Description Area */}
            <div>
              <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider mb-3">About the vacancy</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>
          </div>

          {/* Amenities checklist Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
              Available Amenities & Utilities
            </h2>
            {property.facilities && property.facilities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="facilities-list-details">
                {property.facilities.map((fac) => (
                  <div key={fac} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckSquare size={16} className="text-emerald-500 shrink-0" />
                    <span className="font-semibold">{fac}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No specific facilities specified by listing owner.</p>
            )}
          </div>

          {/* Location Map Section */}
          {property.lat && property.lng && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4" id="property-detail-map-card">
              <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                Physical Location on Map
              </h2>
              <p className="text-xs text-gray-500">
                This rental unit is located at <strong className="text-gray-700">{property.location}</strong>, in the town of <strong className="text-gray-700">{property.city}</strong>. Use the interactive map below to explore neighborhood proximity:
              </p>
              <div className="h-72 w-full rounded-xl overflow-hidden border border-gray-150 relative">
                <MapIntegrationWrapper fallbackHeight="288px">
                  <Map
                    defaultCenter={{ lat: Number(property.lat), lng: Number(property.lng) }}
                    defaultZoom={15}
                    mapId="SINGLE_PROPERTY_DETAIL_MAP"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: '100%', height: '100%' }}
                    gestureHandling="cooperative"
                    disableDefaultUI={false}
                  >
                    <AdvancedMarker position={{ lat: Number(property.lat), lng: Number(property.lng) }}>
                      <Pin background="#059669" glyphColor="#ffffff" borderColor="#ffffff" />
                    </AdvancedMarker>
                  </Map>
                </MapIntegrationWrapper>
              </div>
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-gray-400 font-mono text-[10px]">GPS: {property.lat}, {property.lng}</span>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                >
                  Open in Google Maps &rarr;
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Right side - Sticky Lead Contact Container */}
        <div className="space-y-6">
          
          {/* Contact Box Details */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg" id="owner-contact-card">
            <h3 className="text-lg font-extrabold text-gray-900 mb-4">Rental Action Desk</h3>

            {/* Owner badge summary */}
            {property.ownerInfo ? (
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 mb-6">
                {property.ownerInfo.photo ? (
                  <img 
                    src={property.ownerInfo.photo} 
                    alt={property.ownerInfo.name} 
                    referrerPolicy="no-referrer"
                    className="h-11 w-11 rounded-xl object-cover border border-emerald-500 shrink-0" 
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold shrink-0">
                    <User size={20} />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-gray-800">{property.ownerInfo.name}</h4>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase flex items-center gap-0.5">
                    <ShieldCheck size={12} className="text-emerald-500" /> Verified Landlord
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 italic mb-4">No owner data resolved.</div>
            )}

            {/* Dynamic UI depending on user status */}
            {!user ? (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-amber-800 mb-3 leading-relaxed">
                  You must be logged in as a <strong>Tenant</strong> to view owner contact details or send inquiries.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Link 
                    to="/login"
                    className="py-2 px-3 border border-amber-600 bg-white hover:bg-amber-50 text-amber-700 font-bold text-xs rounded-lg transition-all"
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/register"
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all"
                  >
                    Register
                  </Link>
                </div>
              </div>
            ) : user.role === 'Tenant' ? (
              
              /* Inquiry form exclusively for Tenant users */
              <div className="space-y-4">
                
                {inquirySuccess ? (
                  <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-5 text-center">
                    <Sparkles size={32} className="text-emerald-600 mx-auto mb-3" />
                    <h4 className="font-bold text-emerald-950 text-sm">Inquiry Sent Successfully!</h4>
                    <p className="text-xs text-emerald-800/90 mt-1 lines-relaxed leading-relaxed">
                      Your interest was dispatched to <strong>{property.ownerInfo?.name || 'Owner'}</strong>. They will verify your credentials and reach you at <strong>{user.phone}</strong>.
                    </p>
                    <Link 
                      to="/tenant-dashboard"
                      className="mt-4 inline-block text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 py-2 px-4 rounded-lg shadow-sm"
                    >
                      View My Inquiries
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                        Send Inquiry Message
                      </label>
                      <textarea
                        rows={3}
                        value={inquiryMsg}
                        onChange={(e) => setInquiryMsg(e.target.value)}
                        placeholder="Write something about yourself and when you plan to visit the property..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-medium focus:border-emerald-500 focus:bg-white focus:outline-none"
                        required
                        id="inquiry-message-textarea"
                      />
                    </div>

                    {inquiryError && (
                      <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg">{inquiryError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={submittingInquiry}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-bold text-white shadow-md shadow-emerald-700/10 transition-all disabled:opacity-50"
                      id="submit-inquiry-btn"
                    >
                      <Send size={14} /> {submittingInquiry ? 'Sending...' : 'Send Rental Inquiry'}
                    </button>
                    
                    <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                      MeroKotha generates a safe communication channel. The landlord is notified instantly. No commissions!
                    </p>
                  </form>
                )}

              </div>
              
            ) : (
              /* Display owner contact info directly for other roles who are authenticated */
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-emerald-800 leading-normal">
                  You are viewing this as a registered **{user.role}**. Owner phone credentials shown below:
                </p>
                <div className="space-y-2 border-t border-emerald-100/50 pt-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-gray-800">
                    <Phone size={14} className="text-emerald-600" />
                    <span>Phone: {property.ownerInfo?.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-gray-800">
                    <Mail size={14} className="text-emerald-600" />
                    <span>Email: {property.ownerInfo?.email}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Disclaimer banner */}
          <div className="rounded-2xl bg-slate-50 border border-gray-150 p-5 space-y-2">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Stay Safe & Secure</h4>
            <ul className="text-[11px] text-gray-500 space-y-2 leading-relaxed">
              <li>&bull; Never send advanced payment or deposit money through online wallets until you physically visit the flat.</li>
              <li>&bull; Check drinking water schedules, parking accessibility, and curfew rules with Ramesh Adhikari directly.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
