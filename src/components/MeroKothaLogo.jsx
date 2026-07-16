import React from 'react';

/**
 * MeroKotha Brand Logo Icon component rendering the dual-outline house
 * with teal and navy blue lines and the 2x2 grid window.
 */
export function MeroKothaIcon({ className = "h-10 w-10", size = 40 }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer House Frame (Orange) */}
      <path 
        d="M48 85H20C17.7909 85 16 83.2091 16 81V46.5C16 45.4745 16.3934 44.4883 17.1 43.75L50 14.5L82.9 43.75C83.6066 44.4883 84 45.4745 84 46.5V81C84 83.2091 82.2091 85 80 85H72" 
        stroke="#ea580c" 
        strokeWidth="6.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />

      {/* Inner House Frame (Charcoal - adapts in dark mode to stay dark) */}
      <path 
        d="M28 85V54.5L50 34.5L72 54.5V81C72 83.2091 70.2091 85 68 85" 
        stroke="currentColor" 
        strokeWidth="6.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="text-gray-800 dark:text-gray-800"
      />

      {/* 2x2 Window Grid (Orange) */}
      {/* Top-Left Quadrant */}
      <rect x="42.5" y="59" width="6.5" height="6.5" rx="1" fill="#ea580c" />
      {/* Top-Right Quadrant */}
      <rect x="51" y="59" width="6.5" height="6.5" rx="1" fill="#ea580c" />
      {/* Bottom-Left Quadrant */}
      <rect x="42.5" y="67.5" width="6.5" height="6.5" rx="1" fill="#ea580c" />
      {/* Bottom-Right Quadrant */}
      <rect x="51" y="67.5" width="6.5" height="6.5" rx="1" fill="#ea580c" />
    </svg>
  );
}

/**
 * Standard inline Logo containing both the custom house icon and fully styled typography
 */
export default function MeroKothaLogo({ iconSize = 36, textClass = "text-xl", className = "flex items-center gap-2" }) {
  return (
    <div className={className} id="merokotha-inline-logo">
      <MeroKothaIcon size={iconSize} className="shrink-0" />
      <span className={`${textClass} tracking-tight font-sans`}>
        <span className="font-light text-gray-800 dark:text-gray-800">Mero</span>
        <span className="font-extrabold text-gray-900 dark:text-gray-900">Kotha</span>
      </span>
    </div>
  );
}
