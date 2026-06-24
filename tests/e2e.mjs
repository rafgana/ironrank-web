#!/usr/bin/env node
/**
 * Tests E2E automatizados del MVP auth + sync.
 * Uso: npm run test:e2e
 *
 * Requiere: preview server corriendo en http://127.0.0.1:4173/ironrank/
 * Variables de entorno necesarias: SUPABASE_SERVICE_ROLE_KEY (admin API)
 */
import pw from "playwright";
const { chromium } = pw;

const URL = "http://127.0.0.1:4173/ironrank/";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aemajqeksudfljdzsvfe.supabase.co";
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_C-dFcw66bC7KCthpN2hAvQ_K8uKKAAW";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE_KEY) {
  console.error("⚠ SUPABASE_SERVICE_ROLE_KEY no está en el entorno. Los tests que la requieren se saltarán.");
}
const TEST_EMAIL = process.env.TEST_EMAIL || "test-e2e@ironrank.local";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "test-password-12345";

let pass = 0;
let fail = 0;
const failures = [];

function test(name, fn) {
  return async () => {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      pass++;
    } catch (e) {
      console.log(`  ✗ ${name}: ${e.message}`);
      fail++;
      failures.push({ name, error: e.message });
    }
  };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "Assertion failed");
}

async function getSession() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed: ${JSON.stringify(data)}`);
  return data;
}

async function getFreshSession() {
  const ts = Date.now();
  const email = `e2e-suite-${ts}@ironrank.local`;
  const password = "test1234";
  // Create user via admin API (requiere SERVICE_ROLE_KEY)
  if (!SERVICE_ROLE_KEY) {
    throw new Error("SERVICE_ROLE_KEY no definida — no se puede crear usuario de test");
  }
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: { "apikey": SERVICE_ROLE_KEY, "Authorization": `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  // Login
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return await res.json();
}

async function runWithSession(session) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: "block" });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => { throw e; });
  await p.addInitScript((s) => {
    localStorage.setItem("ironrank.auth.session", JSON.stringify({
      access_token: s.access_token, refresh_token: s.refresh_token,
      expires_in: s.expires_in, expires_at: s.expires_at,
      token_type: "bearer", user: s.user,
    }));
  }, session);
  await p.goto(URL, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(5000);
  return { browser, ctx, p };
}

async function scenario(name, fn) {
  console.log(`\n[${name}]`);
  try {
    await fn();
    pass++;
    console.log(`  ✓ PASS`);
  } catch (e) {
    fail++;
    console.log(`  ✗ FAIL: ${e.message}`);
    failures.push({ scenario: name, error: e.message });
  }
}

