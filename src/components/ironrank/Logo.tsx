interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="IronRank logo"
    >
      <defs>
        <linearGradient id="logo-bar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFB36B" />
          <stop offset="50%" stopColor="#FF7A1A" />
          <stop offset="100%" stopColor="#C24900" />
        </linearGradient>
        <linearGradient id="logo-glow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFB36B" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FFB36B" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="20" cy="20" r="18" fill="url(#logo-glow)" opacity="0.4" />

      <rect x="3" y="18" width="34" height="4" rx="1" fill="url(#logo-bar)" />
      <rect x="3" y="12" width="34" height="2" rx="0.5" fill="url(#logo-bar)" opacity="0.7" />
      <rect x="3" y="26" width="34" height="2" rx="0.5" fill="url(#logo-bar)" opacity="0.7" />

      <rect x="6" y="22" width="6" height="12" rx="1" fill="url(#logo-bar)" />
      <rect x="28" y="22" width="6" height="12" rx="1" fill="url(#logo-bar)" />

      <g transform="translate(20 6)">
        <path
          d="M -5 0 L -3.5 -3 L -1.5 -3 L 0 -5 L 1.5 -3 L 3.5 -3 L 5 0 L 3.5 2 L 0 4 L -3.5 2 Z"
          fill="#FFD700"
          stroke="#B8860B"
          strokeWidth="0.5"
        />
        <circle cx="0" cy="0" r="1" fill="#FFF" />
      </g>
    </svg>
  );
}
