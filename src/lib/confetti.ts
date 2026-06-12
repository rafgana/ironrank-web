import confetti from "canvas-confetti";

export function celebratePR() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ["#ffaa40", "#9c40ff", "#00e5ff", "#ffd700"],
  });
}

export function celebrateTierUp() {
  const end = Date.now() + 1500;
  const colors = ["#ffaa40", "#9c40ff", "#00e5ff", "#ffd700", "#10b981"];

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}
