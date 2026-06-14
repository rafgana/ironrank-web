import type { Tier } from "@/models/types";

export interface TierBadgeProps {
  size?: number;
  className?: string;
  showIcon?: boolean;
  glow?: boolean;
  rotated?: boolean;
}

interface TierShape {
  /** SVG path, viewBox 100x100, asymmetric polygon */
  path: string;
  /** Inner shape: small symbol (lines/segments) */
  glyph: React.ReactNode;
  /** Tier name for the aria-label */
  label: Tier;
  /** Hardcoded colors so each badge uses its own tier palette, not the global --tier */
  primary: string;
  deep: string;
  shine: string;
  /** For the inner hairline */
  hairline: string;
}

const SHAPES: Record<Tier, TierShape> = {
  /* BRONCE — pentágono asimétrico, base ancha (tier "pesado") */
  Bronce: {
    label: "Bronce",
    path: "M 50 6 L 92 32 L 80 92 L 20 92 L 8 32 Z",
    primary: "#6B7A7E",
    deep: "#2C3538",
    shine: "rgba(255,255,255,0.45)",
    hairline: "#1A1F22",
    glyph: (
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none">
        <line x1="32" y1="40" x2="68" y2="40" />
        <line x1="36" y1="55" x2="64" y2="55" />
        <line x1="42" y1="70" x2="58" y2="70" />
      </g>
    ),
  },
  /* PLATA — diamante vertical, 4 puntos asimétricos */
  Plata: {
    label: "Plata",
    path: "M 50 4 L 84 50 L 50 96 L 16 50 Z",
    primary: "#9DD4D8",
    deep: "#4A6B70",
    shine: "rgba(255,255,255,0.5)",
    hairline: "#1F2A2D",
    glyph: (
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <line x1="50" y1="28" x2="50" y2="72" />
        <line x1="32" y1="50" x2="68" y2="50" />
        <circle cx="50" cy="50" r="10" fill="currentColor" opacity="0.15" stroke="none" />
      </g>
    ),
  },
  /* ORO — rombo con corte en la parte superior (tier "ganador") */
  Oro: {
    label: "Oro",
    path: "M 50 4 L 96 38 L 78 92 L 22 92 L 4 38 Z",
    primary: "#3FE8C4",
    deep: "#1A8A75",
    shine: "rgba(255,255,255,0.55)",
    hairline: "#0F2A26",
    glyph: (
      <g stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" fill="none">
        <polygon points="50,30 65,50 50,70 35,50" />
        <line x1="50" y1="30" x2="50" y2="70" />
        <line x1="35" y1="50" x2="65" y2="50" />
      </g>
    ),
  },
  /* PLATINO — heptágono asimétrico (7 lados irregulares) */
  Platino: {
    label: "Platino",
    path: "M 50 4 L 78 14 L 96 40 L 90 76 L 64 96 L 36 96 L 10 76 L 4 40 L 22 14 Z",
    primary: "#5BFFE0",
    deep: "#1FA088",
    shine: "rgba(255,255,255,0.6)",
    hairline: "#0D2A24",
    glyph: (
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <polygon points="50,28 68,42 62,62 38,62 32,42" />
        <circle cx="50" cy="48" r="4" fill="currentColor" stroke="none" />
      </g>
    ),
  },
  /* ESMERALDA — triángulo invertido asimétrico (tier "agresivo") */
  Esmeralda: {
    label: "Esmeralda",
    path: "M 4 18 L 96 18 L 78 92 L 22 92 Z",
    primary: "#00FFB0",
    deep: "#00A06F",
    shine: "rgba(255,255,255,0.55)",
    hairline: "#073A28",
    glyph: (
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none">
        <line x1="30" y1="38" x2="70" y2="38" />
        <line x1="34" y1="50" x2="66" y2="50" />
        <line x1="42" y1="62" x2="58" y2="62" />
        <circle cx="50" cy="74" r="3" fill="currentColor" stroke="none" />
      </g>
    ),
  },
  /* DIAMANTE — polígono irregular de 5 lados con vértices desiguales */
  Diamante: {
    label: "Diamante",
    path: "M 50 2 L 96 30 L 84 84 L 16 84 L 4 30 Z",
    primary: "#9FF4FF",
    deep: "#5BB5D0",
    shine: "rgba(255,255,255,0.7)",
    hairline: "#1F3D4A",
    glyph: (
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <polygon points="50,22 78,40 72,72 28,72 22,40" />
        <line x1="50" y1="22" x2="50" y2="72" />
        <line x1="22" y1="40" x2="78" y2="40" />
        <line x1="50" y1="22" x2="22" y2="40" strokeOpacity="0.5" />
        <line x1="50" y1="22" x2="78" y2="40" strokeOpacity="0.5" />
      </g>
    ),
  },
  /* RETADOR — estrella de 6 puntas irregular (tier "jefe final") */
  Retador: {
    label: "Retador",
    path: "M 50 2 L 62 28 L 92 22 L 78 50 L 96 78 L 64 72 L 50 98 L 36 72 L 4 78 L 22 50 L 8 22 L 38 28 Z",
    primary: "#FF3DA0",
    deep: "#9D1466",
    shine: "rgba(255,255,255,0.6)",
    hairline: "#3D0A28",
    glyph: (
      <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none">
        <polygon points="50,30 60,44 76,42 66,56 72,72 50,64 28,72 34,56 24,42 40,44" />
        <circle cx="50" cy="54" r="4" fill="currentColor" stroke="none" />
      </g>
    ),
  },
};

