import React from 'react';
import { ArrowRight, LucideIcon } from 'lucide-react';

export interface FlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  variant?: 'accent' | 'primary' | 'secondary' | 'glass' | 'white' | 'dark' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  accentColor?: string;
  circleColor?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

/**
 * FlowButton: Pill-to-rounded-rectangle morphing button with expanding circle
 * and dual sliding arrows (arr-2 entering from left, arr-1 exiting to right).
 * 
 * Supports role accent tinting and dark-workspace contrast while strictly preserving
 * the requested cubic-bezier timing and geometry.
 */
export const FlowButton: React.FC<FlowButtonProps> = ({
  text,
  children,
  variant = 'secondary',
  size = 'md',
  accentColor,
  circleColor,
  icon: IconComponent = ArrowRight,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...rest
}) => {
  const content = text || children || 'Action';

  // Sizing tokens
  const sizeStyles = {
    sm: {
      btn: 'px-5 py-1.5 text-xs min-h-[34px]',
      arrowLeft: 'group-hover:left-3',
      arrowRight: 'right-3',
      arrowSize: 'w-3.5 h-3.5',
      circleSize: 'group-hover:w-[200px] group-hover:h-[200px]',
      textShift: '-translate-x-2 group-hover:translate-x-2',
    },
    md: {
      btn: 'px-7 py-2.5 text-xs sm:text-sm min-h-[40px]',
      arrowLeft: 'group-hover:left-3.5',
      arrowRight: 'right-3.5',
      arrowSize: 'w-4 h-4',
      circleSize: 'group-hover:w-[240px] group-hover:h-[240px]',
      textShift: '-translate-x-3 group-hover:translate-x-3',
    },
    lg: {
      btn: 'px-8 py-3 text-sm min-h-[46px]',
      arrowLeft: 'group-hover:left-4',
      arrowRight: 'right-4',
      arrowSize: 'w-4 h-4',
      circleSize: 'group-hover:w-[280px] group-hover:h-[280px]',
      textShift: '-translate-x-3.5 group-hover:translate-x-3.5',
    },
  }[size];

  // Variant-specific base & hover styling
  let borderStyle = 'border-white/[0.14]';
  let textBaseStyle = 'text-neutral-200';
  let textHoverStyle = 'group-hover:text-white';
  let arrowBaseStroke = 'stroke-neutral-400';
  let arrowHoverStroke = 'group-hover:stroke-white';
  let defaultCircleBg = '#1c2230';
  let bgBase = 'bg-white/[0.03]';

  if (variant === 'accent') {
    borderStyle = 'border-emerald-500/40';
    textBaseStyle = 'text-white font-semibold';
    textHoverStyle = 'group-hover:text-[#090b10]';
    arrowBaseStroke = 'stroke-emerald-300';
    arrowHoverStroke = 'group-hover:stroke-[#090b10]';
    defaultCircleBg = accentColor || 'var(--role-accent, #10B981)';
    bgBase = 'bg-white/[0.05]';
  } else if (variant === 'primary' || variant === 'white') {
    borderStyle = 'border-white/30';
    textBaseStyle = 'text-white font-semibold';
    textHoverStyle = 'group-hover:text-[#090b10]';
    arrowBaseStroke = 'stroke-white';
    arrowHoverStroke = 'group-hover:stroke-[#090b10]';
    defaultCircleBg = '#ffffff';
    bgBase = 'bg-white/[0.08]';
  } else if (variant === 'danger') {
    borderStyle = 'border-rose-500/40';
    textBaseStyle = 'text-rose-200';
    textHoverStyle = 'group-hover:text-white';
    arrowBaseStroke = 'stroke-rose-400';
    arrowHoverStroke = 'group-hover:stroke-white';
    defaultCircleBg = '#e11d48';
    bgBase = 'bg-rose-500/10';
  } else if (variant === 'dark') {
    borderStyle = 'border-[#333333]/40';
    textBaseStyle = 'text-neutral-300';
    textHoverStyle = 'group-hover:text-white';
    arrowBaseStroke = 'stroke-neutral-400';
    arrowHoverStroke = 'group-hover:stroke-white';
    defaultCircleBg = '#111111';
    bgBase = 'bg-transparent';
  }

  const customCircleStyle = circleColor
    ? { backgroundColor: circleColor }
    : accentColor && variant === 'accent'
    ? { backgroundColor: accentColor }
    : undefined;

  const customBorderStyle = accentColor && variant === 'accent'
    ? { borderColor: `${accentColor}66` }
    : undefined;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={customBorderStyle}
      className={`group relative inline-flex items-center justify-center gap-1 overflow-hidden rounded-[100px] border-[1.5px] ${borderStyle} ${bgBase} ${sizeStyles.btn} font-semibold ${textBaseStyle} ${textHoverStyle} cursor-pointer transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-transparent hover:rounded-[12px] active:scale-[0.95] disabled:pointer-events-none disabled:opacity-40 select-none ${className}`}
      {...rest}
    >
      {/* Left arrow (arr-2): enters from left on hover */}
      <IconComponent
        className={`pointer-events-none absolute ${sizeStyles.arrowSize} left-[-25%] ${arrowBaseStroke} fill-none z-[9] ${sizeStyles.arrowLeft} ${arrowHoverStroke} transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] flex-shrink-0`}
      />

      {/* Label Text: shifts right on hover */}
      <span
        className={`relative z-[1] ${sizeStyles.textShift} transition-all duration-[800ms] ease-out whitespace-nowrap`}
      >
        {content}
      </span>

      {/* Expanding Circle Fill */}
      <span
        style={customCircleStyle}
        className={`pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-[50%] opacity-0 ${sizeStyles.circleSize} group-hover:opacity-100 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] ${
          !circleColor && (!accentColor || variant !== 'accent') ? 'bg-[#1c2230]' : ''
        }`}
      />

      {/* Right arrow (arr-1): exits to right on hover */}
      <IconComponent
        className={`pointer-events-none absolute ${sizeStyles.arrowSize} ${sizeStyles.arrowRight} ${arrowBaseStroke} fill-none z-[9] group-hover:right-[-25%] ${arrowHoverStroke} transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] flex-shrink-0`}
      />
    </button>
  );
};

export default FlowButton;
