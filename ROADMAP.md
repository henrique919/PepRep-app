# PepRep — Completion Roadmap

This file is the single source of truth for finishing PepRep. It is written to be executed
as an **autonomous loop**. Work top to bottom. Do not skip a tier.

The app is already structurally complete: engine, ledger, migrations, Reference, Ask and
all screens exist. What remains are **wiring gaps, one broken input chain, and polish** —
not new architecture. Do not rebuild what works.

---

## LOOP PROTOCOL (read every iteration)

1. Open this file. Find the **first unchecked `- [ ]` task**, top to bottom.
2. Read the task's *Files*, *Root cause* and *Do*. Read those files before editing.
3. Implement the smallest change that satisfies the *Accept* criteria.
4. Verify — all three must pass before you check the box:
   - `cd expo && bunx tsc --noEmit`  → clean, no errors
   - `cd expo && bunx jest`          → green (add tests where the task says to)
   - The task's *Accept* criteria, checked by reading the code / running the web app
5. Tick the box (`- [x]`), append a one-line note under the task with what you did.
6. `git add -A && git commit -m "roadmap: <task id> <short summary>"`.
7. Repeat from step 1. Stop only when every box in Tiers 0–2 is ticked, or a task is
   marked **[NEEDS-INPUT]** / **[HUMAN-GATED]** — for those, stop and report.

### Rules that never change
- **The syringe rule:** a U-100 syringe is always 100 units/mL. Capacity (30/50/100) is
  barrel volume only. `syringeCapacityUnits` must never appear in an expression that
  produces units. Never render "U-30"/"U-50".
- **No arithmetic outside `src/engine/`.** Screens render engine output; they never compute.
- **No recommendations.** No dose, range, protocol, cycle, stack or efficacy text anywhere,
  including Ask output. This is absolute and independent of every other change here.
- **History is immutable; inventory is derived from txns.** Never add an editable balance
  field. Never mutate a `DoseEvent`. Editing a plan appends a `ScheduleVersion`.
- **No dead buttons.** If a control can't act, disable it *and* show why. If a feature isn't
  built, don't render its control.
- Tokens only — no hardcoded colours/spacing/radii/fonts outside `src/theme/tokens.ts`.

### Commands (there is no npm test/typecheck script yet — Task 0 adds them)
- Typecheck: `cd expo && bunx tsc --noEmit`
- Tests: `cd expo && bunx jest`
- Web preview: `cd expo && bun run start-web`

---

## TIER 0 — BROKEN / DEAD (fix first; these are the "does nothing" bugs)

- [x] **T0.1 - Add `typecheck` and `test` scripts**
  - Files: `expo/package.json`
  - Do: add `"typecheck": "tsc --noEmit"` and `"test": "jest"` to `scripts`. Confirm
    `bunx jest` already discovers `src/**/__tests__`. Do not change the Rork `start` script.
  - Accept: `cd expo && bun run typecheck && bun run test` both run and pass.
  - Note: added typecheck/test scripts; fixed timezone-brittle schedule.test.ts so jest passes in non-UTC zones.

- [x] **T0.2 — New Plan: "Add time" does nothing → and so "Create plan" is permanently dead**
  - Files: `expo/app/plans/new.tsx`
  - Root cause: `addTime()` requires the strict regex `^([01]\d|2[0-3]):([0-5]\d)$`, so
    typing `8:00`, `8`, `8am` (or anything without a leading zero) silently returns and
    adds nothing. Because `canSave` requires `timesLocal.length > 0`, the **"Create plan"
    button stays `disabled` forever** — it isn't broken, it's blocked by the time input.
    These are ONE bug, reported as two.
  - Do: replace the free-text `HH:mm` field + Add button with the **hour + minute picker
    pattern that already works in `app/settings.tsx`** (numeric hour field 0–23 + minute
    chips 00/15/30/45), or a proper native time picker. Normalise to `HH:mm` on add. Keep
    the removable time chips list. If you keep any text entry, accept `8:00`→`08:00` and
    show an inline validation message on bad input — never fail silently.
  - Accept: entering a time with no leading zero adds a chip; once a compound, dose, ≥1 day
    and ≥1 time exist, "Create plan" enables and creates the plan; it then appears on Today.
  - Note: replaced free-text HH:mm with hour 0–23 field + minute chips; normalises via formatTimeOfDay; inline errors on bad/duplicate times.

