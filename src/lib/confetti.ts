import confetti from "canvas-confetti";

export function celebratePR() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ["#ffaa40", "#9c40ff", "#00e5ff", "#ffd700"],
  });
}
