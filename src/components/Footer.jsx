import React from 'react';
import { Link } from 'react-router-dom';
import MeroKothaLogo from './MeroKothaLogo.jsx';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-150 bg-[#ebd9c1]/25 text-gray-700" id="merokotha-footer">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Info and Brand */}
          <div className="flex flex-col gap-4">
            <Link to="/">
              <MeroKothaLogo iconSize={32} textClass="text-base" />
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed">
              MeroKotha is Nepal's trusted room, flat, and house rental platform. We connect prospective tenants directly with verified landlords and room owners across all 7 provinces of Nepal.
            </p>
          </div>

          {/* Column 2: Easy Links */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/properties" className="hover:text-emerald-700 transition-colors">Find Rooms & Apartments</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-emerald-700 transition-colors">List Your Property</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-emerald-700 transition-colors">Help & Contact support</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-700 transition-colors">LogIn Account</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Top Cities Directory */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Locations in Nepal</h3>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li>
                <Link to="/properties?search=Kathmandu" className="hover:text-emerald-700 transition-colors">Rooms for rent in Kathmandu</Link>
              </li>
              <li>
                <Link to="/properties?search=Pokhara" className="hover:text-emerald-700 transition-colors">Flats for rent in Pokhara</Link>
              </li>
              <li>
                <Link to="/properties?search=Lalitpur" className="hover:text-emerald-700 transition-colors">Apartments in Lalitpur</Link>
              </li>
              <li>
                <Link to="/properties?search=Butwal" className="hover:text-emerald-700 transition-colors">Rooms for rent in Butwal</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact details */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Support Channels</h3>
            <ul className="space-y-3.5 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>New Baneshwor, Kathmandu, Nepal</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-emerald-600 shrink-0" />
                <span>+977 1-4200000 / 9801234567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-emerald-600 shrink-0" />
                <span>support@merokotha.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright segment */}
        <div className="border-t border-gray-200 mt-12 pt-6 flex items-center justify-center text-center">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} MeroKotha Nepal. All Rights Reserved. Only verified rentals shown.
          </p>
        </div>
      </div>
    </footer>
  );
}
