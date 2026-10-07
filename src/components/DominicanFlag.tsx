import React from "react";

interface DominicanFlagProps {
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Official minimalist SVG flag of the Dominican Republic
 * 4 quadrants (Blue/Red/Red/Blue) with central white cross
 */
export function DominicanFlag({ className = "w-4 h-3 inline-block rounded-sm overflow-hidden", width = 16, height = 12 }: DominicanFlagProps) {
  return (
    <svg
      viewBox="0 0 16 12"
      width={width}
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Bandera de la República Dominicana"
    >
      {/* Top Left: Blue */}
      <rect x="0" y="0" width="7" height="5" fill="#002F6C" />
      {/* Top Right: Red */}
      <rect x="9" y="0" width="7" height="5" fill="#CE1126" />
      {/* Bottom Left: Red */}
      <rect x="0" y="7" width="7" height="5" fill="#CE1126" />
      {/* Bottom Right: Blue */}
      <rect x="9" y="7" width="7" height="5" fill="#002F6C" />
      {/* Central White Cross */}
      <path d="M 0 5 H 16 V 7 H 0 Z M 7 0 V 12 H 9 V 0 Z" fill="#FFFFFF" />
    </svg>
  );
}
