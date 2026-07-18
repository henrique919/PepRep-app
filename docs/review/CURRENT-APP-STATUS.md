# PepRep — Current App Status

**Review date:** 2026-07-18 · **Reviewer:** principal engineering/design/privacy audit (Claude)
**Repo:** `henrique919/PepRep-app` · **Branch:** `main` · **HEAD:** `8b1211e`
**Scope of this run:** inspection + documentation only. No product code was changed.

---

## 1. Baseline (measured, not assumed)

| Check | Command | Result |
|---|---|---|
| Unit/integration tests | `bun x jest` | **126 passed / 126, 12 suites** |
| Typecheck (strict) | `bun x tsc --noEmit` | **clean, exit 0** |
| Working tree | `git status` | clean at review time |
| Package manager | — | **bun** (scripts call `bunx rork …`) |

Recent commits show an active **"Mineral Protocol" design pass** (`a2a58d8`, `d13ccd4`,
`bc12e52`, `0490222`) plus a zod peer fix (`8b1211e`). Design realization has advanced since
the ChatGPT audit; correctness scaffolding is strong.

> Note: `bun run typecheck` / `bun run test` scripts are present (T0.0). Prefer those over
> bare `bun x tsc` / `bun x jest` for CI parity.

## 2. Architecture map

- **Runtime:** React Native + Expo SDK 54, new architecture enabled, TypeScript strict.
- **Router:** expo-router, typed routes. Tabs: Today · Calculate · Reference · Vials · History.
  Stack routes: `/plans/*`, `/vial-new`, `/log-entry`, `/log-plan`, `/settings`, `/about`,
  `/onboarding`.
- **State:** Zustand stores — `doses`, `ledger`, `plans`, `vials`, `reminders`, `settings`.
- **Engine:** `src/engine/` — pure TS (`calculateDraw`, `calculateDiluent`, `syringe`,
  `schedule`, `inventory`, `parse`). No RN/I/O. **Source of truth; UI never computes.**
- **Persistence:** `src/db/adapter.ts` → **plain AsyncStorage** behind a `StorageAdapter`
  interface, key-prefixed `peprep.`. Migrations in `src/db/migrations.ts` (+ `migrate-v1`).
  Inventory is an **append-only txn ledger** (`db/ledger.ts`, `db/vialBalance.ts`) — remaining
  is derived, not stored. History (`DoseEvent`) is denormalised + immutable (void, never delete).
- **Notifications:** `expo-notifications`, local only, **daily trigger**, standalone
  `reminders` store **not wired to plans**; web-gated off.
- **AI (Ask):** `src/ask/*` → Rork toolkit SDK (`@rork-ai/toolkit-sdk`) → Rork `/llm/text`.
  Retrieval-grounded on `src/data/compounds.ts` + glossary.
- **Export:** `expo-file-system` + `expo-sharing` (CSV/JSON) from Settings; web-gated.
- **Release config:** `app.json` — see §5 finding F6.

## 3. Golden calculations — verified against the live engine

Run via a throwaway script importing `./src/engine`. All correct:

| Case | Expected | Engine result |
|---|---|---|
| 5 mg / 2 mL / 250 mcg | 2500 mcg/mL, 0.1 mL, 10 U, 20 doses, no warn | ✅ exact |
| 5 mg / 250 mcg / target 10 U | 2 mL diluent | ✅ 2 mL |
| 10 mg / 2 mL / 0.5 mg | 5 mg/mL, 0.1 mL, 10 U, 20 doses | ✅ exact |
| 40 U on 30-unit cap | **40 U unchanged** + "more than a 30-unit syringe" warn | ✅ result unchanged, warns |
| 0 / −1 / NaN | 3 errors | ✅ 3 errors |
| dose > vial (1 mg/1 mL/2 mg) | "larger than the total" warn | ✅ warns |
| sub-2-unit (10 mg/1 mL/100 mcg) | 1 U + "under 2 units" warn | ✅ warns |
| **Capacity regression 30/50/100** | **all 10 U** | ✅ all 10 U |

**The category-defining competitor bug (capacity used as units/mL) is absent.** The engine is
the strongest asset in the product and is test-locked.

## 4. Prior-audit reconciliation (ChatGPT task `019f72bf…`)

