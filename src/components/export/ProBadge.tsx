import React from 'react';

export interface ProBadgeProps {
  size?: 'sm' | 'md';
}

export const ProBadge: React.FC<ProBadgeProps> = ({ size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';
  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wide rounded-md bg-amber-100 text-amber-700 ${sizeClasses}`}
      aria-label="Pro feature"
    >
      Pro
    </span>
  );
};
