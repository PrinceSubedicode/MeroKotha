import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { MapPin, Key, Settings, HelpCircle, ShieldAlert } from 'lucide-react';

export const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  import.meta.env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  window.GOOGLE_MAPS_PLATFORM_KEY ||
  '';

export const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim() !== '';

export default function MapIntegrationWrapper({ children, fallbackHeight = '400px' }) {
  if (!hasValidKey) {
    return (
      <div 
        className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-dashed border-gray-200 text-center" 
        style={{ minHeight: fallbackHeight }}
        id="maps-api-key-splash"
      >
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full mb-4 animate-bounce">
          <MapPin size={32} />
        </div>
        
        <h3 className="text-lg font-bold text-[#0d233e] flex items-center gap-2 justify-center">
          <ShieldAlert size={20} className="text-amber-500" /> Google Maps API Key Required
        </h3>
        
        <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
          To see active rentals plotted on the map or select room coordinates, you need a Google Maps Platform API key.
        </p>

        <div className="mt-6 bg-white border border-gray-100 rounded-xl p-5 text-left text-xs max-w-md w-full shadow-xs">
          <p className="font-bold text-gray-700 mb-3 flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <Settings size={14} className="text-emerald-600" /> Follow these simple steps:
          </p>
          <ol className="space-y-3 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="flex items-center justify-center bg-emerald-50 text-emerald-700 font-bold h-5 w-5 rounded-full text-[10px] shrink-0 mt-0.5">1</span>
              <span>
                <a 
                  href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline font-bold"
                >
                  Get an API Key
                </a> from Google Cloud Console.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex items-center justify-center bg-emerald-50 text-emerald-700 font-bold h-5 w-5 rounded-full text-[10px] shrink-0 mt-0.5">2</span>
              <span>
                Open <strong>Settings</strong> (⚙️ gear icon in the <strong>top-right corner</strong> of this page).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex items-center justify-center bg-emerald-50 text-emerald-700 font-bold h-5 w-5 rounded-full text-[10px] shrink-0 mt-0.5">3</span>
              <span>
                Select <strong>Secrets</strong>, type <code>GOOGLE_MAPS_PLATFORM_KEY</code> as name, and press <strong>Enter</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex items-center justify-center bg-emerald-50 text-emerald-700 font-bold h-5 w-5 rounded-full text-[10px] shrink-0 mt-0.5">4</span>
              <span>
                Paste your API key value and press <strong>Enter</strong>.
              </span>
            </li>
          </ol>
        </div>

        <div className="mt-4 flex items-center gap-1 text-[10px] text-gray-400 font-semibold bg-gray-100/50 py-1 px-2.5 rounded-md">
          <Key size={10} /> The sandbox application compiles automatically upon secret updates.
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      {children}
    </APIProvider>
  );
}
