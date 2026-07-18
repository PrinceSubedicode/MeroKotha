import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  Search, 
  MapPin, 
  CheckCircle, 
  Shield, 
  Key, 
  ArrowRight, 
  Home as HouseIcon, 
  Bed, 
  Building, 
  Compass, 
  Star, 
  Sparkles
} from 'lucide-react';
import { NEPAL_GEOGRAPHY } from '../utils/nepalLocations.js';

// Gorgeous fallback Nepalese demo room/flat properties
const demoProperties = [
  {
    _id: 'demo-1',
    title: 'Cozy Modern Studio Room with Sunny Balcony',
    location: 'Jhamsikhel, Lalitpur',
    city: 'Lalitpur',
    propertyType: 'Room',
    rent: 12000,
    bedrooms: 1,
    bathrooms: 1,
    description: 'Beautiful, fully furnished sunny room in the heart of Jhamsikhel. Includes high-speed fiber internet, hot water, and a shared kitchen garden access.',
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.8,
    reviewsCount: 24,
    features: ['Furnished', 'Balcony', 'Hot Water', 'Wifi']
  },
  {
    _id: 'demo-2',
    title: 'Elegant 2 BHK Apartment Flat near Ring Road',
    location: 'Maharajgunj, Kathmandu',
    city: 'Kathmandu',
    propertyType: 'Flat',
    rent: 28000,
    bedrooms: 2,
    bathrooms: 2,
    description: 'Spacious second-floor flat with 2 large bedrooms, living hall, kitchen, and private parking. Located in a quiet, safe residential neighborhood.',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.9,
    reviewsCount: 16,
    features: ['Parking', 'Kitchen', '24h Water', 'Security']
  },
  {
    _id: 'demo-3',
    title: 'Scenic Rooftop Penthouse with Mountain Views',
    location: 'Lakeside, Pokhara',
    city: 'Pokhara',
    propertyType: 'Room',
    rent: 15000,
    bedrooms: 1,
    bathrooms: 1,
    description: 'A gorgeous top-floor penthouse room featuring a stunning view of Phewa Lake and the Annapurna range. Peaceful, breezy atmosphere ideal for students/digital nomads.',
    images: [
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.7,
    reviewsCount: 32,
    features: ['Rooftop', 'Furnished', 'Mountain View', 'Wifi']
  },
  {
    _id: 'demo-4',
    title: 'Spacious 3 BHK Full House with Private Courtyard',
    location: 'Sauraha, Chitwan',
    city: 'Chitwan',
    propertyType: 'House',
    rent: 45000,
    bedrooms: 3,
    bathrooms: 2,
    description: 'A charming full family house near the Chitwan National Park. Spacious green garden, pet-friendly courtyard, fully air-conditioned rooms, and dedicated solar backup.',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.9,
    reviewsCount: 11,
    features: ['Garden', 'AC', 'Pet Friendly', 'Solar Power']
  },
  {
    _id: 'demo-5',
    title: 'Compact Furnished Room for Students & Professionals',
    location: 'Baneshwor, Kathmandu',
    city: 'Kathmandu',
    propertyType: 'Room',
    rent: 8500,
    bedrooms: 1,
    bathrooms: 1,
    description: 'Budget-friendly room close to major colleges and public transport hubs. Features high-speed Wi-Fi, drinking water filter, and private study desk.',
    images: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.6,
    reviewsCount: 41,
    features: ['Budget Friendly', 'Study Desk', 'Wifi', 'Water Filter']
  },
  {
    _id: 'demo-6',
    title: 'Premium 1 BHK Flat with Modular Kitchen',
    location: 'Sanepa, Lalitpur',
    city: 'Lalitpur',
    propertyType: 'Flat',
    rent: 20000,
    bedrooms: 1,
    bathrooms: 1,
    description: 'Newly constructed high-end flat with modular kitchen cabinetry, private geyser, and gorgeous lighting. Perfectly suited for single expats or couples.',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.8,
    reviewsCount: 19,
    features: ['Modular Kitchen', 'Geyser', 'Modern Design', 'Quiet']
  }
];

export default function Home() {
  const navigate = useNavigate();
  const { user, favorites } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Home search bar fields
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('any');
  const [selectedCity, setSelectedCity] = useState('any');
  const [activeTab, setActiveTab] = useState('stays'); // 'stays' = any, 'rooms' = Room, 'flats' = Flat, 'houses' = House

  // Load properties on mount
  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await api.get('/properties');
        setProperties(res.data);
      } catch (err) {
        console.error('Featured properties fetch failure:', err);
        setError('Unable to load listings. Check backend connection.');
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    let url = `/properties?search=${encodeURIComponent(searchQuery)}`;
    if (selectedType !== 'any') url += `&propertyType=${selectedType}`;
    if (selectedCity !== 'any') url += `&city=${selectedCity}`;
    navigate(url);
  };

  // When active tab changes, pre-configure the type
  const handleTabChange = (tabId, typeValue) => {
    setActiveTab(tabId);
    setSelectedType(typeValue);
  };

  // Compile unique cities for the hero dropdown or filter
  const allCities = Array.from(new Set(Object.values(NEPAL_GEOGRAPHY).flatMap(prov => prov.cities)));

  // Merge real properties from backend with beautiful demo rooms
  const displayProperties = properties.length > 0 
    ? [...properties, ...demoProperties].slice(0, 6) 
    : demoProperties;

  return (
    <div className="flex-1 bg-white" id="merokotha-homepage">
      
      {/* Premium minimal inspired responsive hero - pure white canvas */}
      <section className="bg-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 text-gray-800 relative border-b border-gray-100 transition-colors duration-300">
        
        <div className="mx-auto max-w-7xl relative z-10">
          
          {/* Category Pill Navigation - Sleek & Modern */}
          <div className="flex items-center gap-2.5 mb-8 overflow-x-auto scrollbar-none pb-2">
            <button
              onClick={() => handleTabChange('stays', 'any')}
              className={`flex items-center gap-2 px-4.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                activeTab === 'stays' 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
              }`}
            >
              <Bed size={15} />
              <span>All Stays</span>
            </button>
            <button
              onClick={() => handleTabChange('rooms', 'Room')}
              className={`flex items-center gap-2 px-4.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                activeTab === 'rooms' 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
              }`}
            >
              <Building size={15} />
              <span>Rooms</span>
            </button>
            <button
              onClick={() => handleTabChange('flats', 'Flat')}
              className={`flex items-center gap-2 px-4.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                activeTab === 'flats' 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
              }`}
            >
              <HouseIcon size={15} />
              <span>Entire Flats</span>
            </button>
            <button
              onClick={() => handleTabChange('houses', 'House')}
              className={`flex items-center gap-2 px-4.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                activeTab === 'houses' 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
              }`}
            >
              <Compass size={15} />
              <span>Houses & Villas</span>
            </button>
            <Link
              to="/contact"
              className="flex items-center gap-2 px-4.5 py-2 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-emerald-600 border border-gray-200 transition-all whitespace-nowrap"
            >
              <Sparkles size={15} />
              <span>Exclusive Deals</span>
            </Link>
          </div>

          {/* Simple Clean Title Header */}
          <div className="max-w-3xl mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 mb-3 leading-tight">
              Your Perfect Rental Starts Here{user ? `, ${user.name.split(' ')[0]}` : ''}!
            </h1>
            <p className="text-sm sm:text-base text-gray-500 font-medium">
              Find budget-friendly rooms, flats, and homes with zero broker commissions in Nepal.
            </p>
          </div>

          {/* Clean modern border search box - rounded-2xl and elegant */}
          <div className="bg-white border border-gray-200 p-1.5 rounded-2xl shadow-md max-w-6xl">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-xl gap-1 items-stretch text-gray-800 transition-colors duration-300">
              
              {/* Where input field */}
              <div className="lg:col-span-5 flex items-center gap-2.5 px-4 py-2 border-b lg:border-b-0 lg:border-r border-gray-100 min-w-0">
                <MapPin className="text-emerald-600 shrink-0" size={18} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Where in Nepal?</p>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter area, neighborhood, or city (e.g. Jhamsikhel)"
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-gray-800 placeholder-gray-400 border-none outline-none focus:outline-none focus:ring-0 p-0"
                    id="search-input"
                  />
                </div>
              </div>

              {/* Property Type drop menu */}
              <div className="lg:col-span-3 flex items-center gap-2.5 px-4 py-2 border-b lg:border-b-0 lg:border-r border-gray-100">
                <Building className="text-emerald-600 shrink-0" size={18} />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Property Type</p>
                  <select 
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-gray-800 border-none outline-none focus:outline-none focus:ring-0 p-0 appearance-none cursor-pointer"
                    id="type-select"
                  >
                    <option value="any">Any (Rooms & Flats)</option>
                    <option value="Room">Single Room</option>
                    <option value="Flat">Entire Flat</option>
                    <option value="House">Complete House</option>
                  </select>
                </div>
              </div>

              {/* City Selection dropdown */}
              <div className="lg:col-span-2 flex items-center gap-2.5 px-4 py-2 border-b lg:border-b-0 lg:border-r border-gray-100">
                <Compass className="text-emerald-600 shrink-0" size={18} />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Select City</p>
                  <select 
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-gray-800 border-none outline-none focus:outline-none focus:ring-0 p-0 appearance-none cursor-pointer"
                    id="city-select"
                  >
                    <option value="any">All Cities</option>
                    {allCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit search button */}
              <div className="lg:col-span-2 flex p-1">
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-5 py-3 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm shadow-sm"
                  id="search-submit-btn"
                >
                  <Search size={16} />
                  <span>Search</span>
                </button>
              </div>

            </form>
          </div>

        </div>
      </section>

      {/* Trust & Verification badging segment */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative -mt-6 z-20">
        <div className="bg-white rounded-2xl shadow-md border border-gray-150 py-8 px-6 sm:px-10 grid grid-cols-1 md:grid-cols-3 gap-8 transition-colors duration-300">
          <div className="flex gap-4 items-start">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0 font-bold transition-all">
              <CheckCircle size={22} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">Direct Verification</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Every room and price is verified physically or directly with the verified landlords.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0 font-bold transition-all">
              <Shield size={22} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">Zero Middleman Fees</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Connect, chat, and rent directly. Absolutely zero commission cuts or broker charges.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0 font-bold transition-all">
              <Key size={22} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">Instant Direct Inquiries</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Send an inquiry instantly with your contact details to start immediate room viewings.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Showcase */}
      <section className="py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bg-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight animate-fade-in">
              Trending Properties in Nepal
            </h2>
            <p className="text-sm text-gray-500 mt-1">Stunning rooms, apartments, and co-living spaces with real verified photographs</p>
          </div>
          <Link 
            to="/properties" 
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-all mt-3 sm:mt-0"
          >
            Explore all listings <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse bg-white rounded-2xl border border-gray-100 overflow-hidden h-[380px] flex flex-col">
                <div className="bg-gray-50 h-48 w-full"></div>
                <div className="p-5 flex-1 space-y-4">
                  <div className="bg-gray-50 h-6 rounded w-1/3"></div>
                  <div className="bg-gray-50 h-4 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="featured-listings-container">
            {displayProperties.map((property) => {
              return (
                <article 
                  key={property._id}
                  className="group bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col h-[410px]"
                >
                  {/* Photo Section with Badge & Favorite Trigger */}
                  <div className="relative h-48 w-full overflow-hidden bg-gray-50">
                    <img 
                      src={property.images[0]} 
                      alt={property.title} 
                      className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    
                    {/* Badge */}
                    <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                      {property.propertyType}
                    </div>

                    {/* Rent Badge */}
                    <div className="absolute bottom-3 left-3 bg-black/75 text-white text-xs font-bold px-2.5 py-1 rounded-md backdrop-blur-xs">
                      Rs. {Number(property.rent).toLocaleString()}/month
                    </div>

                    {/* Rating Badge */}
                    {property.rating && (
                      <div className="absolute top-3 right-3 bg-white text-gray-800 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-xs border border-gray-100">
                        <Star size={13} className="fill-yellow-400 text-yellow-400" />
                        <span>{property.rating}</span>
                      </div>
                    )}
                  </div>

                  {/* Property Details Info Section */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Location details */}
                      <div className="flex items-center gap-1 text-gray-500 text-xs font-semibold mb-2">
                        <MapPin size={13} className="text-emerald-600 shrink-0" />
                        <span className="truncate">{property.location}, {property.city}</span>
                      </div>

                      {/* Header Title */}
                      <h3 className="font-bold text-sm text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
                        {property.title}
                      </h3>

                      {/* Short Description */}
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                        {property.description}
                      </p>

                      {/* Pill features */}
                      {property.features && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {property.features.slice(0, 3).map((f) => (
                            <span key={f} className="text-[10px] font-bold bg-gray-50 text-gray-600 px-2 py-0.5 rounded border border-gray-100">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action buttons bar */}
                    <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-500">
                        Rooms: <strong className="text-gray-800">{property.bedrooms} Bed</strong> / <strong className="text-gray-800">{property.bathrooms} Bath</strong>
                      </span>
                      <Link 
                        to={`/properties/${property._id}`}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl transition-all shadow-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Nepal City Directory Grid */}
      <section className="py-16 bg-white border-y border-gray-100 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Explore Top Locations in Nepal</h2>
            <p className="text-sm text-gray-500 mt-1">Browse flats, apartments, and shared rooms dynamically by popular zones</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Kathmandu */}
            <div 
              onClick={() => navigate('/properties?search=Kathmandu')}
              className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              <img 
                src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=600" 
                alt="Kathmandu" 
                className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-all duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="font-bold text-lg">Kathmandu</h3>
                <p className="text-xs text-gray-300">Browse Capital Rentals</p>
              </div>
            </div>

            {/* Lalitpur */}
            <div 
              onClick={() => navigate('/properties?search=Lalitpur')}
              className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              <img 
                src="https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&q=80&w=600" 
                alt="Lalitpur" 
                className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-all duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="font-bold text-lg">Lalitpur</h3>
                <p className="text-xs text-gray-300">Jhamsikhel & Sanepa Studios</p>
              </div>
            </div>

            {/* Pokhara */}
            <div 
              onClick={() => navigate('/properties?search=Pokhara')}
              className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              <img 
                src="https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&q=80&w=600" 
                alt="Pokhara" 
                className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-all duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="font-bold text-lg">Pokhara</h3>
                <p className="text-xs text-gray-300">Lakeside Luxury & Student Rooms</p>
              </div>
            </div>

            {/* Chitwan */}
            <div 
              onClick={() => navigate('/properties?search=Chitwan')}
              className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
              <img 
                src="https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&q=80&w=600" 
                alt="Chitwan" 
                className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-all duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="font-bold text-lg">Chitwan & Terai</h3>
                <p className="text-xs text-gray-300">Bharatpur & Sauraha Flats</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Tutorial How it Works Segment */}
      <section className="py-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bg-white transition-colors duration-300">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">How MeroKotha Works</h2>
          <p className="text-sm text-gray-500 mt-1">A simple, secure, and verified rental process for both tenants and property owners.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* For Tenants */}
          <div className="bg-white rounded-2xl p-8 border border-gray-150 shadow-xs hover:shadow-sm transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm">1</span>
              For Tenants
            </h3>
            <ul className="space-y-4 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Browse Verified Properties:</strong> Explore verified rooms, flats, hostels, and houses across Nepal with advanced search and filters.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Book Your Preferred Property:</strong> Send a booking request directly to the property owner after reviewing complete property details.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Track Booking Status:</strong> Monitor your booking request, receive approval or rejection notifications, and cancel bookings when needed.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Move In Securely:</strong> Once the owner approves your booking, the property becomes reserved and unavailable to other tenants.</span>
              </li>
            </ul>
          </div>

          {/* For Owners */}
          <div className="bg-white rounded-2xl p-8 border border-gray-150 shadow-xs hover:shadow-sm transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm">2</span>
              For Property Owners
            </h3>
            <ul className="space-y-4 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>List Your Property:</strong> Publish rooms, flats, or houses with photos, amenities, pricing, and exact map location.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Admin Verification:</strong> Your listing is reviewed by the admin before it becomes publicly visible.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Manage Booking Requests:</strong> Accept or reject tenant booking requests directly from your Owner Dashboard.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Update Availability:</strong> When a booking is confirmed, the property is automatically marked as occupied and hidden from public listings until it becomes available again.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

    </div>
  );
}
