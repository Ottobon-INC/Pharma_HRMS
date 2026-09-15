import React from 'react';

interface SmsLogoProps {
 className?: string;
 iconOnly?: boolean;
 textSize?: string;
 diagnosticsColor?: string;
 subtitle?: boolean;
 onClick?: () => void;
}

export default function SmsLogo({ 
 className ="", 
 onClick
}: SmsLogoProps) {
 return (
  <div className={`flex items-center select-none ${className}`} onClick={onClick}>
    <img 
     src="/logo.png"
     alt="Orca Labs"
     className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto object-contain drop-shadow-sm"
    />
  </div>
 );
}