| # | Finding | Verdict | Evidence |
|---|---|---|---|
| 1 | Safety numbers tween through false values | **STILL PRESENT (P0)** | `src/components/ui/AnimatedReadout.tsx:34–43` counts `fmt(value*eased)` up over 420 ms; used on `draw-units-readout` and `water-ml-readout` in `app/(tabs)/index.tsx:429,489` |
| 2 | Ask enabled by default, transmits to Rork | **STILL PRESENT (P0)** | `src/store/settings.ts:30,42` `askEnabled: true` "Default ON". Payload layer now correct (system role, ≤120-word cap, forbidden-key tests in `payload.ts`); **red-team still incomplete** |
| 3 | Apple medical/dosage review risk | **REQUIRES LEGAL/STORE VERIFICATION** | Not resolvable in code; see OWNER-DECISIONS |
| 4 | Labels not bound to inputs; weak semantics | **STILL PRESENT (P0)** | Only 3 files use any a11y prop; `src/components/ui/Field.tsx` renders label as sibling `AppText`, **no `accessibilityLabel` on the `TextInput`** |
| 5 | Sensitive data in AsyncStorage, unencrypted | **STILL PRESENT** | `src/db/adapter.ts` plain AsyncStorage; no encryption layer |
| 6 | Rork-owned store identity | **STILL PRESENT (P0)** | `app.json`: `scheme:"rork-app"`, `ios/android` id `app.rork.fdbzggh0h14wkaztx609o`, router `origin:"https://rork.com/"`; `owner:"henrique919"` (Expo acct is Harry's), EAS `projectId d5833765…` (verify owner) |
| 7 | Fixed 5/2/250 demo; onboarding ends empty | **PARTLY FIXED** | `app/onboarding/index.tsx` now exists + gated in `app/_layout.tsx`; dose no longer prefilled; **vial=5/water=2 still default** in `app/(tabs)/index.tsx:151–152`. Verify onboarding ends on a saved vial |
| 8 | Recon/Reverse jargon; retention loop | **PARTLY FIXED / VERIFY** | Modes are task-oriented internally (`draw`/`water`); confirm current display labels read as tasks; log→vial→plan→today→log loop largely exists (dual-write `doses`↔`ledger`) |
| 9 | Inventory: expiry/BUD/lot/low-stock/ledger | **PARTLY FIXED** | Ledger ✅ (`db/ledger.ts`), reconstitution date ✅ (`models.ts:48`), archive ✅ (`models.ts:49`). **Missing: expiry/BUD, lot, low-stock threshold + warnings** |
| 10 | Privacy wording precision | **STILL PRESENT** | Settings privacy copy correctly names the Ask exception ✅, but **`README.md` and `adapter.ts` docstring falsely claim "no network / fully offline"** — Ask calls Rork. Fix stale claims |

## 5. Notable defects found this review (beyond the prior audit)

- **F1 detail:** the numeric count-up is the single most serious issue — a measurement app must
  never display a wrong number, even transiently, on a safety-relevant readout. Decorative
  scale-spring is acceptable; the numeral must be atomic.
- **Truthfulness (F10):** `README.md` ("Fully offline: no network calls") and
  `src/db/adapter.ts` ("there is no network anywhere in the app") are now false because Ask
  exists. These are user-facing/contributor-facing accuracy defects.
- **Reduced motion:** `AnimatedReadout` and `SyringeGauge` animate unconditionally; no
  `useReducedMotion()` gate. Accessibility + safety adjacency.
- **Tablet:** `ios.supportsTablet: false` — the audit asked for tablet/desktop widths.

## 6. Launch verdict

**Not launch-ready. Strong substance, blocked on trust/safety/store gates.**

The foundations (correct engine, auditable ledger, immutable history, honest reference data,
local-first, no paywall) are the best in the category and are test-backed. But three P0s make
shipping irresponsible today: (1) safety numbers that visibly display wrong values mid-animation,
(2) Ask defaulting on with an incomplete red-team, and (3) Rork-owned store identity that
prevents the owner from controlling the listing — alongside accessibility blockers and inaccurate
privacy/offline claims. None require new architecture; all are addressable in the ACTION-QUEUE.

**What most changed the verdict from the prior audit:** the engine and test coverage are now
verified solid (126 green, all golden cases correct), so correctness is *not* the blocker —
the blockers are the safety-display defect, Ask defaults, accessibility, and store identity.
