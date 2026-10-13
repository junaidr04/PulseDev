import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { RoleThemeConfig } from '../../theme/roleTheme';

/**
 * Animated number count-up hook with cubic-out easing and prefers-reduced-motion support.
 */
export function useCountUp(target: number, duration = 650): number {
  const prefersReducedMotion = useReducedMotion();
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (prefersReducedMotion) {
      setValue(target);
      return;
    }

    const startTime = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration, prefersReducedMotion]);

  return value;
}

/**
 * Animated SVG Radial Gauge with smooth stroke-dashoffset animation.
 */
export const AnimatedRadialGauge: React.FC<{
  value: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  secondaryColor?: string;
  label?: string;
  sublabel?: string;
}> = ({
  value,
  size = 76,
  strokeWidth = 6,
  color,
  secondaryColor,
  label,
  sublabel,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, value));
  const animatedVal = useCountUp(clamped, 700);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;
  const gradId = React.useId();

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 overflow-visible">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={secondaryColor || color} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: prefersReducedMotion ? dashOffset : circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.85, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-xs font-bold text-white tabular-nums leading-none">
          {label ?? `${animatedVal}%`}
        </span>
        {sublabel && (
          <span className="mt-0.5 text-[9px] font-mono text-neutral-400 leading-none">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Animated SVG Sparkline with draw-in path animation and soft area gradient.
 */
export const AnimatedSparkline: React.FC<{
  points: number[];
  color: string;
  width?: number;
  height?: number;
  className?: string;
}> = ({ points, color, width = 120, height = 32, className = '' }) => {
  const prefersReducedMotion = useReducedMotion();
  const gradId = React.useId();

  if (!points || points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pad = 3;

  const coords = points.map((pt, i) => {
    const x = (i / (points.length - 1)) * (width - pad * 2) + pad;
    const y = height - pad - ((pt - min) / range) * (height - pad * 2);
    return { x, y };
  });

  const linePath = coords
    .map((c, idx) => `${idx === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${height} L${coords[0].x.toFixed(1)},${height} Z`;
  const last = coords[coords.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible flex-shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: prefersReducedMotion ? 1 : 0, opacity: 0.4 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.9, ease: 'easeOut' }}
      />
      <circle cx={last.x} cy={last.y} r="2.5" fill={color} />
    </svg>
  );
};

/**
 * Hero Card Wrapper with rotating conic-gradient border + top role-colored glow bar.
 */
export const HeroConicFrame: React.FC<{
  theme: RoleThemeConfig;
  children: React.ReactNode;
  className?: string;
}> = ({ theme, children, className = '' }) => {
  return (
    <div
      className={`role-hero-conic relative rounded-2xl p-[1px] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.75)] ${className}`}
      style={
        {
          '--hero-accent': theme.accentHex,
          '--hero-accent-secondary': theme.accentSecondaryHex,
          '--hero-accent-rgb': theme.accentRgb,
        } as React.CSSProperties
      }
    >
      {/* Top 2px intense role-colored glow strip */}
      <div
        className="absolute top-0 left-0 right-0 z-20 h-[2px]"
        style={{ backgroundImage: theme.gradientCss }}
      />
      {/* Subtle top radial spotlight */}
      <div
        className="pointer-events-none absolute -top-24 left-1/4 z-0 h-48 w-96 rounded-full blur-3xl opacity-25"
        style={{ backgroundColor: theme.accentHex }}
      />
      <div className="relative z-10 rounded-[15px] bg-[#0c0f17]/95 backdrop-blur-xl p-5 sm:p-6">
        {children}
      </div>
    </div>
  );
};

/**
 * Staggered Dashboard Container (60ms stagger, opacity 0->1, y 16->0)
 */
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: prefersReducedMotion ? 0 : 0.06,
            delayChildren: prefersReducedMotion ? 0 : 0.04,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.34, ease: [0.16, 1, 0.3, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Interactive Card with 2px hover lift and role-tinted glow.
 */
export const RoleSurfaceCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`role-lift-card rounded-2xl border border-white/[0.07] bg-[#0e1118]/90 p-5 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export { FlowButton } from './FlowButton';

