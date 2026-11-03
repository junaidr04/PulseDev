import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface FlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  variant?: 'accent' | 'primary' | 'secondary' | 'glass' | 'white' | 'dark' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  accentColor?: string;
  circleColor?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export const FlowButton: React.FC<FlowButtonProps> = ({
  text,
  children,
  variant = 'secondary',
  size = 'md',
  accentColor,
  icon: Icon,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...rest
}) => {
  const sizeClass = {
    sm: 'min-h-8 px-3 py-1.5 text-xs',
    md: 'min-h-9 px-4 py-2 text-sm',
    lg: 'min-h-10 px-5 py-2.5 text-sm',
  }[size];
  const variantClass = {
    accent: 'border-transparent bg-emerald-300 text-[#11151b] hover:bg-emerald-200',
    primary: 'border-white/15 bg-white/10 text-white hover:bg-white/15',
    white: 'border-white/15 bg-white/10 text-white hover:bg-white/15',
    secondary: 'border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.08]',
    glass: 'border-white/10 bg-white/[0.03] text-neutral-200 hover:bg-white/[0.08]',
    dark: 'border-white/10 bg-transparent text-neutral-300 hover:bg-white/[0.05]',
    danger: 'border-rose-500/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15',
  }[variant];

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={variant === 'accent' && accentColor ? { backgroundColor: accentColor } : undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${sizeClass} ${variantClass} ${className}`}
      {...rest}
    >
      {children || text || 'Action'}
      {Icon && <Icon aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" />}
    </button>
  );
};

export default FlowButton;
