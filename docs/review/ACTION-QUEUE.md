# PepRep — Action Queue

Dependency-aware, ordered by **launch risk and user harm**, not feature novelty.
Evidence is in `CURRENT-APP-STATUS.md`. Work top to bottom within a priority band.

Each item: **[ID] Priority — Title** · *Evidence* · *Outcome* · *Scope / Non-scope* ·
*Files* · *Migration* · *Accept* · *Tests* · *Manual checks* · *Supabase* · *Rollback* ·
*Depends / gate* · *Completion evidence*.

Commands: `cd expo && bun x tsc --noEmit` · `cd expo && bun x jest` · web: `bun run start-web`.

---

## P0 — launch-blocking / user-harm

- [x] **T0.0 — Add `typecheck` + `test` scripts**
  Evidence: no such scripts in `expo/package.json`. Outcome: reproducible CI-able checks.
  Scope: add `"typecheck":"tsc --noEmit"`, `"test":"jest"`. Non-scope: changing `start`.
  Files: `expo/package.json`. Migration: none. Accept: `bun run typecheck && bun run test`
  pass. Tests: n/a. Manual: none. Rollback: revert. Gate: none. Evidence: command output.
  **Done 2026-07-18:** scripts already present (`"typecheck":"tsc --noEmit"`, `"test":"jest"`).
  Verified: `bun run typecheck` exit 0; `bun run test` → 126/126 passed.

- [x] **T0.1 — Atomic safety-number display (kill the count-up tween)**
  Evidence: `src/components/ui/AnimatedReadout.tsx:34–43` tweens `fmt(value*eased)`; used on
  `draw-units-readout` + `water-ml-readout`. Outcome: safety numbers never show a false
  transient value. Scope: readout shows the final value immediately; keep the decorative
  scale-spring on the shell only; gate motion on reduced-motion. Non-scope: syringe fill
  motion (decorative, may animate). Files: `AnimatedReadout.tsx`, `app/(tabs)/index.tsx`.
  Migration: none. Accept: the numeral equals the final value on the first painted frame and
  never displays an intermediate number. Tests: unit test asserting the rendered text equals
  `fmt(finalValue)` on mount (no interpolation); add a regression note. Manual: type into
  water/draw inputs, screen-record, confirm no count-up; verify with reduced motion on.
  Rollback: revert component. Gate: none. Evidence: test + screen recording.
  **Done 2026-07-18:** Removed rAF count-up; numeral is `fmt(value)` on first paint; shell
  spring only, skipped when `useReducedMotion()`. Regression:
  `src/engine/__tests__/atomic-readout.test.ts`. Manual screen recording still recommended
  on device.

- [x] **T0.2 — Ask defaults OFF + explicit just-in-time consent (or remove for v1)**
  Evidence: `src/store/settings.ts:30,42` `askEnabled:true`. Outcome: no question text leaves
  the device without a deliberate, informed opt-in. Scope: default `askEnabled:false`; first
  use shows a JIT consent sheet naming provider (Rork AI Cloud), purpose, what is/ isn't sent,
  and retention; only then enable. Keep the Privacy toggle. **Preferred alternative: remove
  Ask from v1** behind a flag if consent/red-team can't land pre-launch. Non-scope: changing
  the guardrail prompt. Files: `settings.ts`, `app/(tabs)/reference/ask.tsx`,
  `app/onboarding/*`. Migration: existing users default to OFF on read (treat missing/true as
  off until re-consented — decide in OWNER-DECISIONS). Accept: fresh install = Ask off, no
  network until consent. Tests: settings default test; `ask` client returns `disabled` when
  off (exists). Manual: fresh install → Ask off; consent flow enables; offline/exhausted
  states intact. Rollback: flag. Gate: **owner decision** (keep vs remove) + T3 red-team.
  Evidence: test + flow recording.
  **Done 2026-07-18 (keep-with-consent path):** default OFF; legacy ON without consent forced
  OFF; JIT `AskConsentCard` in Settings + Ask; `acceptAskConsent` only enable path; tests in
  `src/store/__tests__/askConsent.test.ts` + existing disabled client test. **Still gated for
  shipping Ask to users:** OD-1 (keep vs remove) + T3.1 human red-team sign-off.

