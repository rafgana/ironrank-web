"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Share2, Download, X, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import { TierEmblem } from "./ironrank/TierEmblem";
import type { Tier } from "../models/types";
import { TIER_VARS } from "../models/types";
import { springFast } from "../lib/motionTokens";

interface ShareCardProps {
  open: boolean;
  onClose: () => void;
  tier: Tier;
  stats: {
    totalWorkouts: number;
    streak: number;
    bestLift?: { name: string; weight: number; reps: number };
  };
  username?: string;
}

/**
 * Card compartible: "IronRank · BRONCE" con stats y tier emblem.
 * Click "Descargar" → genera PNG via canvas y descarga.
 * Click "Copiar texto" → copia al portapapeles un texto corto.
 */
export function ShareCard({ open, onClose, tier, stats, username = "Atleta" }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const shareText = `Mi tier en IronRank: ${tier.toUpperCase()} · ${stats.totalWorkouts} workouts · racha ${stats.streak}d 💪\nhttps://rafagandia.com/ironrank/`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownload = async () => {
    // Genera PNG via canvas: 1080x1080
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
    grad.addColorStop(0, "#0A0A0F");
    grad.addColorStop(1, "#15151D");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Tier color glow background
    const tierRgb = hexToRgb(TIER_VARS[tier].startsWith("var") ? "#00FFD1" : TIER_VARS[tier]);
    const glow = ctx.createRadialGradient(540, 400, 50, 540, 400, 500);
    glow.addColorStop(0, `rgba(${tierRgb}, 0.4)`);
    glow.addColorStop(1, `rgba(${tierRgb}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1080, 1080);

    // Top: brand
    ctx.fillStyle = "#666";
    ctx.font = "600 28px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("IRONRANK", 540, 90);

    // Tier emblem (use external SVG approach: just draw tier as text + decorative polygon)
    drawHexEmblem(ctx, 540, 380, 180, tier);

    // Tier name
    ctx.fillStyle = "#FFF";
    ctx.font = "900 88px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(tier.toUpperCase(), 540, 660);

    // Stats grid
    ctx.fillStyle = "#999";
    ctx.font = "500 24px system-ui, sans-serif";
    const yStats = 760;
    ctx.fillText("WORKOUTS", 320, yStats);
    ctx.fillText("RACHA", 540, yStats);
    ctx.fillText("BIG 3", 760, yStats);
    ctx.fillStyle = "#FFF";
    ctx.font = "800 48px system-ui, sans-serif";
    ctx.fillText(String(stats.totalWorkouts), 320, yStats + 56);
    ctx.fillText(`${stats.streak}d`, 540, yStats + 56);
    ctx.fillText(stats.bestLift ? `${stats.bestLift.weight}kg` : "—", 760, yStats + 56);

    // Username
    ctx.fillStyle = "#666";
    ctx.font = "500 22px system-ui, sans-serif";
    ctx.fillText(`@${username}`, 540, 920);

    // CTA
    ctx.fillStyle = "#00FFD1";
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.fillText("rafagandia.com/ironrank", 540, 1000);

    // Download
    const link = document.createElement("a");
    link.download = `ironrank-${tier.toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={springFast}
        className="card bg-noise relative w-full max-w-md p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="tap-target absolute top-2 right-2 flex items-center justify-center rounded-md text-fg-muted hover:bg-surface-2"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        <div className="eyebrow mb-1 inline-flex items-center gap-1.5">
          <Share2 size={11} />
          Compartir tier
        </div>
        <h2 className="font-display text-h3 mb-1 font-bold">Tu IronRank</h2>
        <p className="mb-4 text-xs text-fg-muted">
          Genera una imagen compartible con tu tier y stats.
        </p>

        {/* Preview */}
        <div
          className="mx-auto mb-5 flex aspect-square w-full max-w-[280px] flex-col items-center justify-center rounded-2xl border border-border-subtle"
          style={{
            background: "linear-gradient(135deg, #0A0A0F 0%, #15151D 100%)",
            boxShadow: "0 0 40px color-mix(in oklab, var(--tier) 30%, transparent)",
          }}
        >
          <div className="mb-2 flex items-center gap-1.5">
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
              style={{
                background: "color-mix(in oklab, var(--tier) 20%, transparent)",
                color: "var(--tier)",
                border: "1px solid color-mix(in oklab, var(--tier) 40%, transparent)",
              }}
            >
              Tier
            </span>
          </div>
          <TierEmblem tier={tier} size="lg" animated />
          <div
            className="display mt-3 text-3xl font-bold tracking-tight"
            style={{ color: "var(--tier)" }}
          >
            {tier.toUpperCase()}.
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="font-mono text-[10px] text-fg-dim uppercase tracking-wider">Workouts</div>
              <div className="font-display text-xl font-bold tabular-nums">{stats.totalWorkouts}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-fg-dim uppercase tracking-wider">Racha</div>
              <div className="font-display text-xl font-bold tabular-nums">{stats.streak}d</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="tier" onClick={handleDownload} className="w-full">
            <Download size={14} />
            Descargar PNG
          </Button>
          <Button variant="outline" onClick={handleCopy} className="w-full">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copiado" : "Copiar texto"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Helpers */
function hexToRgb(hex: string): string {
  // Convierte "#00FFD1" a "0, 255, 209". Si viene CSS var, default cyan.
  if (hex.startsWith("var")) return "0, 255, 209";
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function drawHexEmblem(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  tier: Tier,
) {
  const tierRgb = hexToRgb(TIER_VARS[tier].startsWith("var") ? "#00FFD1" : TIER_VARS[tier]);
  // Pentágono simple
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const points = 5;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? size : size * 0.7;
    const a = (Math.PI / points) * i - Math.PI / 2;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const grad = ctx.createLinearGradient(-size, -size, size, size);
  grad.addColorStop(0, `rgba(${tierRgb}, 0.4)`);
  grad.addColorStop(1, `rgba(${tierRgb}, 1)`);
  ctx.fillStyle = grad;
  ctx.shadowColor = `rgba(${tierRgb}, 0.6)`;
  ctx.shadowBlur = 30;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(${tierRgb}, 0.8)`;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}
