import React from 'react';
import { ArrowPosition } from '../../services/navigationMapper/NavigationActionRegistry';

interface GuidedArrowProps {
  targetRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  position: ArrowPosition;
}

export const GuidedArrow: React.FC<GuidedArrowProps> = ({ targetRect, position }) => {
  // Compute center point of the target
  const centerX = targetRect.left + targetRect.width / 2;
  const centerY = targetRect.top + targetRect.height / 2;

  let arrowStyle: React.CSSProperties = {};
  let svgRotation = 0;
  let bounceClass = '';

  switch (position) {
    case 'bottom':
      // Arrow placed ABOVE the element, pointing DOWN toward it
      arrowStyle = {
        top: `${Math.max(10, targetRect.top - 58)}px`,
        left: `${centerX - 24}px`,
      };
      svgRotation = 180; // points downwards
      bounceClass = 'animate-bounce';
      break;

    case 'top':
      // Arrow placed BELOW the element, pointing UP toward it
      arrowStyle = {
        top: `${targetRect.top + targetRect.height + 10}px`,
        left: `${centerX - 24}px`,
      };
      svgRotation = 0; // points upwards
      bounceClass = 'animate-bounce';
      break;

    case 'right':
      // Arrow placed to the LEFT of the element, pointing RIGHT toward it
      arrowStyle = {
        top: `${centerY - 24}px`,
        left: `${Math.max(10, targetRect.left - 58)}px`,
      };
      svgRotation = 90; // points rightwards
      bounceClass = 'animate-pulse';
      break;

    case 'left':
    default:
      // Arrow placed to the RIGHT of the element, pointing LEFT toward it
      arrowStyle = {
        top: `${centerY - 24}px`,
        left: `${targetRect.left + targetRect.width + 10}px`,
      };
      svgRotation = 270; // points leftwards
      bounceClass = 'animate-pulse';
      break;
  }

  return (
    <div
      className={`fixed z-50 pointer-events-none transition-all duration-200 ${bounceClass}`}
      style={arrowStyle}
      aria-hidden="true"
    >
      <div
        className="w-12 h-12 flex items-center justify-center filter drop-shadow-[0_4px_12px_rgba(16,185,129,0.7)]"
        style={{ transform: `rotate(${svgRotation}deg)` }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="w-10 h-10 text-emerald-400"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Glowing Arrow Body */}
          <path
            d="M24 6L8 22H18V42H30V22H40L24 6Z"
            fill="url(#arrow-gradient)"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="arrow-gradient" x1="24" y1="6" x2="24" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34d399" />
              <stop offset="1" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};