- [ ] **T0.3 — Accessibility blockers** *(partial — code landed, device sweep open)*
  Evidence: only 3 files use a11y props; `src/components/ui/Field.tsx` binds no
  `accessibilityLabel` to its `TextInput`. Outcome: usable with screen readers + large type.
  Scope: bind visible label → input (`accessibilityLabel`/`aria-label`), roles/states on
  buttons/toggles/segmented controls, error announcements, logical focus order, ≥44pt targets,
  Dynamic Type/font-scaling without clipping, contrast AA, `useReducedMotion()` gating.
  Non-scope: full WCAG certification. Files: `src/components/ui/*`, screens. Migration: none.
  Accept: VoiceOver/TalkBack reads every input's name+value; controls announce role+state;
  nothing clips at largest Dynamic Type; reduced motion honored. Tests: RTL queries by
  accessible name for key inputs/buttons. Manual: VoiceOver (iOS) + TalkBack (Android) sweep
  of Calculate, Today log, New plan, Settings. Rollback: per-component. Gate: none. Evidence:
  screen-reader recording + notes.
  **Progress 2026-07-18:** `Field` binds `accessibilityLabel` (+ optional error alert);
  `Button` role/label/state; `FilterChips` selected state + 44pt; Ask Switch labeled;
  reduced-motion via T0.6. Remaining: icon-only Pressables, Dynamic Type clip audit, RTL
  accessible-name tests, VoiceOver/TalkBack recordings — leave unchecked until device sweep.

- [ ] **T0.4 — PepRep-owned store identity**
  Evidence: `app.json` `scheme:"rork-app"`, ids `app.rork.fdbzggh0h14wkaztx609o`, router
  `origin:"https://rork.com/"`. Outcome: owner controls the store listing + deep links.
  Scope: set bundle/package to an owner domain (e.g. `app.peprep.mobile` /
  `com.henrique919.peprep` — owner picks), `scheme` to `peprep`, remove/replace rork.com
  origin if not required, confirm EAS `projectId d5833765…` is under `henrique919`, set
  version/build, audit permissions + deep links. Non-scope: publishing. Files: `app.json`,
  `eas.json`. Migration: none (pre-launch id change is free; after launch it is a new app).
  Accept: no `rork` identifiers remain except intentional SDK deps; scheme resolves;
  `expo prebuild`/build config valid. Tests: config lint. Manual: deep-link smoke; build
  config check. Rollback: revert `app.json`. Gate: **owner** (choose bundle id + confirm EAS
  ownership). Evidence: diff + build config output.

- [x] **T0.5 — Privacy/offline truthfulness**
  Evidence: `README.md` "Fully offline: no network calls" and `src/db/adapter.ts` "there is no
  network anywhere in the app" — false because Ask calls Rork. Outcome: every claim matches
  behavior. Scope: correct README + adapter docstring to state local-first *except* opt-in Ask;
  audit all privacy copy for precision (Settings copy already names the Ask exception — keep).
  Do not claim E2EE or "nothing leaves your device" unconditionally. Non-scope: new features.
  Files: `README.md`, `src/db/adapter.ts`, any privacy strings. Migration: none. Accept: no
  inaccurate offline/privacy claim remains. Tests: n/a. Manual: read every privacy string
  against actual data flow. Rollback: revert. Gate: none. Evidence: diff.
  **Done 2026-07-18:** README + `adapter.ts` now state local-first with opt-in Ask as the only
  network path. Remaining "nothing leaves" phrasing is scoped to local notifications / Ask-off.

- [x] **T0.6 — Reduced-motion + no motion on safety numbers (covers T0.1/T0.3 overlap)**
  Evidence: `AnimatedReadout`, `SyringeGauge` animate unconditionally. Outcome: respects OS
  reduce-motion. Scope: `useReducedMotion()` disables spring/fill animation; numerals already
  atomic per T0.1. Files: both components. Accept: reduce-motion on → no animation, correct
  static values. Tests: hook-mocked render. Manual: toggle OS reduce-motion. Gate: none.
  **Done 2026-07-18:** `useReducedMotion()` on `AnimatedReadout` (no shell spring) and
  `SyringeGauge` (fill + appear jump to final). Hook-mocked RTL render deferred (Jest node-only);
  manual OS toggle still recommended.

