import { TIER_COLORS, TIER_SLUGS, type Tier } from "../models/types";

/**
 * Fija el acento ambiental de la app al color del tier del usuario.
 * Todo el theming derivado (--tier, --tier-soft, --tier-glow…) es CSS puro
 * keyed en este data attribute — ver index.css.
 */
export function setTierAccent(tier: Tier) {
  document.documentElement.dataset.tier = TIER_SLUGS[tier];
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (meta) meta.content = TIER_COLORS[tier];
}
