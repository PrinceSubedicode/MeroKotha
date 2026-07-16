import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, Phone, MapPin, Send, HelpCircle, CheckCircle, Smartphone, Lock } from 'lucide-react';

export default function Contact() {
  const { user } = useAuth();
  const [name, setName] = useState(user ? user.name || '' : '');
  const [email, setEmail] = useState(user ? user.email || '' : '');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (!user) return;
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  const faqs = [
    {
      q: 'Is there a broker fee to find rooms?',
      a: 'Absolutely not! MeroKotha is fully zero-brokerage. You connect directly with registered property owners without paying commissions or middleman margins.'
    },
    {
      q: 'How does MeroKotha verify landlords and properties?',
      a: 'We inspect owner metadata, contact telephone ranges, citizenship verification files, and listing profiles. Ads submitted must receive manual verification review by an admin before they display publicly.'
    },
    {
      q: 'Can I list my student room for free or is there a charge?',
      a: 'Listing standard properties range (Rooms, Flats, Houses) on MeroKotha is 100% free of charge.'
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex-1" id="contact-feedback-page">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Contact support desk</h1>
        <p className="text-sm text-gray-500 mt-1">
          Have troubles finding rooms or verifying listings? Our customer response team is available 24/7.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Contact info channels */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-6">
            <h3 className="font-extrabold text-gray-900 text-lg">Direct Lines</h3>
            
            <ul className="space-y-5 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <MapPin className="text-emerald-500 mt-0.5 shrink-0" size={18} />
                <div>
                  <h4 className="font-bold text-gray-800">Platform Headquarters</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Ground floor, Kotha Heights, New Baneshwor, Kathmandu, Nepal</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <Phone className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="font-bold text-gray-800">Telephone Lines</h4>
                  <p className="text-xs text-gray-500 mt-0.5">+977 1-4200000 / +977 9801234567</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <Mail className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="font-bold text-gray-800">Support Mailboxes</h4>
                  <p className="text-xs text-gray-500 mt-0.5">support@merokotha.com</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Download APK callouts - looks highly professional */}
          <div className="bg-white border border-gray-150 text-gray-800 rounded-2xl p-6 shadow-xs relative overflow-hidden">
            <Smartphone size={32} className="text-emerald-600 mb-3" />
            <h4 className="font-bold text-sm text-gray-950">Download MeroKotha APP</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
              Coming soon on Google Play Store! Stay tuned for real-time mobile push notes on rent matches near you.
            </p>
          </div>
        </div>

        {/* Feedback message card / FAQs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Write us message */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-xs">
            <h3 className="font-extrabold text-gray-900 text-lg mb-6">Send feedback</h3>
            
            {!user ? (
              <div className="bg-amber-50/50 border border-amber-200/60 p-8 rounded-2xl text-center space-y-4">
                <div className="inline-flex p-3 bg-amber-105 bg-amber-100 text-amber-700 rounded-full">
                  <Lock size={28} />
                </div>
                <h4 className="font-extrabold text-gray-800 text-base">Authentication Required</h4>
                <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
                  You must be logged in to send feedback or contact our support team directly. Please log in or create a free account to proceed.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <Link 
                    to="/login"
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-xs transition-all"
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/register"
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-xl transition-all border border-gray-200"
                  >
                    Register
                  </Link>
                </div>
              </div>
            ) : submitted ? (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-6 rounded-2xl text-center space-y-2">
                <CheckCircle size={36} className="text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-sm">Message received!</h4>
                <p className="text-xs text-emerald-700/80 leading-relaxed max-w-sm mx-auto">
                  Hi <strong>{name}</strong>, thank you for writing to MeroKotha support. One of our community coordinators will respond to <strong>{email}</strong> within 12 hours.
                </p>
                <button 
                  onClick={() => {
                    setSubmitted(false);
                    setName(user ? user.name || '' : '');
                    setEmail(user ? user.email || '' : '');
                    setMessage('');
                  }}
                  className="mt-3 text-xs bg-emerald-600 text-white py-1.5 px-4 rounded-lg font-bold"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">My Full Name</label>
                    <input 
                      type="text"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 rounded text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                      required
                      placeholder="e.g. Rohan Adhikari"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">My Email Address</label>
                    <input 
                      type="email"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 rounded text-xs font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
                      required
                      placeholder="name@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Write Your Request Message</label>
                  <textarea
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 rounded text-xs font-medium focus:border-emerald-500 focus:bg-white focus:outline-none"
                    required
                    placeholder="Details about your inquiry, reporting a fake listing, or partnership proposal..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 py-3 rounded-xl text-xs font-bold text-white transition-colors"
                >
                  <Send size={14} /> Send Feedback Mailbox
                </button>
              </form>
            )}
          </div>

          {/* Quick FAQ accordion panel */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
            <h3 className="font-extrabold text-gray-900 hover:text-emerald-600 text-base mb-4 flex items-center gap-1.5">
              <HelpCircle size={18} className="text-emerald-550" /> Frequently Asked Questions
            </h3>
            
            <div className="space-y-4">
              {faqs.map((f, i) => (
                <div key={i} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <h4 className="text-sm font-bold text-gray-800">{f.q}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed mt-1">{f.a}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
