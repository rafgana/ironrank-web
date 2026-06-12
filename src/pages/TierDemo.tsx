import { TierBadge } from "@/components/ironrank/TierBadge";
import { TIERS, TIER_COLORS, TIER_COLORS_2, type Tier } from "@/models/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GridPattern } from "@/components/magicui/grid-pattern";
import { NumberTicker } from "@/components/magicui/number-ticker";

export function TierDemo() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-surface-0)]">
        <GridPattern
          width={50}
          height={50}
          className="opacity-30 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)]"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 md:py-20 space-y-16">
        <header className="text-center space-y-4">
          <Badge tier="brand" className="mx-auto">Sistema Ranked · IronRank</Badge>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight">
            Badges de Tier
          </h1>
          <p className="text-[var(--color-fg-muted)] text-lg max-w-2xl mx-auto">
            Siete rangos custom diseñados como insignias hexagonales con gradientes
            metálicos, glow por tier y animación de promoción. Sin emojis.
          </p>
        </header>

        <section className="space-y-6">
          <h2 className="font-condensed text-2xl text-[var(--color-fg-muted)] tracking-widest">
            Tamaño XL
          </h2>
          <Card className="border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]/80 backdrop-blur">
            <CardContent className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 justify-items-center">
                {TIERS.map((tier) => (
                  <TierBadge key={tier} tier={tier} size="xl" withLabel animated />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <h2 className="font-condensed text-2xl text-[var(--color-fg-muted)] tracking-widest">
            Con barra de progreso
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(["Bronce", "Plata", "Oro", "Platino", "Esmeralda", "Diamante", "Retador"] as Tier[]).map(
              (tier, i) => {
                const current = 120 + i * 85;
                const needed = 200 + i * 85;
                return (
                  <Card
                    key={tier}
                    tier={
                      tier.toLowerCase() as
                        | "bronze"
                        | "silver"
                        | "gold"
                        | "platinum"
                        | "emerald"
                        | "diamond"
                        | "challenger"
                    }
                    className="bg-[var(--color-surface-1)]/80 backdrop-blur"
                  >
                    <CardContent className="p-6 flex items-center gap-6">
                      <TierBadge tier={tier} size="lg" />
                      <div className="flex-1 space-y-2">
                        <div className="font-condensed text-lg" style={{ color: TIER_COLORS[tier] }}>
                          {tier.toUpperCase()}
                        </div>
                        <div className="text-sm text-[var(--color-fg-muted)]">
                          <NumberTicker value={current} /> / {needed} LP
                        </div>
                        <div
                          className="h-2 rounded-full overflow-hidden"
                          style={{ background: "var(--color-surface-2)" }}
                        >
                          <div
                            className="h-full transition-all duration-700"
                            style={{
                              width: `${(current / needed) * 100}%`,
                              background: `linear-gradient(90deg, ${TIER_COLORS_2[tier]}, ${TIER_COLORS[tier]})`,
                              boxShadow: `0 0 12px ${TIER_COLORS[tier]}66`,
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              },
            )}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="font-condensed text-2xl text-[var(--color-fg-muted)] tracking-widest">
            Tamaños
          </h2>
          <Card className="bg-[var(--color-surface-1)]/80 backdrop-blur">
            <CardContent className="p-8">
              <div className="flex flex-wrap items-end justify-center gap-8">
                <div className="space-y-2 text-center">
                  <TierBadge tier="Diamante" size="2xl" />
                  <div className="text-xs text-[var(--color-fg-muted)]">2xl (192px)</div>
                </div>
                <div className="space-y-2 text-center">
                  <TierBadge tier="Diamante" size="xl" />
                  <div className="text-xs text-[var(--color-fg-muted)]">xl (128px)</div>
                </div>
                <div className="space-y-2 text-center">
                  <TierBadge tier="Diamante" size="lg" />
                  <div className="text-xs text-[var(--color-fg-muted)]">lg (96px)</div>
                </div>
                <div className="space-y-2 text-center">
                  <TierBadge tier="Diamante" size="md" />
                  <div className="text-xs text-[var(--color-fg-muted)]">md (72px)</div>
                </div>
                <div className="space-y-2 text-center">
                  <TierBadge tier="Diamante" size="sm" />
                  <div className="text-xs text-[var(--color-fg-muted)]">sm (48px)</div>
                </div>
                <div className="space-y-2 text-center">
                  <TierBadge tier="Diamante" size="xs" />
                  <div className="text-xs text-[var(--color-fg-muted)]">xs (32px)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <h2 className="font-condensed text-2xl text-[var(--color-fg-muted)] tracking-widest">
            Hero con tier Retador
          </h2>
          <Card className="relative overflow-hidden border-2 border-[var(--color-challenger)]/40 bg-black/60">
            <CardContent className="relative p-12 md:p-16 flex flex-col items-center text-center gap-6">
              <TierBadge tier="Retador" size="2xl" animated />
              <div className="space-y-2">
                <h3 className="font-display text-4xl md:text-6xl font-bold bg-gradient-to-r from-[#FF6B9D] via-[#FF2E63] to-[#B91C44] bg-clip-text text-transparent">
                  RANGO MÁXIMO
                </h3>
                <p className="text-[var(--color-fg-muted)] max-w-md mx-auto">
                  Has alcanzado la cima. Solo el 0.5% de los atletas llegan aquí.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className="text-center text-sm text-[var(--color-fg-dim)] pt-8">
          Check-in #1 · Fase 0 (setup) + Fase 1 (badges SVG) ·
          <span className="text-[var(--color-fg-muted)]"> Próximo: layout + dashboard</span>
        </footer>
      </div>
    </div>
  );
}
