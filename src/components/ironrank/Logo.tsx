import { useId } from "react";

interface LogoProps {
  size?: number;
  className?: string;
  monogram?: boolean;
}

export function Logo({ size = 32, className, monogram = false }: LogoProps) {
  const reactId = useId();
  const uid = reactId.replace(/:/g, "");
  if (monogram) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="IronRank"
      >
        <defs>
          <linearGradient id={`mono-grad-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5BFFE0" />
            <stop offset="50%" stopColor="#00FFD1" />
            <stop offset="100%" stopColor="#00B5A0" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="36" height="36" rx="6" fill="#0A0A0F" />
        <rect
          x="2"
          y="2"
          width="36"
          height="36"
          rx="6"
          fill="none"
          stroke={`url(#mono-grad-${uid})`}
          strokeWidth="1.5"
        />
        <text
          x="20"
          y="26.5"
          textAnchor="middle"
          fontFamily="Anton, sans-serif"
          fontSize="18"
          fontWeight="700"
          letterSpacing="0.5"
          fill="#5BFFE0"
        >
          IR
        </text>
        <rect x="2" y="34" width="36" height="3" rx="0" fill={`url(#mono-grad-${uid})`} />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size * 0.42}
      viewBox="0 0 90 38"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="IronRank"
    >
      <defs>
        <linearGradient id={`logo-bar-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5BFFE0" />
          <stop offset="50%" stopColor="#00FFD1" />
          <stop offset="100%" stopColor="#00B5A0" />
        </linearGradient>
      </defs>
      {/* Glifo angular tipo "I+R" */}
      <g>
        {/* I izquierda (vertical angular) */}
        <path
          d="M 6 4 L 18 4 L 18 8 L 14 8 L 14 30 L 18 30 L 18 34 L 6 34 L 6 30 L 10 30 L 10 8 L 6 8 Z"
          fill={`url(#logo-bar-${uid})`}
        />
        {/* R derecha (loop + pierna angular) */}
        <path
          d="M 28 4 L 50 4 L 50 18 L 44 18 L 50 34 L 44 34 L 38 19 L 34 19 L 34 34 L 28 34 Z M 34 8 L 34 15 L 44 15 L 44 8 Z"
          fill={`url(#logo-bar-${uid})`}
        />
      </g>
      {/* Underline con tick marks (HUD style) */}
      <g stroke={`url(#logo-bar-${uid})`} strokeWidth="1">
        <line x1="2" y1="36" x2="54" y2="36" opacity="0.7" />
        <line x1="56" y1="36" x2="60" y2="36" strokeWidth="1.6" />
        <line x1="62" y1="36" x2="66" y2="36" strokeWidth="1.6" />
        <line x1="68" y1="36" x2="88" y2="36" opacity="0.7" />
      </g>
    </svg>
  );
}
