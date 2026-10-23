import React from 'react';

interface PixelAppLogoProps {
  size?: number;
  className?: string;
}

export const PixelAppLogo: React.FC<PixelAppLogoProps> = ({
  size = 36,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 rounded-xl bg-[#e53935] text-white select-none shadow-sm transition-transform hover:scale-105 ${className}`}
      style={{
        width: size,
        height: size,
        lineHeight: 1,
      }}
      title="Kana Pro - 私 (Watashi)"
    >
      <span
        className="font-bold leading-none select-none text-white"
        style={{
          fontSize: `${Math.round(size * 0.62)}px`,
          fontFamily:
            '"Yu Gothic UI", "Hiragino Sans", "Meiryo", "Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          marginTop: '-1px',
        }}
      >
        私
      </span>
    </div>
  );
};
