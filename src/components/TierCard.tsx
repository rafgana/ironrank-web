import { TIER_COLORS, TIER_ICONS, type Tier } from '../models/types'

export function TierCard({ tier, large = false }: { tier: Tier; large?: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl p-4"
      style={{ background: TIER_COLORS[tier] + '15', border: '1px solid ' + TIER_COLORS[tier] + '30' }}
    >
      <span style={{ fontSize: large ? 64 : 48 }}>{TIER_ICONS[tier]}</span>
      <span className="font-bold" style={{ color: TIER_COLORS[tier], fontSize: large ? '1.5rem' : '1.2rem' }}>
        {tier}
      </span>
    </div>
  )
}
