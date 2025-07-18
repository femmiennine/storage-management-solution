import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className = '', showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/storease.png"
        alt="Storease Logo"
        width={40}
        height={40}
        className="object-contain"
        priority
      />
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-primary">
            Storease
          </span>
          <span className="text-xs text-muted-foreground -mt-1">
            Storage Manager
          </span>
        </div>
      )}
    </div>
  );
}