import React, { useState, useEffect } from 'react';
import { Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef, useMap } from '@vis.gl/react-google-maps';
import { Link } from 'react-router-dom';
import { MapPin, Info, ArrowRight } from 'lucide-react';

// Marker wrapper to manage individual InfoWindows cleanly
function PropertyMarker({ property, onMarkerClick, activePropertyId }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const isOpen = activePropertyId === property._id;

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: Number(property.lat), lng: Number(property.lng) }}
        onClick={() => onMarkerClick(property._id)}
        title={property.title}
      >
        <Pin 
          background={property.propertyType === 'House' ? '#1d4ed8' : property.propertyType === 'Flat' ? '#059669' : '#d97706'} 
          glyphColor="#ffffff" 
          borderColor="#ffffff"
          scale={1.1}
        />
      </AdvancedMarker>

      {isOpen && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => onMarkerClick(null)}
          headerDisabled={true}
        >
          <div className="p-1 max-w-64 font-sans text-xs" id={`info-window-${property._id}`}>
            {property.images && property.images[0] && (
              <img 
                src={property.images[0]} 
                alt={property.title} 
                className="w-full h-24 object-cover rounded-lg mb-2 border border-gray-100"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
              <span>{property.propertyType}</span>
              <span>&bull;</span>
              <span>{property.city}</span>
            </div>
            <h4 className="font-bold text-gray-900 line-clamp-1 mb-1 leading-tight text-sm">
              {property.title}
            </h4>
            <div className="flex items-center justify-between mt-2 border-t border-gray-100 pt-2">
              <span className="font-extrabold text-gray-900 text-xs">
                Rs. {Number(property.rent).toLocaleString()}
              </span>
              <Link 
                to={`/properties/${property._id}`}
                className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5 text-[11px] hover:underline"
              >
                Explore <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

// Controller to auto-fit bounds or pan to active listings
function MapController({ properties, activePropertyId }) {
  const map = useMap();

  useEffect(() => {
    if (!map || properties.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    let hasCoords = false;

    properties.forEach(p => {
      if (p.lat && p.lng) {
        bounds.extend({ lat: Number(p.lat), lng: Number(p.lng) });
        hasCoords = true;
      }
    });

    if (hasCoords) {
      if (properties.length === 1) {
        map.setCenter({ lat: Number(properties[0].lat), lng: Number(properties[0].lng) });
        map.setZoom(14);
      } else {
        map.fitBounds(bounds, {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50
        });
      }
    }
  }, [map, properties]);

  // Handle zooming/panning to active clicked listing
  useEffect(() => {
    if (!map || !activePropertyId) return;
    const activeProp = properties.find(p => p._id === activePropertyId);
    if (activeProp && activeProp.lat && activeProp.lng) {
      map.panTo({ lat: Number(activeProp.lat), lng: Number(activeProp.lng) });
      map.setZoom(15);
    }
  }, [map, activePropertyId, properties]);

  return null;
}

export default function PropertiesMap({ properties, style = { width: '100%', height: '100%' } }) {
  const [activeId, setActiveId] = useState(null);

  const validProperties = properties.filter(p => p.lat && p.lng);

  // Default Center of Nepal / Kathmandu if no coords
  const defaultCenter = validProperties.length > 0 
    ? { lat: Number(validProperties[0].lat), lng: Number(validProperties[0].lng) }
    : { lat: 27.7172, lng: 85.3240 };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-150 h-full w-full bg-slate-50" style={style}>
      {validProperties.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-500">
          <MapPin size={32} className="text-gray-300 mb-2" />
          <p className="text-sm font-semibold">No coordinates available for these listings</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">Rooms must have physical locations tagged by owners to display on maps.</p>
        </div>
      ) : (
        <>
          <Map
            defaultCenter={defaultCenter}
            defaultZoom={12}
            mapId="MERO_KOTHA_MAP_EXPLORER"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
            gestureHandling="cooperative"
            disableDefaultUI={false}
          >
            {validProperties.map(property => (
              <PropertyMarker 
                key={property._id} 
                property={property} 
                onMarkerClick={setActiveId}
                activePropertyId={activeId}
              />
            ))}
            
            <MapController properties={validProperties} activePropertyId={activeId} />
          </Map>

          {/* Minimal Map Overlay Legend */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-gray-100 flex gap-4 text-[10px] font-bold text-gray-700 pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]"></span> Room
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span> Flat
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1d4ed8]"></span> House
            </div>
          </div>
        </>
      )}
    </div>
  );
}
