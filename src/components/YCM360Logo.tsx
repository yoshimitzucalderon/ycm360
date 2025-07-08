import React from 'react';

const YCM360Logo = () => {
  return (
    <div className="flex items-center justify-center" style={{ padding: '8px 0' }}>
      <div className="flex items-center space-x-2">
        {/* Circular logo part */}
        <div className="relative">
          {/* Outer circle with gap */}
          <div className="w-8 h-8 relative flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 80 80" className="absolute">
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="#0d9488"
                strokeWidth="5.28"
                strokeDasharray="224.48, 11.52"
                strokeDashoffset="5.76"
                transform="rotate(45 40 40)"
              />
            </svg>
            {/* Inner dot */}
            <div className="w-2 h-2 rounded-full bg-teal-600 z-10 relative left-1"></div>
          </div>
        </div>
        {/* Text part */}
        <div className="text-lg font-semibold text-teal-600 tracking-wide" style={{ letterSpacing: '0.04em' }}>
          YCM360
        </div>
      </div>
    </div>
  );
};

export default YCM360Logo; 