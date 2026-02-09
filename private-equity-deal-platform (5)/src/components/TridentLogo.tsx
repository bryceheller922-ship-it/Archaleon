export function TridentLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Center prong */}
      <path d="M32 4L32 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 4L28 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 4L36 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Left prong */}
      <path d="M18 10L22 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 10L14 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 10L22 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Right prong */}
      <path d="M46 10L42 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M46 10L50 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M46 10L42 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Cross guard */}
      <path d="M18 28C18 28 25 32 32 28C39 32 46 28 46 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Handle */}
      <path d="M32 28L32 54" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      
      {/* Handle grip details */}
      <path d="M28 38H36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M29 43H35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Pommel */}
      <circle cx="32" cy="57" r="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <circle cx="32" cy="57" r="1.5" fill="currentColor" />
    </svg>
  );
}
