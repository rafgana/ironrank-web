import type { Tier } from "@/models/types";
import {
  Shield,
  Award,
  Trophy,
  Gem,
  Leaf,
  Sparkles,
  Crown,
} from "lucide-react";

const HEX_PATH = "M 50 3 L 92 27 L 92 73 L 50 97 L 8 73 L 8 27 Z";

export interface TierBadgeProps {
  size?: number;
  className?: string;
  showIcon?: boolean;
  glow?: boolean;
}

interface GradientDefProps {
  id: string;
  stops: { offset: string; color: string }[];
}

function GradientDef({ id, stops }: GradientDefProps) {
  return (
    <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
      {stops.map((s, i) => (
        <stop key={i} offset={s.offset} stopColor={s.color} />
      ))}
    </linearGradient>
  );
}

function ShineDef({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
      <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0" />
    </linearGradient>
  );
}

function GlowFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}

interface HexShellProps {
  size: number;
  className?: string;
  glow: boolean;
  ariaLabel: string;
  gradientId: string;
  stroke: string;
  stops: { offset: string; color: string }[];
  children?: React.ReactNode;
}

function HexShell({
  size,
  className,
  glow,
  ariaLabel,
  gradientId,
  stroke,
  stops,
  children,
}: HexShellProps) {
  const showShine = size >= 72;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <GradientDef id={gradientId} stops={stops} />
        {showShine && <ShineDef id={`${gradientId}-shine`} />}
        {glow && <GlowFilter id={`${gradientId}-glow`} />}
      </defs>
      <path
        d={HEX_PATH}
        fill={`url(#${gradientId})`}
        stroke={stroke}
        strokeWidth="2"
        filter={glow ? `url(#${gradientId}-glow)` : undefined}
      />
      {showShine && <path d={HEX_PATH} fill={`url(#${gradientId}-shine)`} />}
      {children}
    </svg>
  );
}

interface IconOverlayProps {
  Icon: typeof Shield;
  iconSize: number;
  color: string;
  bg: string;
  bgRadius: number;
}

function IconOverlay({ Icon, iconSize, color, bg, bgRadius }: IconOverlayProps) {
  return (
    <g>
      <circle cx="50" cy="50" r={bgRadius} fill={bg} />
      <foreignObject
        x={50 - iconSize / 2}
        y={50 - iconSize / 2}
        width={iconSize}
        height={iconSize}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
          }}
        >
          <Icon size={iconSize * 0.78} strokeWidth={2.5} />
        </div>
      </foreignObject>
    </g>
  );
}

export function BronceBadge(props: TierBadgeProps) {
  const { size = 96, className, glow = true, showIcon = true } = props;
  const iconSize = size * 0.42;
  return (
    <HexShell
      size={size}
      className={className}
      glow={glow}
      ariaLabel="Tier Bronce"
      gradientId="bronce-fill"
      stroke="#5C3A1E"
      stops={[
        { offset: "0%", color: "#D9924A" },
        { offset: "50%", color: "#B87333" },
        { offset: "100%", color: "#5C3A1E" },
      ]}
    >
      {showIcon && (
        <IconOverlay
          Icon={Shield}
          iconSize={iconSize}
          color="#FFE0B8"
          bg="rgba(0,0,0,0.35)"
          bgRadius={iconSize / 2 + 2}
        />
      )}
    </HexShell>
  );
}

export function PlataBadge(props: TierBadgeProps) {
  const { size = 96, className, glow = true, showIcon = true } = props;
  const iconSize = size * 0.42;
  return (
    <HexShell
      size={size}
      className={className}
      glow={glow}
      ariaLabel="Tier Plata"
      gradientId="plata-fill"
      stroke="#6E6E6E"
      stops={[
        { offset: "0%", color: "#F5F5F5" },
        { offset: "50%", color: "#C0C0C0" },
        { offset: "100%", color: "#7A7A7A" },
      ]}
    >
      {showIcon && (
        <IconOverlay
          Icon={Award}
          iconSize={iconSize}
          color="#FFFFFF"
          bg="rgba(0,0,0,0.25)"
          bgRadius={iconSize / 2 + 2}
        />
      )}
    </HexShell>
  );
}

