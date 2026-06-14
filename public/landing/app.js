/* ═══════════════════════════════════════════════════════════════
   IronRank Landing — GSAP
   ═══════════════════════════════════════════════════════════════ */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

gsap.registerPlugin(ScrollTrigger);

if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(100);
  ScrollTrigger.refresh();
}

// ─── 3D TILT CARDS ───
document.querySelectorAll("[data-tilt]").forEach((card) => {
  const strength = 12;
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -strength;
    const rotateY = ((x - centerX) / centerX) * strength;
    gsap.to(card, {
      rotateX, rotateY, duration: 0.4, ease: "power2.out",
      transformPerspective: 1000,
    });
  });
  card.addEventListener("mouseleave", () => {
    gsap.to(card, {
      rotateX: 0, rotateY: 0, duration: 0.7, ease: "elastic.out(1, 0.5)",
    });
  });
});

// ─── HERO ANIMATIONS ───
function playHeroAnimations() {
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from("[data-hero-anim]", {
    y: 60, opacity: 0, duration: 1.2, stagger: 0.12,
  });

  // Hero title — fade in per line (no char-reveal, evita overflow hidden)
  gsap.from(".hero-line", {
    y: 30, opacity: 0, duration: 1.4, stagger: 0.15, delay: 0.2, ease: "expo.out",
  });

  // Counters
  document.querySelectorAll("[data-counter]").forEach((el) => {
    const target = parseInt(el.dataset.counter);
    gsap.fromTo(el, { innerText: 0 }, {
      innerText: target, duration: 2, ease: "power2.out", snap: { innerText: 1 }, delay: 1,
    });
  });

  // Floating cards
  gsap.from("#hero-cards .tier-card", {
    y: 100, opacity: 0, duration: 1.2, stagger: 0.08, ease: "back.out(1.4)", delay: 0.6,
  });
}

// ─── PARALLAX HERO CARDS ───
gsap.to("#hero-cards", {
  yPercent: -30, ease: "none",
  scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 },
});

// ─── SECTION REVEALS ───
gsap.utils.toArray("[data-section-anim]").forEach((el) => {
  gsap.from(el, {
    y: 60, opacity: 0, duration: 1.2, ease: "expo.out",
    scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
  });
});

// ─── TIER ROWS REVEAL + BAR FILL ───
document.querySelectorAll("[data-tier-row]").forEach((row, i) => {
  const fill = row.querySelector(".tier-row-bar-fill");
  const tier = row.dataset.tier;
  const widths = { bronce: 14, plata: 28, oro: 42, platino: 57, esmeralda: 71, diamante: 86, retador: 100 };

  gsap.from(row, {
    x: -50, opacity: 0, duration: 0.9, delay: i * 0.06, ease: "expo.out",
    scrollTrigger: { trigger: row, start: "top 90%", toggleActions: "play none none reverse" },
  });

  ScrollTrigger.create({
    trigger: row, start: "top 80%",
    onEnter: () => { gsap.to(fill, { width: widths[tier] + "%", duration: 1.4, ease: "expo.out" }); },
  });
});

// ─── FEATURE CARDS STAGGER ───
gsap.from("[data-feature-card]", {
  y: 80, opacity: 0, duration: 1, stagger: 0.1, ease: "expo.out",
  scrollTrigger: { trigger: ".features-grid", start: "top 80%", toggleActions: "play none none reverse" },
});

// ─── HOW STEPS STAGGER ───
gsap.from("[data-how-step]", {
  y: 100, opacity: 0, duration: 1.2, stagger: 0.15, ease: "expo.out",
  scrollTrigger: { trigger: ".how-grid", start: "top 80%", toggleActions: "play none none reverse" },
});

// ─── CTA REVEAL ───
gsap.from("[data-cta-anim]", {
  y: 40, opacity: 0, duration: 1.2, stagger: 0.12, ease: "expo.out",
  scrollTrigger: { trigger: ".section--cta", start: "top 70%", toggleActions: "play none none reverse" },
});

// ─── FAQ ITEMS STAGGER ───
gsap.from("[data-faq-item]", {
  y: 30, opacity: 0, duration: 0.8, stagger: 0.08, ease: "expo.out",
  scrollTrigger: { trigger: ".faq-list", start: "top 80%", toggleActions: "play none none reverse" },
});

// ─── NAV SHOW/HIDE ───
const nav = document.getElementById("nav");
ScrollTrigger.create({
  start: "top -100", end: 99999,
  toggleClass: { className: "visible", targets: nav },
});

// ─── PARALLAX BG GLOWS ───
gsap.to(".hero-glow--cyan", {
  yPercent: -40, xPercent: -20,
  scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 2 },
});
gsap.to(".hero-glow--orange", {
  yPercent: -60, xPercent: 20,
  scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 2 },
});

// ─── MAGNETIC CTA ───
document.querySelectorAll(".btn--primary").forEach((btn) => {
  btn.addEventListener("mousemove", (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(btn, { x: x * 0.2, y: y * 0.2, duration: 0.3, ease: "power2.out" });
  });
  btn.addEventListener("mouseleave", () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
  });
});

// ─── SMOOTH ANCHOR ───
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  });
});

// ─── HERO ENTRY ON LOAD ───
window.addEventListener("load", () => {
  playHeroAnimations();
  ScrollTrigger.refresh();
});
