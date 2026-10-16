import React, { useState } from 'react';

interface UserAvatarProps {
  src?: string;
  name: string;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ src, name, className = '' }) => {
  const [error, setError] = useState(!src);

  // Extract initials
  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  if (error || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-[#0A1428] text-[#FFC20E] font-display font-bold border border-[#FFC20E]/40 select-none ${className}`}
        title={name}
      >
        <span>{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className={`object-cover ${className}`}
    />
  );
};