export function OroBadge(props: TierBadgeProps) {
  const { size = 96, className, glow = true, showIcon = true } = props;
  const iconSize = size * 0.42;
  return (
    <HexShell
      size={size}
      className={className}
      glow={glow}
      ariaLabel="Tier Oro"
      gradientId="oro-fill"
      stroke="#8B7500"
      stops={[
        { offset: "0%", color: "#FFE56B" },
        { offset: "50%", color: "#FFD700" },
        { offset: "100%", color: "#A88600" },
      ]}
    >
      {showIcon && (
        <IconOverlay
          Icon={Trophy}
          iconSize={iconSize}
          color="#FFFFFF"
          bg="rgba(74,55,0,0.4)"
          bgRadius={iconSize / 2 + 2}
        />
      )}
    </HexShell>
  );
}

export function PlatinoBadge(props: TierBadgeProps) {
  const { size = 96, className, glow = true, showIcon = true } = props;
  const iconSize = size * 0.42;
  return (
    <HexShell
      size={size}
      className={className}
      glow={glow}
      ariaLabel="Tier Platino"
      gradientId="platino-fill"
      stroke="#007A8C"
      stops={[
        { offset: "0%", color: "#A8F0FA" },
        { offset: "50%", color: "#00E5FF" },
        { offset: "100%", color: "#008BA5" },
      ]}
    >
      {showIcon && (
        <IconOverlay
          Icon={Gem}
          iconSize={iconSize}
          color="#FFFFFF"
          bg="rgba(0,30,40,0.35)"
          bgRadius={iconSize / 2 + 2}
        />
      )}
    </HexShell>
  );
}

export function EsmeraldaBadge(props: TierBadgeProps) {
  const { size = 96, className, glow = true, showIcon = true } = props;
  const iconSize = size * 0.42;
  return (
    <HexShell
      size={size}
      className={className}
      glow={glow}
      ariaLabel="Tier Esmeralda"
      gradientId="esmeralda-fill"
      stroke="#024029"
      stops={[
        { offset: "0%", color: "#34D399" },
        { offset: "50%", color: "#10B981" },
        { offset: "100%", color: "#045D3F" },
      ]}
    >
      {showIcon && (
        <IconOverlay
          Icon={Leaf}
          iconSize={iconSize}
          color="#A7F3D0"
          bg="rgba(0,30,20,0.35)"
          bgRadius={iconSize / 2 + 2}
        />
      )}
    </HexShell>
  );
}

export function DiamanteBadge(props: TierBadgeProps) {
  const { size = 96, className, glow = true, showIcon = true } = props;
  const iconSize = size * 0.42;
  const isSmall = size < 60;
  return (
    <HexShell
      size={size}
      className={className}
      glow={glow}
      ariaLabel="Tier Diamante"
      gradientId="diamante-fill"
      stroke="#4A9FD6"
      stops={[
        { offset: "0%", color: "#F0FAFF" },
        { offset: "50%", color: "#B9F2FF" },
        { offset: "100%", color: "#5AA8E0" },
      ]}
    >
      {showIcon && (
        <IconOverlay
          Icon={isSmall ? Gem : Sparkles}
          iconSize={iconSize}
          color="#0F2A3D"
          bg="rgba(255,255,255,0.3)"
          bgRadius={iconSize / 2 + 2}
        />
      )}
    </HexShell>
  );
}

export function RetadorBadge(props: TierBadgeProps) {
  const { size = 96, className, glow = true, showIcon = true } = props;
  const iconSize = size * 0.42;
  return (
    <HexShell
      size={size}
      className={className}
      glow={glow}
      ariaLabel="Tier Retador"
      gradientId="retador-fill"
      stroke="#7A0F2E"
      stops={[
        { offset: "0%", color: "#FF8FB8" },
        { offset: "50%", color: "#FF2E63" },
        { offset: "100%", color: "#A0103B" },
      ]}
    >
      {showIcon && (
        <IconOverlay
          Icon={Crown}
          iconSize={iconSize}
          color="#FFE0EB"
          bg="rgba(60,5,20,0.4)"
          bgRadius={iconSize / 2 + 2}
        />
      )}
    </HexShell>
  );
}

export const TIER_BADGES: Record<Tier, (props: TierBadgeProps) => React.JSX.Element> = {
  Bronce: BronceBadge,
  Plata: PlataBadge,
  Oro: OroBadge,
  Platino: PlatinoBadge,
  Esmeralda: EsmeraldaBadge,
  Diamante: DiamanteBadge,
  Retador: RetadorBadge,
};
