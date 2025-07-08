import React from 'react';

const YCM360Logo = () => {
  return (
    <div className="flex items-center justify-center" style={{ padding: 0 }}>
      <div className="flex items-center space-x-1">
        {/* Circular logo part */}
        <div className="relative">
          {/* Outer circle with gap */}
          <div className="w-[22px] h-[22px] relative flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 80 80" className="absolute">
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="#38b2ac"
                strokeWidth="5.28"
                strokeDasharray="224.48, 11.52"
                strokeDashoffset="5.76"
                transform="rotate(45 40 40)"
              />
            </svg>
            {/* Inner dot */}
            <div className="w-[6px] h-[6px] rounded-full bg-[#38b2ac] z-10 relative left-[3px]"></div>
          </div>
        </div>
        {/* Text part */}
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38b2ac', letterSpacing: '0.01em', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
          YCM360
        </div>
      </div>
    </div>
  );
};

export default YCM360Logo; 