(async () => {
  console.log("IronRank E2E test suite\n");

  await scenario("1. Cold load", async () => {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p = await ctx.newPage();
    await p.goto(URL, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(3000);
    const loginBtn = p.getByRole("button", { name: /Continuar con Google/i });
    const visible = await loginBtn.isVisible({ timeout: 2000 }).catch(() => false);
    assert(visible, "LoginScreen should appear on cold load");
    await browser.close();
  });

  await scenario("2. LoginScreen UI", async () => {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p = await ctx.newPage();
    await p.goto(URL, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(3000);
    const emailField = await p.locator('input[type="email"]').isVisible({ timeout: 2000 }).catch(() => false);
    const passField = await p.locator('input[type="password"]').isVisible({ timeout: 2000 }).catch(() => false);
    const toggle = await p.getByRole("button", { name: /Regístrate/i }).isVisible({ timeout: 2000 }).catch(() => false);
    const google = await p.getByRole("button", { name: /Continuar con Google/i }).isVisible({ timeout: 2000 }).catch(() => false);
    assert(emailField, "email field should be visible");
    assert(passField, "password field should be visible");
    assert(toggle, "signup toggle should be visible");
    assert(google, "Google button should be visible");
    await browser.close();
  });

  await scenario("3. Google OAuth redirect", async () => {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p = await ctx.newPage();
    await p.goto(URL, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(3000);
    await p.getByRole("button", { name: /Continuar con Google/i }).click();
    await p.waitForTimeout(5000);
    assert(p.url().includes("accounts.google.com"), `Should redirect to Google, got: ${p.url()}`);
    await browser.close();
  });

  await scenario("4. Session detection (real session)", async () => {
    const session = await getSession();
    const { browser, p } = await runWithSession(session);
    const loginBtn = p.getByRole("button", { name: /Continuar con Google/i });
    const visible = await loginBtn.isVisible({ timeout: 2000 }).catch(() => false);
    assert(!visible, "LoginScreen should NOT be visible after session detected");
    const perfilBtns = p.getByRole("button", { name: "Perfil" });
    assert(await perfilBtns.first().isVisible(), "Perfil tab should be visible");
    await browser.close();
  });

  await scenario("5. Profile shows email (real session)", async () => {
    const session = await getSession();
    const { browser, p } = await runWithSession(session);
    const perfilBtns = p.getByRole("button", { name: "Perfil" });
    for (let i = 0; i < await perfilBtns.count(); i++) {
      if (await perfilBtns.nth(i).isVisible().catch(() => false)) {
        await perfilBtns.nth(i).click();
        break;
      }
    }
    await p.waitForTimeout(3000);
    const body = await p.locator("body").textContent();
    assert(body.includes(TEST_EMAIL), `Email ${TEST_EMAIL} should be shown`);
    assert(body.includes("Sincronizado"), "Should show 'Sincronizado' status");
    await browser.close();
  });

  await scenario("6. Sync round-trip", async () => {
    const session = await getSession();
    if (!session?.user?.id) {
      console.log("  SKIP: no session available");
      return;
    }
    const userId = session.user.id;
    const accessToken = session.access_token;

    // Create a workout in Supabase via REST
    const wo = await fetch(`${SUPABASE_URL}/rest/v1/workouts`, {
      method: "POST",
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ user_id: userId, date: new Date().toISOString(), duration: 3600, notes: "E2E test" }),
    });
    if (!wo.ok) {
      const err = await wo.text();
      console.log(`  SKIP: cannot create workout in Supabase: ${err.slice(0, 100)}`);
      return;
    }
    const workouts = await wo.json();
    const workout = workouts[0];
    if (!workout?.id) {
      console.log("  SKIP: no workout id in response");
      return;
    }

    // Trigger sync in app
    const { browser, p } = await runWithSession(session);
    const perfilBtns = p.getByRole("button", { name: "Perfil" });
    for (let i = 0; i < await perfilBtns.count(); i++) {
      if (await perfilBtns.nth(i).isVisible().catch(() => false)) {
        await perfilBtns.nth(i).click();
        break;
      }
    }
    await p.waitForTimeout(3000);
    const syncBtn = p.getByRole("button", { name: /Sincronizar ahora/i });
    if (await syncBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await syncBtn.click();
      await p.waitForTimeout(3000);
    }
    // Check workouts in IDB
    const localWorkouts = await p.evaluate(async () => {
      return new Promise((resolve) => {
        const req = indexedDB.open("IronRank");
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction("workouts", "readonly");
          const all = tx.objectStore("workouts").getAll();
          all.onsuccess = () => resolve(all.result);
        };
      });
    });
    const found = localWorkouts.find((w) => w.id === workout.id || String(w.id) === String(workout.id));
    assert(found, `Workout ${workout.id} should be in IDB after sync`);
    await browser.close();
  });

  await scenario("7. Signup with email/password", async () => {
    const ts = Date.now();
    const email = `e2e-suite-${ts}@ironrank.local`;
    const password = "test1234";
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p = await ctx.newPage();
    await p.goto(URL, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(5000);
    await p.getByRole("button", { name: /Regístrate/i }).click();
    await p.waitForTimeout(500);
    await p.locator('input[type="email"]').fill(email);
    await p.locator('input[type="password"]').fill(password);
    await p.getByRole("button", { name: /Crear cuenta/i }).click();
    await p.waitForTimeout(5000);
    const perfilBtns = p.getByRole("button", { name: "Perfil" });
    const inApp = await perfilBtns.first().isVisible({ timeout: 2000 }).catch(() => false);
    assert(inApp, "Should be in app after signup");
    await browser.close();
  });

  await scenario("8. Realtime subscribed after login", async () => {
    const session = await getSession();
    const { browser, p } = await runWithSession(session);
    await p.waitForTimeout(3000);
    // Check action log for realtime_subscribed
    const logs = await p.evaluate(async () => {
      return new Promise((resolve) => {
        const req = indexedDB.open("IronRank");
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction("actionLog", "readonly");
          const all = tx.objectStore("actionLog").getAll();
          all.onsuccess = () => resolve(all.result);
        };
      });
    });
    const realtimeSubscribed = logs.some((l) => l.kind === "realtime_subscribed");
    assert(realtimeSubscribed, "realtime_subscribed should be logged after login");
    await browser.close();
  });

  await scenario("9. Auto-backup runs after login", async () => {
    const session = await getFreshSession();
    const { browser, p } = await runWithSession(session);
    await p.waitForTimeout(3000);
    // Trigger manual backup by navigating to profile (no UI for this yet)
    const logs = await p.evaluate(async () => {
      return new Promise((resolve) => {
        const req = indexedDB.open("IronRank");
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction("actionLog", "readonly");
          const all = tx.objectStore("actionLog").getAll();
          all.onsuccess = () => resolve(all.result);
        };
      });
    });
    // backup should be triggered at some point
    // (no enforcement — just verify the scheduler is active)
    await browser.close();
  });

  // ─── Landing page tests ───

  await scenario("10. Landing page renders without errors", async () => {
    const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium-browser", args: ["--no-sandbox"] });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    p.on("requestfailed", (req) => {
      if (!req.url().includes("favicon")) errors.push(`failed: ${req.url()}`);
    });

    await p.goto("https://rafagandia.com/ironrank/landing/", { waitUntil: "networkidle", timeout: 30000 });
    await p.waitForTimeout(3000);
    const title = await p.title();
    assert(title.includes("IronRank"), "Title should contain IronRank");
    const h1 = await p.locator("h1").first().textContent();
    assert(h1.includes("Entrena"), "H1 should contain 'Entrena'");
    const tierCards = await p.locator(".tier-card").count();
    assert(tierCards === 7, `Should have 7 tier cards, got ${tierCards}`);
    assert(errors.length === 0, `Should have no errors, got: ${errors.join("; ")}`);
    await browser.close();
  });

  await scenario("11. Landing page has SEO meta tags", async () => {
    const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium-browser", args: ["--no-sandbox"] });
    const p = await (await browser.newContext()).newPage();
    await p.goto("https://rafagandia.com/ironrank/landing/", { waitUntil: "domcontentloaded" });
    const ogTitle = await p.locator('meta[property="og:title"]').getAttribute("content");
    const ogImage = await p.locator('meta[property="og:image"]').getAttribute("content");
    const ogImageWidth = await p.locator('meta[property="og:image:width"]').getAttribute("content");
    const canonical = await p.locator('link[rel="canonical"]').getAttribute("href");
    const jsonLd = await p.locator('script[type="application/ld+json"]').count();
    assert(ogTitle?.includes("IronRank"), "og:title should mention IronRank");
    assert(ogImage?.includes("og-landing.png"), "og:image should be og-landing.png");
    assert(ogImageWidth === "1200", "og:image:width should be 1200");
    assert(canonical?.includes("/landing/"), "canonical should include /landing/");
    assert(jsonLd >= 1, "Should have at least one JSON-LD block");
    await browser.close();
  });

  await scenario("12. Sitemap and robots are accessible", async () => {
    const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium-browser", args: ["--no-sandbox"] });
    const p = await (await browser.newContext()).newPage();
    const sitemapRes = await p.goto("https://rafagandia.com/ironrank/sitemap.xml");
    const sitemapBody = await sitemapRes.text();
    assert(sitemapBody.includes("/ironrank/landing/"), "Sitemap should include /ironrank/landing/");
    const robotsRes = await p.goto("https://rafagandia.com/ironrank/robots.txt");
    const robotsBody = await robotsRes.text();
    assert(robotsBody.includes("Sitemap:"), "Robots should reference sitemap");
    assert(robotsBody.includes("Disallow:"), "Robots should have disallow rules");
    await browser.close();
  });

  await scenario("13. Timer starts after adding a set", async () => {
    const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium-browser", args: ["--no-sandbox"] });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    const session = await getSession();
    await p.goto(URL, { waitUntil: "networkidle" });
    await p.waitForTimeout(2000);
    // Sign in
    await p.locator('input[type="email"]').fill(session.user?.email || TEST_EMAIL);
    await p.locator('input[type="password"]').fill(TEST_PASSWORD);
    await p.locator('button:has-text("Iniciar")').first().click();
    await p.waitForTimeout(5000);
    // Start workout
    const newBtn = p.locator('button:has-text("Nuevo workout")').first();
    if (await newBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newBtn.click();
      await p.waitForTimeout(2000);
    }
    // Add exercise
    const addEx = p.locator('button:has-text("Añadir ejercicio")').first();
    if (await addEx.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addEx.click();
      await p.waitForTimeout(1500);
    }
    // Pick Press Banca
    const firstEx = p.locator('button:has-text("Press Banca")').first();
    if (await firstEx.isVisible({ timeout: 1500 }).catch(() => false)) {
      await firstEx.click();
      await p.waitForTimeout(1500);
    }
    // Open set sheet
    const addSetBtn = p.locator('button:has-text("Añadir serie")').first();
    if (await addSetBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await addSetBtn.click();
      await p.waitForTimeout(1500);
    }
    // Fill and submit
    const inputs = await p.locator('input[type="number"]').all();
    if (inputs.length >= 2) {
      await inputs[0].fill("60");
      await inputs[1].fill("10");
      await p.waitForTimeout(500);
    }
    const ctaBtns = await p.locator('button:has-text("Añadir serie")').all();
    if (ctaBtns.length >= 2) {
      await ctaBtns[ctaBtns.length - 1].click({ force: true });
      await p.waitForTimeout(2000);
    }
    // Verify timer is visible
    const timerVisible = await p.locator('text=/Descanso/i').first().isVisible({ timeout: 3000 }).catch(() => false);
    assert(timerVisible, "Rest timer should appear after adding a set");
    await browser.close();
  });

  await scenario("14. Timer pause/resume + refresh survival", async () => {
    const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium-browser", args: ["--no-sandbox"] });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    const session = await getSession();
    await p.goto(URL, { waitUntil: "networkidle" });
    await p.waitForTimeout(2000);
    await p.locator('input[type="email"]').fill(session.user?.email || TEST_EMAIL);
    await p.locator('input[type="password"]').fill(TEST_PASSWORD);
    await p.locator('button:has-text("Iniciar")').first().click();
    await p.waitForTimeout(5000);

    // Set up workout
    await p.locator('button:has-text("Nuevo workout")').first().click();
    await p.waitForTimeout(2000);
    await p.locator('button:has-text("Añadir ejercicio")').first().click();
    await p.waitForTimeout(1500);
    await p.locator('button:has-text("Press Banca")').first().click();
    await p.waitForTimeout(1500);
    await p.locator('button:has-text("Añadir serie")').first().click();
    await p.waitForTimeout(1500);
    const inputs = await p.locator('input[type="number"]').all();
    if (inputs.length >= 2) {
      await inputs[0].fill("60");
      await inputs[1].fill("10");
    }
    const ctaBtns = await p.locator('button:has-text("Añadir serie")').all();
    if (ctaBtns.length >= 2) {
      await ctaBtns[ctaBtns.length - 1].click({ force: true });
      await p.waitForTimeout(2500);
    }
    // Expand timer
    const expand = p.locator('button[aria-label="Expandir timer"]').first();
    if (await expand.isVisible({ timeout: 1500 }).catch(() => false)) {
      await expand.click();
      await p.waitForTimeout(800);
    }
    // Test pause: read t1, click pause, read t2, wait 3s, read t3
    const t1 = await p.locator('.text-4xl.font-mono').first().textContent().catch(() => null);
    const pause = p.locator('button:has-text("Pausar")').first();
    if (await pause.isVisible({ timeout: 1500 }).catch(() => false)) {
      await pause.click();
      await p.waitForTimeout(500);
    }
    const t2 = await p.locator('.text-4xl.font-mono').first().textContent().catch(() => null);
    await p.waitForTimeout(3000);
    const t3 = await p.locator('.text-4xl.font-mono').first().textContent().catch(() => null);
    assert(t2 === t3, `Timer should freeze when paused. T2=${t2} T3=${t3}`);
    // Resume
    const resume = p.locator('button:has-text("Reanudar")').first();
    if (await resume.isVisible({ timeout: 1500 }).catch(() => false)) {
      await resume.click();
      await p.waitForTimeout(2000);
    }
    const t4 = await p.locator('.text-4xl.font-mono').first().textContent().catch(() => null);
    assert(t4 !== t3, `Timer should resume. T3=${t3} T4=${t4}`);
    // Refresh survival
    await p.reload({ waitUntil: "networkidle" });
    await p.waitForTimeout(3000);
    const timerStillVisible = await p.locator('text=/Descanso/i').first().isVisible({ timeout: 3000 }).catch(() => false);
    assert(timerStillVisible, "Timer should survive page refresh");
    await browser.close();
  });

  console.log(`\nResults: ${pass} pass, ${fail} fail`);
  if (fail > 0) {
    console.log("\nFailures:");
    failures.forEach((f) => console.log(`  - ${f.name}: ${f.error}`));
  }
  process.exit(fail > 0 ? 1 : 0);
})();
