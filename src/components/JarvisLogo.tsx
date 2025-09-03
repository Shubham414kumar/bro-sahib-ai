import React from 'react';

interface JarvisLogoProps {
  className?: string;
  size?: number;
}

export const JarvisLogo: React.FC<JarvisLogoProps> = ({ className = '', size = 40 }) => {
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-pulse"
      >
        {/* Outer circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="url(#gradient1)"
          strokeWidth="2"
          fill="none"
          opacity="0.8"
        />
        
        {/* Middle circle */}
        <circle
          cx="50"
          cy="50"
          r="35"
          stroke="url(#gradient2)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
        
        {/* Inner circle */}
        <circle
          cx="50"
          cy="50"
          r="25"
          stroke="url(#gradient3)"
          strokeWidth="1"
          fill="none"
          opacity="0.4"
        />
        
        {/* Center J letter */}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fill="url(#gradient4)"
          fontSize="36"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
        >
          J
        </text>
        
        {/* Animated rings */}
        <circle
          cx="50"
          cy="50"
          r="30"
          stroke="url(#gradient5)"
          strokeWidth="0.5"
          fill="none"
          opacity="0.3"
          className="animate-ping"
        />
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ffff" />
            <stop offset="100%" stopColor="#0080ff" />
          </linearGradient>
          
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0080ff" />
            <stop offset="100%" stopColor="#00ffff" />
          </linearGradient>
          
          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ffff" />
            <stop offset="100%" stopColor="#00ff80" />
          </linearGradient>
          
          <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ffff" />
            <stop offset="50%" stopColor="#0080ff" />
            <stop offset="100%" stopColor="#00ff80" />
          </linearGradient>
          
          <linearGradient id="gradient5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ffff" />
            <stop offset="100%" stopColor="#0080ff" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};