interface TierBadgeImplProps extends TierBadgeProps {
  shape: TierShape;
}

function TierBadgeImpl({ size = 96, className, glow = true, showIcon = true, rotated = false, shape }: TierBadgeImplProps) {
  const id = `tb-${shape.label.toLowerCase()}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`Tier ${shape.label}`}
      style={rotated ? { transform: "rotate(-8deg)" } : undefined}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={shape.deep} />
          <stop offset="55%"  stopColor={shape.primary} />
          <stop offset="100%" stopColor="rgba(255,255,255,0.45)" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"  stopColor="rgba(255,255,255,0.5)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        {glow && (
          <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feFlood floodColor={shape.primary} floodOpacity="0.6" />
            <feComposite in2="b" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Outer hairline */}
      <path
        d={shape.path}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="0.6"
        transform="scale(1.05) translate(-2.5 -2.5)"
      />

      {/* Body */}
      <path
        d={shape.path}
        fill={`url(#${id}-bg)`}
        stroke={shape.hairline}
        strokeWidth="1.4"
        filter={glow ? `url(#${id}-glow)` : undefined}
      />

      {/* Top shine (only for big sizes) */}
      {size >= 60 && (
        <path
          d={shape.path}
          fill={`url(#${id}-shine)`}
          opacity="0.6"
        />
      )}

      {/* Inner highlight (hairline) */}
      <path
        d={shape.path}
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.6"
        transform="scale(0.92) translate(4 4)"
      />

      {/* Glyph */}
      {showIcon && (
        <g style={{ color: shape.hairline }}>
          {shape.glyph}
        </g>
      )}
    </svg>
  );
}

const wrap = (shape: TierShape) => (props: TierBadgeProps) => <TierBadgeImpl {...props} shape={shape} />;

export const BronceBadge    = wrap(SHAPES.Bronce);
export const PlataBadge     = wrap(SHAPES.Plata);
export const OroBadge       = wrap(SHAPES.Oro);
export const PlatinoBadge   = wrap(SHAPES.Platino);
export const EsmeraldaBadge = wrap(SHAPES.Esmeralda);
export const DiamanteBadge  = wrap(SHAPES.Diamante);
export const RetadorBadge   = wrap(SHAPES.Retador);

export const TIER_BADGES: Record<Tier, (props: TierBadgeProps) => React.JSX.Element> = {
  Bronce: BronceBadge,
  Plata: PlataBadge,
  Oro: OroBadge,
  Platino: PlatinoBadge,
  Esmeralda: EsmeraldaBadge,
  Diamante: DiamanteBadge,
  Retador: RetadorBadge,
};
