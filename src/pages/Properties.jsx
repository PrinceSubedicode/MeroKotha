import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api.js';
import { NEPAL_GEOGRAPHY, GENERAL_FACILITIES, PROPERTY_TYPES } from '../utils/nepalLocations.js';
import { MapPin, Search, SlidersHorizontal, Heart, BookmarkCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, toggleFavorite, isFavorite } = useAuth();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for filter sidebar controls
  const [searchWord, setSearchWord] = useState(searchParams.get('search') || '');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState(searchParams.get('district') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || '');
  const [minRent, setMinRent] = useState(searchParams.get('minRent') || '');
  const [maxRent, setMaxRent] = useState(searchParams.get('maxRent') || '');
  const [bedrooms, setBedrooms] = useState(searchParams.get('bedrooms') || 'any');
  
  // Selected amenities
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // Load properties whenever search params change
  useEffect(() => {
    async function loadFilteredProperties() {
      setLoading(true);
      setError(null);
      try {
        // Build query string
        const params = {};
        if (searchParams.get('search')) params.search = searchParams.get('search');
        if (searchParams.get('city')) params.city = searchParams.get('city');
        if (searchParams.get('district')) params.district = searchParams.get('district');
        if (searchParams.get('propertyType')) params.propertyType = searchParams.get('propertyType');
        if (searchParams.get('minRent')) params.minRent = searchParams.get('minRent');
        if (searchParams.get('maxRent')) params.maxRent = searchParams.get('maxRent');
        if (searchParams.get('bedrooms') && searchParams.get('bedrooms') !== 'any') {
          params.bedrooms = searchParams.get('bedrooms');
        }

        const res = await api.get('/properties', { params });
        let filteredData = res.data;

        // Apply facilities search client-side for ultra-responsive multi-tag matching
        if (selectedAmenities.length > 0) {
          filteredData = filteredData.filter(prop => 
            selectedAmenities.every(amenity => prop.facilities && prop.facilities.includes(amenity))
          );
        }

        setProperties(filteredData);
      } catch (err) {
        console.error('Error loading properties data:', err);
        setError('Failed to fetch rooms list. Try again later.');
      } finally {
        setLoading(false);
      }
    }
    loadFilteredProperties();
  }, [searchParams, selectedAmenities]);

  // Synchronize initial input boxes with URL search query on mount
  useEffect(() => {
    setSearchWord(searchParams.get('search') || '');
    setCity(searchParams.get('city') || '');
    setDistrict(searchParams.get('district') || '');
    setPropertyType(searchParams.get('propertyType') || '');
    setMinRent(searchParams.get('minRent') || '');
    setMaxRent(searchParams.get('maxRent') || '');
    setBedrooms(searchParams.get('bedrooms') || 'any');
  }, [searchParams]);

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    const updated = {};
    if (searchWord) updated.search = searchWord;
    if (city && city !== 'any') updated.city = city;
    if (district && district !== 'any') updated.district = district;
    if (propertyType && propertyType !== 'any') updated.propertyType = propertyType;
    if (minRent) updated.minRent = minRent;
    if (maxRent) updated.maxRent = maxRent;
    if (bedrooms && bedrooms !== 'any') updated.bedrooms = bedrooms;
    setSearchParams(updated);
  };

  const handleClearFilters = () => {
    setSearchWord('');
    setProvince('');
    setDistrict('');
    setCity('');
    setPropertyType('');
    setMinRent('');
    setMaxRent('');
    setBedrooms('any');
    setSelectedAmenities([]);
    setSearchParams({});
  };

  const handleAmenityToggle = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(item => item !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1" id="properties-explorer-page">
      
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Verified Rental Marketplace</h1>
        <p className="text-sm text-gray-500 mt-1">
          Showing {properties.length} approved rooms, flats, and houses across Nepal (Zero Broker Commission)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Filters Sidebar Column */}
        <section className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs h-fit" id="filters-sidebar">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-emerald-600" /> Specify Filters
            </h2>
            <button 
              onClick={handleClearFilters}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Reset All
            </button>
          </div>

          <form onSubmit={handleApplyFilters} className="space-y-5">
            {/* Keyword Search */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Keyword Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input 
                  type="text"
                  value={searchWord}
                  onChange={(e) => setSearchWord(e.target.value)}
                  placeholder="e.g. Lakeside, Koteshwor"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-xs font-medium focus:border-emerald-500 focus:bg-white focus:outline-none"
                  id="filter-keyword-search"
                />
              </div>
            </div>

            {/* Province Geographic Dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Province</label>
              <select 
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value);
                  setDistrict('');
                  setCity('');
                }}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                id="filter-province-select"
              >
                <option value="">Select Province (All)</option>
                {Object.keys(NEPAL_GEOGRAPHY).map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            {/* District Dropdown based on active Province */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">District</label>
              <select 
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setCity('');
                }}
                disabled={!province}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none disabled:opacity-50"
                id="filter-district-select"
              >
                <option value="">Select District</option>
                {province && NEPAL_GEOGRAPHY[province].districts.map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>

            {/* City Dropdown based on active Province */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">City / Location</label>
              <select 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!province}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none disabled:opacity-50"
                id="filter-city-select"
              >
                <option value="">Select Municipality/City</option>
                {province && NEPAL_GEOGRAPHY[province].cities.map(ct => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </div>

            {/* Property Type Choice */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Rent Type</label>
              <select 
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold focus:border-emerald-500 focus:bg-white"
                id="filter-propertytype-select"
              >
                <option value="">Any (Room/Flat/House)</option>
                {PROPERTY_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Price Filter range */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Monthly Rent (NPR)</label>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="number"
                  placeholder="Min"
                  value={minRent}
                  onChange={(e) => setMinRent(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                  id="filter-min-rent"
                />
                <input 
                  type="number"
                  placeholder="Max"
                  value={maxRent}
                  onChange={(e) => setMaxRent(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                  id="filter-max-rent"
                />
              </div>
            </div>

            {/* Bedrooms choice */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Bedrooms Required</label>
              <div className="flex gap-2">
                {['any', '1', '2', '3', '4+'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBedrooms(val)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      bedrooms === val 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs' 
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkbox Amenities list */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Amenities Required</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-150 p-3 rounded-xl bg-gray-50">
                {GENERAL_FACILITIES.map(facility => {
                  const isChecked = selectedAmenities.includes(facility);
                  return (
                    <label key={facility} className="flex items-center gap-2 cursor-pointer py-0.5 group">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleAmenityToggle(facility)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                      />
                      <span className="text-xs text-gray-600 group-hover:text-emerald-700 font-medium transition-colors">
                        {facility}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Search Action buttons */}
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-sm font-bold text-white transition-all shadow-md shadow-emerald-700/10"
              id="filter-apply-btn"
            >
              Apply Filter State
            </button>
          </form>
        </section>

        {/* Right Listings Grid Column */}
        <div className="lg:col-span-3">
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" id="properties-loading-skeletons">
              {[1, 2, 4, 5].map((n) => (
                <div key={n} className="animate-pulse bg-white rounded-2xl border border-gray-150 overflow-hidden h-96 flex flex-col">
                  <div className="bg-gray-100 h-44 w-full"></div>
                  <div className="p-5 flex-1 space-y-4">
                    <div className="bg-gray-100 h-5 rounded w-1/4"></div>
                    <div className="bg-gray-100 h-4 rounded w-3/4"></div>
                    <div className="bg-gray-100 h-4 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center" id="search-error-view">
              <p className="text-red-700 font-bold mb-2">{error}</p>
              <button 
                onClick={handleClearFilters}
                className="px-4 py-2 bg-red-700 text-white font-bold text-xs rounded-xl"
              >
                Clear Filters
              </button>
            </div>
          ) : properties.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-16 text-center" id="search-empty-view">
              <SlidersHorizontal size={40} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-800">No rooms match your filter criteria</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                Try widening your search terms, clearing specific facilities checkboxes, or searching in broad cities like Kathmandu.
              </p>
              <button 
                onClick={handleClearFilters}
                className="mt-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 px-5 text-xs font-bold text-white transition-all shadow-md shadow-emerald-700/10"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" id="properties-listings-grid">
              {properties.map((property) => {
                const fav = isFavorite(property._id);
                return (
                  <article 
                    key={property._id}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Image Area */}
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      <img 
                        src={property.images[0]} 
                        alt={property.title} 
                        className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Asset category labels top left */}
                      <span className="absolute top-3 left-3 bg-emerald-600/90 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider shadow-sm backdrop-blur-xs">
                        {property.propertyType}
                      </span>

                      {/* Favorites heart top right for Tenants */}
                      {user && user.role === 'Tenant' && (
                        <button 
                          onClick={() => toggleFavorite(property._id)}
                          className="absolute top-3 right-3 flex h-8.5 w-8.5 items-center justify-center rounded-full bg-white/90 text-gray-500 hover:text-red-500 transition-colors shadow-md hover:scale-110 active:scale-95"
                          title={fav ? 'Remove Bookmarked' : 'Save Property'}
                        >
                          <Heart size={16} className={`${fav ? 'text-red-500 fill-current' : ''}`} />
                        </button>
                      )}

                      {/* Pricing Tag bottom-left */}
                      <div className="absolute bottom-3 left-3 bg-gray-900/85 text-white font-extrabold text-sm px-3 py-1 rounded-lg shadow-md backdrop-blur-xs">
                        Rs. {Number(property.rent).toLocaleString()} <span className="text-[10px] font-medium text-gray-300">/m</span>
                      </div>
                    </div>

                    {/* Content Block */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Geography line */}
                        <div className="flex items-center gap-1 text-gray-500 text-xs font-semibold mb-2">
                          <MapPin size={13} className="text-emerald-500" />
                          <span>{property.location}, {property.city}</span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1 leading-snug">
                          {property.title}
                        </h3>

                        {/* Description snippet */}
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                          {property.description}
                        </p>

                        {/* Facilities subset tags */}
                        {property.facilities && property.facilities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {property.facilities.slice(0, 3).map((f) => (
                              <span key={f} className="text-[9px] font-bold bg-gray-50 border border-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                                {f}
                              </span>
                            ))}
                            {property.facilities.length > 3 && (
                              <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50/50 px-1 py-0.5 rounded-md">
                                +{property.facilities.length - 3} amenities
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer actions */}
                      <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-500">
                          {property.bedrooms} Bed &bull; {property.bathrooms} Bath
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          {/* Saved tag for logged in tenants */}
                          {user && user.role === 'Tenant' && fav && (
                            <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-0.5 bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
                              <BookmarkCheck size={12} /> Saved
                            </span>
                          )}
                          <Link 
                            to={`/properties/${property._id}`}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
                          >
                            Explore Room
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
