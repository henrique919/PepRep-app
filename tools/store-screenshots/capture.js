/* Phase B: seed a realistic demo profile, capture 6 raw app screens,
 * then compose 1320x2868 App Store frames per the audit art direction. */
const { chromium } = require("playwright-core");
const path = require("path");
const fs = require("fs");
const RAW = path.join(__dirname, "store-raw");
const OUT = path.join(__dirname, "store-frames");
fs.mkdirSync(RAW, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
const BASE = "http://127.0.0.1:4173";
const tid = (id) => `[data-testid="${id}"]`;

const DAY_MS = 86400000;
const iso = (daysAgo, h, m = 0) => {
  const d = new Date(Date.now() - daysAgo * DAY_MS);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const dkey = (daysAgo) => new Date(Date.now() - daysAgo * DAY_MS).toISOString().slice(0, 10);

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true });
  const page = await ctx.newPage();

  /* ── onboard with BPC-157 5mg/2mL ── */
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  if (await page.locator(tid("onboarding-intro")).count()) {
    await page.locator(tid("onboarding-continue-intro")).click();
    await page.waitForTimeout(250);
    await page.locator(tid("onboarding-ack")).click();
    await page.locator(tid("onboarding-continue-safety")).click();
    await page.waitForTimeout(250);
    await page.locator(tid("onboarding-vial-name")).fill("BPC-157");
    await page.locator(tid("onboarding-vial-mg")).fill("5");
    await page.locator(tid("onboarding-vial-water")).fill("2");
    await page.locator(tid("onboarding-finish")).click();
    await page.waitForTimeout(2000);
  }

  /* ── discover storage keys, then seed a coherent demo dataset ── */
  const keys = await page.evaluate(() => Object.keys(localStorage));
  const keyFor = (suffix) => keys.find((k) => k.endsWith(suffix)) ?? `peprep.${suffix}`;
  console.log("storage keys:", JSON.stringify(keys));

  const seeded = await page.evaluate(
    ({ vialsKey, txnsKey, eventsKey, seed }) => {
      const vials = JSON.parse(localStorage.getItem(vialsKey) ?? "[]");
      const bpc = vials[0];
      if (!bpc) return "no-vial";
      const tb = { ...bpc, id: "seed-tb500", name: "TB-500", vialMg: 10, diluentMl: 2.5, syringeCapacityUnits: 100, reconstitutedAtIso: seed.tbRecon, lot: "TB-0525" };
      localStorage.setItem(vialsKey, JSON.stringify([bpc, tb]));

      const txns = JSON.parse(localStorage.getItem(txnsKey) ?? "[]");
      const events = JSON.parse(localStorage.getItem(eventsKey) ?? "[]");
      let n = 0;
      const mk = () => `seed-${++n}`;
      // The injected vial needs its opening ledger entry, like addVial writes.
      txns.push({ id: mk(), vialId: tb.id, type: "initial", deltaMcg: 10000, occurredAt: seed.tbRecon });
      const doses = [
        // 5 BPC doses over 3 days → 5000 - 5*250 = 3750 mcg left (75%)
        { d: seed.bpcDoses[0], vial: bpc.id, name: "BPC-157", mcg: 250, units: 10, ml: 0.1 },
        { d: seed.bpcDoses[1], vial: bpc.id, name: "BPC-157", mcg: 250, units: 10, ml: 0.1 },
        { d: seed.bpcDoses[2], vial: bpc.id, name: "BPC-157", mcg: 250, units: 10, ml: 0.1 },
        { d: seed.bpcDoses[3], vial: bpc.id, name: "BPC-157", mcg: 250, units: 10, ml: 0.1 },
        { d: seed.bpcDoses[4], vial: bpc.id, name: "BPC-157", mcg: 250, units: 10, ml: 0.1 },
        // 2 TB doses → 10000 - 2*500 = 9000 mcg left (90%)
        { d: seed.tbDoses[0], vial: tb.id, name: "TB-500", mcg: 500, units: 12.5, ml: 0.125 },
        { d: seed.tbDoses[1], vial: tb.id, name: "TB-500", mcg: 500, units: 12.5, ml: 0.125 },
      ];
      for (const dose of doses) {
        const id = mk();
        events.push({ id, status: "completed", compoundName: dose.name, doseValue: dose.mcg, doseUnit: "mcg", doseMcg: dose.mcg, units: dose.units, volumeMl: dose.ml, vialId: dose.vial, occurredAt: dose.d });
        txns.push({ id: mk(), vialId: dose.vial, type: "dose", deltaMcg: -dose.mcg, sourceEventId: id, occurredAt: dose.d });
      }
      events.push({ id: mk(), status: "skipped", compoundName: "BPC-157", doseValue: 250, doseUnit: "mcg", doseMcg: 250, occurredAt: seed.skippedAt, occurrenceKey: seed.skippedKey });
      events.push({ id: mk(), status: "missed", compoundName: "TB-500", doseValue: 500, doseUnit: "mcg", doseMcg: 500, occurredAt: seed.missedAt, occurrenceKey: seed.missedKey });
      localStorage.setItem(eventsKey, JSON.stringify(events));
      localStorage.setItem(txnsKey, JSON.stringify(txns));
      return `ok: ${events.length} events, ${txns.length} txns`;
    },
    {
      vialsKey: keyFor("vials"),
      txnsKey: keyFor("inventoryTxns"),
      eventsKey: keyFor("doseEvents"),
      seed: {
        tbRecon: iso(6, 9),
        bpcDoses: [iso(3, 8), iso(2, 8), iso(1, 8), iso(1, 20), iso(0, 8)],
        tbDoses: [iso(4, 9), iso(0, 9, 30)],
        skippedAt: iso(2, 20), skippedKey: `${dkey(2)}|20:00|seedplan`,
        missedAt: iso(3, 20), missedKey: `${dkey(3)}|20:00|seedplan`,
      },
    },
  );
  console.log("seed:", seeded);

  /* ── create today's plan via UI (default vial BPC-157) and log the morning dose ── */
  await page.goto(BASE + "/plans/new", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.locator(tid("input-plan-compound")).fill("BPC-157");
  await page.locator(tid("input-plan-name")).fill("Morning + evening");
  await page.locator(tid("input-plan-dose")).fill("250");
  const todayShort = new Date().toLocaleDateString("en-US", { weekday: "short" });
  await page.getByText(todayShort, { exact: true }).first().click();
  await page.locator(tid("input-plan-time")).fill("08:00");
  await page.getByText("Add", { exact: true }).first().click();
  await page.locator(tid("input-plan-time")).fill("20:00");
  await page.getByText("Add", { exact: true }).first().click();
  await page.locator('[data-testid^="plan-vial-chip-"]').first().click().catch(() => {});
  await page.waitForTimeout(300);
  await page.locator(tid("save-plan")).click();
  await page.waitForTimeout(1500);

  await page.goto(BASE + "/today", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.locator('[data-testid^="log-2"]').first().click();
  await page.waitForTimeout(1200);
  await page.locator(tid("confirm-log-plan")).click().catch(() => {});
  await page.waitForTimeout(1500);

  /* ── raw captures ── */
  /* 1: calculator result (numbers seeded via UI) */
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.locator(tid("input-vial")).fill("5");
  await page.locator(tid("input-water")).fill("2");
  await page.locator(tid("input-dose")).fill("250");
  await page.waitForTimeout(900);
  await page.locator(tid("draw-result")).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -70));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(RAW, "1-result.png") });

  /* 2: math open */
  await page.locator(tid("toggle-math")).click();
  await page.waitForTimeout(700);
  await page.getByText("WORKED STEPS", { exact: false }).first().scrollIntoViewIfNeeded().catch(() => {});
  await page.evaluate(() => window.scrollBy(0, -60));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(RAW, "2-math.png") });

  /* 3: vials */
  await page.goto(BASE + "/vials", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: path.join(RAW, "3-vials.png") });

  /* 4: today */
  await page.goto(BASE + "/today", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(RAW, "4-today.png") });

  /* 5: history */
  await page.goto(BASE + "/history", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: path.join(RAW, "5-history.png") });

  /* 6: settings data section */
  await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.getByText("Your data", { exact: false }).first().scrollIntoViewIfNeeded().catch(() => {});
  await page.evaluate(() => window.scrollBy(0, -40));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(RAW, "6-settings.png") });

  console.log("raw captures done");

  /* ── compose frames ── */
  const fontDir = "/home/user/work/peprep-app/expo/dist/assets/node_modules/@expo-google-fonts";
  const fontData = (rel) =>
    `data:font/ttf;base64,${fs.readFileSync(path.join(fontDir, rel)).toString("base64")}`;
  const FONTS = `
  @font-face { font-family: SyneX; font-weight: 800; src: url("${fontData("syne/800ExtraBold/Syne_800ExtraBold.67fd7d06cb7e7803883b3f3154620782.ttf")}"); }
  @font-face { font-family: DMS; font-weight: 400; src: url("${fontData("dm-sans/400Regular/DMSans_400Regular.74f9bb7405caec741a24db735b2c5733.ttf")}"); }
  @font-face { font-family: PlexM; font-weight: 500; src: url("${fontData("ibm-plex-mono/500Medium/IBMPlexMono_500Medium.eddb5e5647bc7910fd2417321769f58d.ttf")}"); }`;

  const frames = [
    { raw: "1-result.png", out: "01-exact-draw.png", theme: "carbon", kicker: "Calculate", headline: "From vial to draw.\nEvery unit accounted for." },
    { raw: "2-math.png", out: "02-math-visible.png", theme: "paper", kicker: "Show the math", headline: "The math stays\nvisible." },
    { raw: "3-vials.png", out: "03-vials.png", theme: "carbon", kicker: "Inventory", headline: "Your vial.\nStill accounted for." },
    { raw: "4-today.png", out: "04-today.png", theme: "paper", kicker: "Your schedule", headline: "Your plan,\non your terms." },
    { raw: "5-history.png", out: "05-history.png", theme: "carbon", kicker: "Records", headline: "A record that\nstays honest." },
    { raw: "6-settings.png", out: "06-private.png", theme: "paper", kicker: "Your data", headline: "Private by default.\nExport any time." },
  ];

  /* Compose at exactly 1320x2868 physical pixels (dsf 1 — Apple's exact size). */
  const shotCtx = await browser.newContext({
    viewport: { width: 1320, height: 2868 },
    deviceScaleFactor: 1,
  });
  const shotPage = await shotCtx.newPage();
  for (const frame of frames) {
    const img = fs.readFileSync(path.join(RAW, frame.raw)).toString("base64");
    const carbon = frame.theme === "carbon";
    const bg = carbon ? "#16161A" : "#F3F0E8";
    const fg = carbon ? "#FAF9F5" : "#16161A";
    const kicker = carbon ? "#E8FF47" : "#6B6A72";
    const border = carbon ? "rgba(232,255,71,0.25)" : "rgba(22,22,26,0.15)";
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      ${FONTS}
      * { margin: 0; box-sizing: border-box; }
      body { width: 1320px; height: 2868px; background: ${bg}; color: ${fg}; overflow: hidden;
             display: flex; flex-direction: column; padding: 110px 96px 0; }
      .kicker { font-family: PlexM; font-size: 30px; letter-spacing: 0.22em; text-transform: uppercase;
                color: ${kicker}; }
      h1 { font-family: SyneX; font-weight: 800; font-size: 78px; line-height: 1.06;
           letter-spacing: -0.02em; margin-top: 26px; white-space: pre-line; }
      .shot { margin: 56px auto 0; width: 1104px; flex: 1; border-radius: 64px 64px 0 0;
              border: 3px solid ${border}; border-bottom: none; overflow: hidden;
              box-shadow: 0 -30px 90px rgba(0,0,0,${carbon ? 0.55 : 0.18}); }
      .shot img { width: 100%; display: block; }
    </style></head><body>
      <div class="kicker">${frame.kicker}</div>
      <h1>${frame.headline}</h1>
      <div class="shot"><img src="data:image/png;base64,${img}"></div>
    </body></html>`;
    await shotPage.setContent(html, { waitUntil: "networkidle" });
    await shotPage.evaluate(() => document.fonts.ready);
    await shotPage.waitForTimeout(300);
    await shotPage.screenshot({ path: path.join(OUT, frame.out) });
    console.log("framed", frame.out);
  }

  await browser.close();
  console.log("DONE");
})();
