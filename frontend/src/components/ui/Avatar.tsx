import React from 'react';

interface AvatarProps {
  name: string;
  className: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, className }) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      aria-label={name}
      title={name}
      className={`inline-flex flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] font-medium text-neutral-200 ${className}`}
    >
      {initials}
    </span>
  );
};

export default Avatar;
