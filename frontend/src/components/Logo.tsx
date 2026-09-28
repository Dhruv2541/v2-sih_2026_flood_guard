import React from 'react';

interface LogoProps {
  size?: number | string;
  className?: string;
  alt?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 32, 
  className = '',
  alt = 'FloodGuard Shield Brandmark'
}) => {
  const dimension = typeof size === 'number' ? size : parseInt(size, 10) || 32;

  return (
    <div 
      className={`inline-flex items-center justify-center flex-shrink-0 select-none ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      <img
        src="/logo.png"
        alt={alt}
        width={dimension}
        height={dimension}
        className="w-full h-full object-contain rounded-lg drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
        referrerPolicy="no-referrer"
        loading="eager"
      />
    </div>
  );
};