- [x] **T0.3 — Ask input text is invisible (dark-on-dark on web)**
  - Files: `expo/src/components/ui/Field.tsx`, and add `expo/app/+html.tsx` if absent.
  - Root cause: the `TextInput` itself has no `backgroundColor`; only its wrapper does. Under
    a browser/OS in dark mode, the DOM `<input>` gets the UA's dark field background while
    the text stays `colors.ink` (#1C1B18) → dark text on a dark field = invisible. Affects
    every Field, most visible in Ask.
  - Do: (a) give the `TextInput` an explicit `backgroundColor: colors.surface` and keep
    `color: colors.ink`; (b) add a web `color-scheme: light` (via `app/+html.tsx` `<meta>`
    or a global style) so the browser stops recolouring form controls. (Full dark theme is
    T3.1 — this task only guarantees legibility now.)
  - Accept: in a dark-mode browser, typed text and placeholder are clearly legible in Ask and
    every other input.
  - Note: Field TextInput gets colors.surface background; +html.tsx forces color-scheme light so web UA dark mode cannot hide ink text.

- [x] **T0.4 — Calculator "Log this dose" loses context and looks like it goes nowhere**
  - Files: `expo/app/(tabs)/index.tsx` (`logThisDose`, ~L76), `expo/app/log-entry.tsx`
  - Root cause: `logThisDose` pushes to `/log-entry` **without** `compoundName`, even though
    the calculator holds `compoundLabel`. The log-entry opens with an empty peptide field,
    logs an ad-hoc entry that ties to no plan and (unless a vial is picked) no inventory, and
    returns with no confirmation — so it "goes nowhere" to the user. It does persist to
    History via the dual-write in `store/doses.ts`.
  - Do: pass `compoundName` (and `massUnitConvention` if known) into `/log-entry`; prefill the
    peptide field from it. On save, show a brief confirmation (toast/inline) and offer "View in
    History". Do not create a second store — the doses↔ledger dual-write is correct.
  - Accept: logging from the calculator arrives at log-entry with the compound name filled;
    after save the user sees confirmation and the entry appears in History.
  - Note: calculator logThisDose passes compoundName; log-entry prefills peptide and shows saved confirmation with View in History.

---

## TIER 1 — WIRING (make the pieces talk to each other)

- [x] **T1.1 — Calculator ↔ Vials: "Save as vial"**
  - Files: `expo/app/(tabs)/index.tsx`, `expo/app/vial-new.tsx`
  - Root cause: the calculator can compute a draw but cannot persist it as a vial; `vial-new`
    accepts no prefill. The two never connect (your "creating a vial just sits there").
  - Do: add a **"Save as vial"** action on the draw result that deep-links to `/vial-new`
    with `vialMg`, `diluentMl`, `syringeCapacity` and (if set) `compoundName` prefilled.
    Extend `vial-new.tsx` to read those params. Saving must create the Vial + its initial
    inventory txn exactly as today (via `useVialsStore.addVial`). This satisfies the
    architecture's "Save as vial → Vial + CalcSnapshot + initial txn" link — add a
    `CalcSnapshot` if the model supports it; if not, note it and skip (don't invent schema).
  - Accept: from a valid draw, "Save as vial" opens vial-new with fields filled; saving lands
    a vial in the Vials tab whose concentration matches the calculator.
  - Note: draw result → Save as vial deep-links `/vial-new` with vialMg/diluentMl/syringeCapacity/compoundName prefill; CalcSnapshot exists in db/types + snapshotsRepository but Vial has no snapshotId — skipped (no schema invent; addVial unchanged).

- [x] **T1.2 — Vials → Calculator: "Calculate with this vial"**
  - Files: `expo/app/(tabs)/vials.tsx` or `src/components/domain/VialCard.tsx`,
    `expo/app/(tabs)/index.tsx`
  - Root cause: a saved vial can't send its numbers back into the calculator.
  - Do: add a per-vial action ("Calculate" / "Reconstitute") that deep-links to the Calculate
    tab with `vialMg`, `diluentMl`, `syringeCapacity`, `compoundName` prefilled. Extend the
    calculator's param handling (it currently reads only `compoundName`/`massUnitConvention`)
    to also accept `vialMg`/`diluentMl`/`capacity` and populate the fields via the existing
    `useEffect`.
  - Accept: tapping Calculate on a vial opens the calculator pre-filled and showing that
    vial's draw immediately.
  - Note: VialCard Calculate deep-links `/(tabs)/` with vialMg/diluentMl/syringeCapacity/compoundName; calculator useEffect + initial state populate vialText/waterText/capacity.

- [x] **T1.3 — Reverse mode ("Draw → water") has no syringe visual**
  - Files: `expo/app/(tabs)/index.tsx` (the `mode === "water"` result block, ~L286–333)
  - Root cause: `SyringeGauge` is only rendered in the `draw` branch. The reverse result knows
    the target units the user asked for, so it can render the same gauge.
  - Do: render `<SyringeGauge units={targetUnits} capacity={100} />` in the water-result card
    (target units are already parsed). Label it so it's clear this is the draw the water volume
    produces.
  - Accept: the reverse calculator shows a syringe filled to the target units alongside the
    water volume.
  - Note: water-result card renders SyringeGauge at targetUnits/capacity 100 with caption "Draw this water volume produces".

- [x] **T1.4 — Make the two calculator modes newbie-legible**
  - Files: `expo/app/(tabs)/index.tsx` (`SegmentedControl`, ~L112–120)
  - Root cause: labels "Dose → draw" / "Draw → water" are jargon.
  - Do: relabel and add a one-line subtitle under the segmented control that changes with mode:
    - Mode `draw` → tab label **"How much do I draw?"** · subtitle *"You've mixed your vial.
      Enter the water you added and your dose — see the units to draw."*
    - Mode `water` → tab label **"How much water do I add?"** · subtitle *"Before you mix.
      Pick the dose and the draw size you want — see how much water to add."*
    - Keep the internal `CalcMode` values `draw`/`water` unchanged; change display text only.
  - Accept: a first-time reader can tell the two modes apart without knowing the jargon.
  - Note: SegmentedControl labels + mode-dependent caption subtitle only; CalcMode draw/water unchanged.

- [x] **T1.5 — Plan reminders / "create alarm notification for doses"**
  - Files: `expo/app/plans/new.tsx`, `expo/src/store/reminders.ts`, `src/store/plans.ts`
  - Root cause: `reminders.ts` schedules real local notifications but only a single **daily**
    time, is a standalone store, and is **not connected to plans**. Plans carry
    `daysOfWeek` + `timesLocal` and offer no reminder toggle.
  - Do: add a **"Remind me for this plan"** toggle to plan creation. On enable, schedule one
    local notification per (day-of-week × time) using weekly triggers (extend `reminders.ts`
    with a `scheduleWeekly({weekday,hour,minute})` alongside the existing daily path). Track
    the created `notificationId`s on the plan/reminder so editing or deleting the plan cancels
    them. Notification copy must be factual and non-prescriptive: `"<compound> — <dose> planned,
    <time>"`. Web has no local notifications: show the same "available in the mobile app" note
    the Settings screen already uses; never render a dead toggle on web.
  - Accept: creating a plan with the reminder on schedules a notification per day/time on
    device; deleting the plan cancels them; web shows the info note, not a broken control.
  - Note: scheduleWeekly + cancel helper; Plan.reminderNotificationIds; addPlan remindMe schedules day×time weekly copy; archivePlan cancels; native toggle / web info note.

- [ ] **T1.6 — [NEEDS-INPUT] Ask: restore a real system role + fix truncation + brevity**
  - Files: `expo/app/(tabs)/reference/ask.tsx` (~L57–68), `expo/src/ask/client.ts`,
    `expo/src/ask/systemPrompt.ts`
  - Root cause: the guardrail system prompt is **folded into the user turn** because the Rork
    SDK's `generateText` accepts only user/assistant. This weakens the guardrail (the whole
    refusal policy now sits in the position an injection attack occupies) and the verbose
    answers get **truncated** (no max-token/brevity control).
  - Do:
    - If the Ask transport can send a real `system` role (Rork SDK option, or the Vercel/
      Anthropic messages endpoint you intend to use), switch to it and stop folding.
      **This needs the endpoint URL + auth method — mark blocked and report if not provided.**
    - Regardless: add a response length cap and instruct brevity in the system prompt
      ("answer in ≤120 words; prefer 3–5 sentences"); ensure the client surfaces truncation
      as a complete-but-short answer, not a mid-sentence cut.
    - Keep Ask a leaf: offline/exhausted/rate-limited states unchanged; never block the app.
  - Accept: a corpus question returns a complete, concise answer; the directionality/refusal
    rules still hold (see T3.3); no answer ends mid-sentence.

---

## TIER 2 — CLARITY & POLISH

- [ ] **T2.1 — Settings discoverability**
  - Files: `expo/app/(tabs)/reference/index.tsx`, `expo/app/(tabs)/today.tsx`
  - Root cause: Settings is only reachable from the Today gear (top-right), which you found
    unclear. The 5 tabs are full, so a "More" tab isn't available.
  - Do: add a labelled **"Settings"** row (and "About", "Glossary") to the bottom of the
    Reference tab — Reference is the natural home for info/config back-pages. Keep the Today
    gear too. Ensure both route to `/settings`.
  - Accept: Settings is reachable from Reference in one tap, with a visible text label.

- [ ] **T2.2 — Calculator log vs save clarity**
  - Files: `expo/app/(tabs)/index.tsx`
  - Do: with T0.4 and T1.1 done, make the two secondary actions unambiguous — primary
    **"Save as vial"** (reusable), secondary **"Log this dose"** (one-off record). Short helper
    text under each so the user knows where each goes.
  - Accept: it's obvious which button creates a vial and which records a dose.

- [ ] **T2.3 — Empty/scarce states pass a skim test**
  - Files: Today, Vials, History, Reference, Ask
  - Do: verify every empty state has one honest sentence + one real action (most already do).
    Fix any that show a bare list or a dead control. No fake/sample rows.
  - Accept: each primary screen with no data explains itself and offers a next step.

- [ ] **T2.4 — Privacy copy tracks the Ask transport**
  - Files: `expo/app/settings.tsx` (~L386)
  - Do: if T1.6 changes the Ask provider away from Rork AI Cloud, update the privacy sentence
    to name the actual destination. It must stay literally true.
  - Accept: the privacy text names the real service that receives Ask question text.

---

## TIER 3 — HARDENING & DEPTH (do after Tiers 0–2 are green)

- [ ] **T3.1 — Real dark theme (durable answer to T0.3)**
  - Do: promote `tokens.ts` to theme-aware (light + dark palettes) and consume via a theme
    hook; honour `useColorScheme()`. Keep the warm-paper light theme as default. This replaces
    the T0.3 stopgap with a designed dark mode.
  - Accept: light and dark both fully styled; no illegible controls in either.

- [ ] **T3.2 — CalcSnapshot on save/log (if not added in T1.1)**
  - Do: persist a `CalcSnapshot` when a draw is saved as a vial or logged, and surface it on
    the History event detail ("show the saved math"). Only if the model supports it; otherwise
    add the model field via a migration — never lose existing data.
  - Accept: a logged/saved calc can show the exact steps it came from.

- [ ] **T3.3 — [HUMAN-GATED] Ask red-team, remaining vectors**
  - Context: the guardrail was adversarially tested on ONE vector (incremental extraction) and
    leaked 6/8. Five vectors are UNTESTED: direct dose asks, roleplay/hypothetical, indirect
    "what do studies use", authority/permission claims, comparative/efficacy.
  - Do: run the eval set in `src/ask/__tests__/ask.eval.test.ts` and extend it to cover all
    five vectors. **Do not self-certify.** Report every prompt that produced a dose, a
    comparison, an efficacy claim, or a protocol — quote the leak verbatim — and stop for human
    review of the policy patch. The directionality rule (dose in → draw out; the dose is the
    one quantity Ask never produces) is the backbone; strengthen, don't weaken it.
  - Accept: eval covers all six vectors; leaks are reported, not hidden; no fix is marked done
    without human sign-off.

- [ ] **T3.4 — Regression tests for everything wired above**
  - Do: add tests — reverse-mode syringe fill = target units; "save as vial" produces a vial
    whose concentration matches the calc; plan reminder schedules N notifications for N
    day×time combos; calculator→log carries compoundName. Keep the capacity regression
    (`units === 10` at capacity 30/50/100) and DST tests green.
  - Accept: `bunx jest` covers each Tier-1 wire; all green.

---

## TIER C — CRAFT & MARKET POSITION (this is where the app is won or lost)

Tiers 0–3 make PepRep *work*. Tier C makes it *win*. The category is currently led on feel,
not substance — PepRep already beats every competitor on correctness (right math, auditable
inventory, immutable history, honest data, no paywall) but reads as plain. Close that gap
without copying anyone: PepRep's premium comes from precision and honesty, not stock photos,
social proof or promises. Do Tier C after Tier 1 (wiring must be stable first). Treat it as
required for market-ready, not optional.

- [x] **C.1 — Design realization pass on the core surfaces**
  - Files: `app/(tabs)/index.tsx`, result cards, `src/components/ui/*`, `src/theme/tokens.ts`
  - Do: take the "instrument" concept from good-in-theory to premium-in-practice. Tighten
    typographic rhythm and spacing discipline; make the hero units readout feel like a
    precision readout (weight, tracking, tabular alignment); give result cards depth and
    hierarchy; make "Show the math" a satisfying reveal, not a plain expander. Add richness
    through craft, not clutter. Keep the token system — extend it, don't hardcode.
  - Why it wins: the user's own reaction was "almost too basic." This is the single biggest
    lever between "functional" and "premium."
  - Accept: a designer would call the calculator screen polished; nothing reads as a wireframe.
  - Note: extended tokens (readout/gauge type, letterSpacing, shadows, section rhythm); dark elevated result panel with mono readout; sunken fields; crafted math reveal; warm-paper brand retained.

- [ ] **C.2 — The syringe as the signature object**
  - Files: `src/components/domain/SyringeGauge.tsx`
  - Do: make PepRep's syringe the most beautiful and most accurate syringe visual in the
    category — true U-100 proportions, crisp tick marks that match the selected barrel, the
    fluid column in the accent, a real plunger, the exact fill mark called out. This is the
    app's icon-moment and the thing a user screenshots.
  - Why it wins: every competitor ships a generic gauge. Ours should be unmistakably better
    and unmistakably *correct* (it already respects the capacity rule — make it look it).
  - Accept: the syringe is genuinely admirable at a glance and precisely correct on inspection.

- [ ] **C.3 — First-run onboarding (the anti-PeptidePal)**
  - Files: new `app/onboarding/*`, gate on a settings flag
  - Do: a short, honest, crafted first run — what PepRep is (measurement instrument, not an
    advisor), the one safety acknowledgement (versioned), and a guided "calculate your first
    draw" moment that ends in the syringe filling to the mark. Confidence through clarity.
    Absolutely no efficacy promises, testimonials, "X% faster", or manufactured urgency —
    the opposite of the incumbents, on purpose.
  - Why it wins: competitors invest heavily in onboarding; PepRep currently has only a safety
    ack. A calm, premium first run sets the trustworthy tone the whole positioning rests on.
  - Accept: a first-time user reaches a correct first draw within ~20 seconds and understands
    what the app is and isn't.

- [ ] **C.4 — Motion, haptics and microinteractions**
  - Files: shared; use `react-native-reanimated` (already an Expo-standard dep) + Haptics
  - Do: springy screen/sheet transitions; the units readout counts up to its value; the
    syringe fills with a smooth animation; a haptic tick on log/save/skip; pressed-states on
    every control. Restrained and precise — instrument, not toy.
  - Why it wins: this is the difference between "web app in a shell" and "premium native."
  - Accept: the app feels alive and native on device; no janky instant state-swaps on the
    primary flows.

- [ ] **C.5 — App icon & identity**
  - Files: `expo/assets/*`, `app.json`
  - Do: an original icon in the instrument aesthetic (precision, warm paper, single accent) —
    no copied branding, no generic syringe clip-art. It is the first impression in the store.
  - Accept: the icon looks like a considered product, distinct from every competitor.

- [ ] **C.6 — One deliberate hero moment**
  - Do: pick the single moment a user shows a friend and make it delightful — the syringe
    filling to the exact mark, or the "show the math" reveal resolving to the answer. Invest
    disproportionately in that one moment.
  - Accept: there is a clearly identifiable "wow" the team can point to.

---

## DEFINITION OF DONE
- **Functionally complete:** every box in Tiers 0–2 ticked; T3 items ticked or deferred with a note.
- **Market-ready (the real bar):** the above **plus** every Tier C box ticked.
- `cd expo && bunx tsc --noEmit` clean; `bunx jest` green.
- Web preview: no dead buttons, no illegible inputs, calculator↔vials↔plans↔today↔history all
  connected, reminders schedule on device.
- No arithmetic outside `src/engine/`; no editable inventory balance; no "U-30"/"U-50"; no
  recommendation text anywhere.
- `[NEEDS-INPUT]` / `[HUMAN-GATED]` tasks stopped-and-reported rather than guessed.
