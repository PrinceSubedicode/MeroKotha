import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { Search, MapPin, CheckCircle, Shield, Key, ArrowRight, Home as HouseIcon, Sparkles } from 'lucide-react';
import { NEPAL_GEOGRAPHY } from '../utils/nepalLocations.js';

export default function Home() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Home search bar fields
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('any');
  const [selectedCity, setSelectedCity] = useState('any');

  // Load properties on mount
  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await api.get('/properties');
        // Show up to 3 for Home Page featured carousel
        setProperties(res.data.slice(0, 3));
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
    e.preventDefault();
    let url = `/properties?search=${encodeURIComponent(searchQuery)}`;
    if (selectedType !== 'any') url += `&propertyType=${selectedType}`;
    if (selectedCity !== 'any') url += `&city=${selectedCity}`;
    navigate(url);
  };

  // Compile unique cities for the hero dropdown
  const allCities = Object.values(NEPAL_GEOGRAPHY).flatMap(prov => prov.cities);

  return (
    <div className="flex-1" id="merokotha-homepage">
      
      {/* Hero Search Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#ece8e1] via-[#fdfbf7] to-[#ece8e1]/60 py-20 pb-28 text-gray-800 border-b border-gray-150">
        {/* Abstract decorative circles */}
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl"></div>
        <div className="absolute top-1/2 right-10 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl mb-6 font-serif tracking-tight font-normal text-gray-900">
              Find your perfect space in <span className="italic font-normal text-indigo-600">Nepal</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              Rent zero-brokerage verified rooms, flats, student apartments, and luxury homestays across Kathmandu, Pokhara, Lalitpur, and all major cities of Nepal.
            </p>
          </div>

          {/* Search Box Card */}
          <div className="mx-auto max-w-4xl bg-white rounded-2xl p-4 sm:p-6 shadow-2xl text-gray-800 border border-gray-100" id="homepage-search-card">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              
              {/* Query Keyword Search */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Where in Nepal?
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 text-emerald-600" size={18} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter area, city or district (e.g. Jhamsikhel)"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm font-medium focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    id="search-input"
                  />
                </div>
              </div>

              {/* Property Type Dropdown */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Asset Type
                </label>
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  id="type-select"
                >
                  <option value="any">Any (Room/Flat/House)</option>
                  <option value="Room">Single Room</option>
                  <option value="Flat">Entire Flat</option>
                  <option value="House">Complete House</option>
                </select>
              </div>

              {/* Find Button */}
              <button 
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-6 text-sm font-bold text-white transition-all shadow-md shadow-emerald-700/20 w-full"
                id="search-submit-btn"
              >
                <Search size={18} /> Search
              </button>

            </form>
          </div>
        </div>
      </section>

      {/* Feature stats summary segment */}
      <section className="bg-white py-12 relative -mt-8 mx-auto max-w-6xl rounded-2xl shadow-xl border border-gray-100 z-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 justify-items-center text-center px-6">
          <div className="flex flex-col items-center max-w-xs">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-4 font-bold">
              <CheckCircle size={24} />
            </span>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Direct Verification</h3>
            <p className="text-xs text-gray-500">Every room and price on our map is verified directly with property owners.</p>
          </div>

          <div className="flex flex-col items-center max-w-xs">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-4 font-bold">
              <Shield size={24} />
            </span>
            <h3 className="No Broker Commission text-lg font-bold text-gray-800 mb-1">No Brokers, No Fees</h3>
            <p className="text-xs text-gray-500">Connect directly. Zero agent commissions, middleman cuts, or secret fees.</p>
          </div>

          <div className="flex flex-col items-center max-w-xs">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-4 font-bold">
              <Key size={24} />
            </span>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Easy Inquiries</h3>
            <p className="text-xs text-gray-500">Find rooms, submit message details, and schedule physical inspection on site.</p>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Featured Verified Listings
            </h2>
            <p className="text-sm text-gray-500 mt-1">Recently approved properties listed by verified landlords across Nepal</p>
          </div>
          <Link 
            to="/properties" 
            className="group inline-flex items-center gap-1 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors mt-2 sm:mt-0"
          >
            Browse All Rentals <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse bg-white rounded-2xl border border-gray-100 overflow-hidden h-[380px] flex flex-col">
                <div className="bg-gray-100 h-48 w-full"></div>
                <div className="p-5 flex-1 space-y-4">
                  <div className="bg-gray-100 h-6 rounded w-1/3"></div>
                  <div className="bg-gray-100 h-4 rounded w-3/4"></div>
                  <div className="bg-gray-100 h-4 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-6 text-center border border-red-150">
            <p className="text-red-700 font-medium mb-3">{error}</p>
            <Link to="/properties" className="inline-block bg-emerald-600 hover:bg-emerald-700 font-bold text-white px-5 py-2 rounded-lg text-sm">
              Direct search page
            </Link>
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center">
            <HouseIcon className="mx-auto text-gray-300 mb-4" size={40} />
            <p className="text-gray-500 font-medium">No verified listings available at the moment.</p>
            <p className="text-xs text-gray-400 mt-1">Be the first to list a room for rent on MeroKotha!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="featured-listings-container">
            {properties.map((property) => (
              <article 
                key={property._id}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-[400px]"
              >
                {/* Image panel */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <img 
                    src={property.images[0]} 
                    alt={property.title} 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {property.propertyType}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/75 text-white text-sm font-bold px-3 py-1 rounded-lg backdrop-blur-xs">
                    Rs. {Number(property.rent).toLocaleString()}/month
                  </div>
                </div>

                {/* Info block */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs font-semibold mb-2">
                      <MapPin size={14} className="text-emerald-500 shrink-0" />
                      <span className="truncate">{property.location}, {property.city}</span>
                    </div>

                    <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
                      {property.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                      {property.description}
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-500">
                      Rooms: <strong className="text-gray-800">{property.bedrooms} Bed</strong> / <strong className="text-gray-800">{property.bathrooms} Bath</strong>
                    </span>
                    <Link 
                      to={`/properties/${property._id}`}
                      className="px-3.5 py-1.5 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 font-bold rounded-lg transition-all border border-gray-100"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Nepal City Directory Grid */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Explore Top Locations in Nepal</h2>
            <p className="text-sm text-gray-500 mt-1">Browse flats, apartments, and shared rooms dynamically by popular zones</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Kathmandu */}
            <div 
              onClick={() => navigate('/properties?search=Kathmandu')}
              className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all"
            >
              <img 
                src="https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&q=80&w=600" 
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
              className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all"
            >
              <img 
                src="https://images.unsplash.com/photo-1596422846543-75c6fc18a523?auto=format&fit=crop&q=80&w=600" 
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
              className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all"
            >
              <img 
                src="https://images.unsplash.com/photo-1590487989505-18cf7427814b?auto=format&fit=crop&q=80&w=600" 
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
              className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all"
            >
              <img 
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600" 
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
      <section className="py-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bg-white">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">How simple it works</h2>
          <p className="text-sm text-gray-500 mt-1">Rent safely without brokers or overhead expenses on MeroKotha</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* For Tenants */}
          <div className="bg-emerald-50/50 rounded-2xl p-8 border border-emerald-500/10">
            <h3 className="text-xl font-bold text-emerald-950 mb-6 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm">1</span>
              For Rental Seekers (Tenants)
            </h3>
            <ul className="space-y-4 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Browse Verified Ads:</strong> Browse through flats and rooms sorted by city, price range, and custom list of facilities.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Bookmark Favorites:</strong> Save interesting rental properties so you can cross-compare or inspect them later.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Send Inquiries directly:</strong> Fill in the inquiry form. The landlord receives your phone details immediately to start physical scheduling.</span>
              </li>
            </ul>
          </div>

          {/* For Owners */}
          <div className="bg-indigo-50/50 rounded-2xl p-8 border border-indigo-500/10">
            <h3 className="text-xl font-bold text-indigo-950 mb-6 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">2</span>
              For Property Owners & Landlords
            </h3>
            <ul className="space-y-4 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <CheckCircle size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>Register Listing:</strong> Submit rooms/flats with detailed facilities lists, photos, rent pricing, and precise google directions location details.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>Admin Review approval:</strong> MeroKotha admins verify listing data to keep the platform clean and approve it within hours.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>Manage tenant inquiries:</strong> Review prospective tenant request letters from your dedicated dashboard and update contact states.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

    </div>
  );
}