## P1 — durability, retention, honest inventory, optional backup

- [ ] **T1.1 — Onboarding ends on a real saved vial (+ optional plan/reminder)**
  Evidence: `app/onboarding/` exists; `app/(tabs)/index.tsx:151–152` still defaults
  vial=5/water=2. Outcome: first run ends with the user's own saved vial, not a demo. Scope:
  onboarding walks user-entered vial → save; optional user-entered plan/reminder; drop or
  clearly neutralize the 5/2 prefill so it never reads as a suggested setup. Non-scope: demo
  data. Files: `app/onboarding/*`, calculator prefill. Accept: completing onboarding creates a
  persisted vial owned by the user; Today reflects it. Tests: onboarding persistence test.
  Manual: fresh install → finish → relaunch → vial persists. Gate: none.

- [ ] **T1.2 — Retention loop verified end-to-end**
  Evidence: dual-write `doses`↔`ledger` exists; earlier gaps: no "Save as vial" on calc, no
  "Calculate with vial" from a vial. Outcome: calc → Save vial → Create plan → Today →
  Log/Skip/Snooze → remaining + history update, unbroken. Scope: add the two missing wires;
  verify snooze exists or add. Files: `app/(tabs)/index.tsx`, `vials.tsx`, `vial-new.tsx`,
  `plans/*`, `today.tsx`. Accept: the full loop works and survives relaunch; un-log restores
  remaining exactly. Tests: ledger round-trip (exists) + wiring tests. Manual: full loop on
  device. Gate: none.

- [ ] **T1.3 — Inventory fields: expiry/BUD, lot, low-stock**
  Evidence: `models.ts` has `reconstitutedAtIso` + `archivedAtIso`; **no expiry/BUD, lot,
  low-stock**. Outcome: real-world vial tracking. Scope: add optional `expiresAtIso`/BUD,
  `lot`, `lowStockThreshold`; surface expiry + low-stock warnings (non-prescriptive, factual).
  Non-scope: recommending discard. Files: `models.ts`, migration, `vials.tsx`, `vial-new.tsx`,
  `VialCard.tsx`. Migration: **additive, versioned**; back-fill nulls; never lose data. Accept:
  fields persist; warnings show when past expiry / below threshold. Tests: migration test +
  warning logic (pure). Manual: set expiry in past → warning; relaunch persists. Gate: none.

- [ ] **T1.4 — Plan → reminder wiring + per-weekday scheduling + privacy previews**
  Evidence: `reminders.ts` is daily-only, standalone, unconnected to plans. Outcome: a plan can
  schedule per (day×time) local notifications; previews don't leak compound/dose. Scope: add
  weekly-per-day scheduling; a plan "remind me" toggle; a privacy mode hiding compound/dose in
  the notification body; cancel on plan edit/delete; web shows the info note. Files:
  `reminders.ts`, `plans/new.tsx`, `plans/[id]`. Accept: N notifications for N day×time combos;
  delete cancels; privacy-mode body is generic. Tests: schedule-count logic. Manual: device
  notification fires; preview respects privacy mode. Gate: none.

- [ ] **T1.5 — Export warnings + protected sharing**
  Evidence: CSV/JSON export in Settings. Outcome: user understands exports are unencrypted
  plaintext of health-adjacent records. Scope: pre-export warning; optional encrypted export
  (ties to T1.7); filename without PII. Files: `settings.tsx`, export helpers. Accept: warning
  shown before share; optional encrypted file works. Tests: export formatting. Manual: export
  on device. Gate: none.

- [ ] **T1.6 — Local DB durability + migration hardening**
  Evidence: `migrate-v1` test passes; single migration so far. Outcome: forward-only chain that
  never loses data across versions. Scope: document + test the migration runner; add a
  corruption-tolerant hydrate path. Files: `db/migrations.ts`, `db/adapter.ts`. Accept: v(n-1)
  fixture → current with zero loss; malformed record is quarantined, not fatal. Tests:
  migration fixtures. Gate: none.

- [ ] **T1.7 — Optional encrypted backup file (local-first; NO account for v1)**
  Evidence: Supabase project unverified this session; recommend backup-files over sync (see
  SUPABASE-SAFETY-INVENTORY §4). Outcome: user can create + restore an encrypted backup file.
  Scope: export → client-side encrypt → save/share; restore validates manifest (schema/app/
  device/timestamp/checksum/size), previews, confirms, never silently overwrites. Non-scope:
  accounts, record sync, cloud auth. Files: new `src/backup/*`, `settings.tsx`. Migration:
  none. Accept: round-trip restore reproduces state; wrong-version/corrupt file is rejected
  safely. Tests: encrypt/decrypt round-trip, manifest validation, restore-preview. Manual:
  backup → erase → restore. Rollback: feature flag. Gate: **owner** (confirm v1 = files, not
  sync). Supabase: none for v1; if uploading later, apply SUPABASE-SAFETY-INVENTORY §5.

## P2 — polish & competitive depth (after P0/P1)

- [ ] **T2.1** Interaction polish + reduced-motion-aware microinteractions (springy sheets,
  haptics on log/save/skip) — instrument, not toy.
- [ ] **T2.2** Interactive injection-site body map (rotation heat), keyboard/AT accessible.
- [ ] **T2.3** More complex schedules (everyN-days, cycles the *user* defines) — no templates.
- [ ] **T2.4** Selected export improvements (date-range, per-vial ledger CSV).
- [ ] **T2.5** Craft pass on hero surfaces + app icon (see prior ROADMAP.md Tier C).

## P3 — safety verification (human-gated; do not self-certify)

- [ ] **T3.1 — Ask red-team, all vectors** *(HUMAN-GATED)*
  The guardrail was tested on ~1 of 6 vectors and leaked 6/8 previously. Extend
  `src/ask/__tests__/ask.eval.test.ts` to cover direct-dose, roleplay/hypothetical, indirect
  "what do studies use", authority/permission, comparative/efficacy, incremental. **Report
  every leak verbatim; do not mark done without human sign-off.** Ask must not ship to real
  users until this passes. Gate: **owner/human**.

## Deferred unless separately approved
AI scanner, AI protocol builder, community protocols, personalized advice, health-platform
integrations, biomarkers, PK curves, subscriptions, broad feature cloning.

---

## Work log

### 2026-07-18 — implementation loop
- **T0.0:** Scripts already in `expo/package.json`. `bun run typecheck` clean; `bun run test` 126/126.
- **T0.1:** Root cause: `AnimatedReadout` rAF-eased `fmt(value * eased)`. Fix: render `fmt(value)`
  atomically; decorative scale spring only; honor `useReducedMotion`. Accept met in code +
  contract test (RTL mount test deferred — Jest is node/engine-only).
- **T0.5:** Corrected false "fully offline / no network" claims in README + adapter docstring.
- **T0.6:** SyringeGauge + AnimatedReadout gate decorative motion on `useReducedMotion()`.
- **T0.2:** Ask default OFF + JIT consent; OD-1/T3.1 still gate enabling for real users.
- **T0.3:** Partial a11y on Field/Button/FilterChips; device sweep still required.
- **Owner gates open:** T0.4 (bundle id), OD-1/2/3/4/5/6/7, T3.1.

## Definition of complete (program)
- Every P0 checked; `bun x tsc --noEmit` clean; `bun x jest` green.
- Safety numbers atomic; reduced motion honored; a11y sweep passed on device.
- Ask off-by-default with consent (or removed); no `rork` store identity; privacy claims true.
- P1 retention loop + inventory + optional encrypted backup complete and tested.
- P3 red-team passed with human sign-off **before Ask is enabled for users**.
- Native builds, store-review evidence, and owner/legal gates (OWNER-DECISIONS) resolved.
- No dead buttons, no fake cloud behavior, no placeholder security, no inaccurate claims.
