# PepRep — OD-3 Medical / Store-Review Pack

**Prepared:** 2026-07-18 · **For:** owner submission use · **Status:** draft evidence pack.

> **Limits of this document (read first).** This is an internal evidence pack and a set of
> draft reviewer notes. It is **not legal advice**, it is **not a regulatory determination**,
> and it **does not guarantee App Store or Google Play approval**. Store guidelines change;
> verify the current text before submitting. Given the subject matter, having an app/health
> regulatory attorney review this before submission is strongly recommended. The owner makes
> the final classification and submission decisions.

---

## 1. What PepRep is (the classification position)

PepRep is a **general-purpose measurement (unit-conversion) and personal record-keeping
utility**. By analogy: a scientific calculator + a personal logbook, specialised for
reconstitution arithmetic and syringe measurement.

**It does, only:**
- Convert user-entered numbers (vial mass, diluent volume, desired amount) into a
  concentration, a volume, and U-100 syringe units — pure arithmetic.
- Let the user record what they personally chose to do, and track their own inventory.

**It does NOT:**
- Recommend, determine, prescribe, optimise, validate, or adjust any compound, dose,
  schedule, stack, cycle, diagnosis, or treatment.
- Ship any suggested dose, "typical" range, protocol, titration template, or default plan.
- Diagnose, treat, or make any health/efficacy claim.
- Provide sourcing, vendors, or "where to buy."
- Collect, transmit, or store user data off-device (v1 has no account, no analytics, no AI).

The product's own one-line disclaimer, shown at first run and in-app, is verbatim:
> "PepRep is a measurement tool. It is not medical advice and does not recommend doses."
(`src/theme/tokens.ts` → `DISCLAIMER`.)

## 2. The real review risks — named honestly

Do not assume these away. The pack's job is to prepare for them, not pretend they don't exist.

1. **Apple Guideline 1.4.2 (Physical Harm — drug dosage calculators).** Apple’s drug-dosage
   calculator rule requires an approved entity (manufacturer, hospital, university, insurer)
   or FDA/equivalent clearance. **Risk:** a reviewer may read “peptide reconstitution
   calculator” as a drug-dosage calculator under **1.4.2**. **Position:** PepRep does not
   calculate or recommend a *dose*; it converts user-entered measurements into syringe units
   (mass ÷ volume → units) and refuses to suggest what or how much to take. Framing cannot
   guarantee approval.
2. **Apple Guideline 1.4.1** remains relevant for accuracy/methodology expectations of apps
   that touch health-adjacent calculations — keep validation evidence (golden fixtures labeled
   as **synthetic arithmetic validation**, never recommendations).
3. **Subject-matter sensitivity (peptides / injectables).** Reviewer association risk remains;
   mitigate with identity/measurement facts only, no efficacy or sourcing, no recommendations.
4. **Apple 5.1 / Play Data safety.** Do **not** claim blanket “Data Not Collected” if optional
   Supabase Auth email + encrypted cloud backup are enabled in a build. Local-only builds
   collect nothing off-device; optional cloud collects account email + ciphertext + manifest
   metadata. Disclose accurately.
5. **Google Play — Health Apps declaration.** Declare the appropriate Health category for
   personal health-related records / plans / reminders — do **not** claim “no health features”
   if those surfaces ship. Same measurement-only position as Apple.

## 3. Mitigations already in the build (evidence reviewers can see)

- **Measurement-only framing** throughout; disclaimer at first run + About + calculator footer.
- **Versioned safety acknowledgement** — `CURRENT_SAFETY_ACK_VERSION` in `src/store/settings.ts`;
  re-prompts if the text materially changes.
- **No recommendations, enforced in code and data** — no dose/protocol/stack fields exist in
  the schema; reference data carries identity + measurement facts only; the (disabled) Ask
  feature's policy hard-refuses dose/comparison/efficacy questions.
- **AI removed for v1** — `ASK_V1_ENABLED=false`; the AI SDK has been removed from the bundle;
  the shipped binary makes no network calls.
- **Correct, test-locked arithmetic** — the U-100 invariant (100 units/mL always; capacity is
  barrel volume only) is enforced and regression-tested; safety numbers render atomically
  (no misleading count-up).
- **Local-first, no data collection** — no account, no analytics, no telemetry; export/backup
  are user-initiated files; Erase-all-data on device.

## 4. Paste-ready — App Store "App Review Information → Notes"

> PepRep is a measurement and personal record-keeping utility, not a medical or diagnostic
> app. It performs unit-conversion arithmetic on values the user enters (vial amount,
> bacteriostatic water volume, and a desired amount) to display the resulting concentration,
> the volume to draw, and the corresponding marks on a U-100 insulin syringe — the same class
> of calculation as a scientific calculator.
>
> PepRep does not recommend, determine, prescribe, or adjust any dose, schedule, or compound.
> It contains no suggested doses, no "typical" ranges, no protocols, cycles, or stacks, and no
> sourcing or purchasing content. Every value is entered by the user. The app displays a
> persistent disclaimer ("PepRep is a measurement tool. It is not medical advice and does not
> recommend doses.") and requires a safety acknowledgement at first launch.
>
> The app is fully local: no account, no analytics, no network calls, and no data leaves the
> device. Optional exports/backups are files the user explicitly creates and shares.
>
> We do not believe PepRep is a "drug dosage calculator" within Guideline 1.4.1, because it
> neither sources nor recommends any dose — it converts user-supplied measurements into
> syringe units. We are happy to add any clarifying language the review team requests.
>
> No demo account is required (no accounts exist). To exercise the core feature: open
> Calculate, enter Vial 5 mg, Water 2 mL, Amount 250 mcg — the app shows 2,500 mcg/mL, 0.1 mL,
> 10 units, 20 full doses, with the syringe drawn to 10 units.

*(Owner: adjust tone as counsel advises. Do not overstate; keep it factual.)*

## 5. Paste-ready — App Store "App Privacy" (nutrition labels)

- **Data collection:** *Data Not Collected.* PepRep does not collect any data.
- No tracking; no third-party SDKs that collect data (AI SDK removed for v1).
- Support URL and Privacy Policy URL: **owner to host** `docs/legal/PRIVACY-POLICY.md` and
  `docs/legal/SUPPORT.md` and paste the URLs.

## 6. Paste-ready — Google Play declarations

- **Data safety:** No data collected, no data shared; data stays on-device; user can request
  deletion (Erase all data). Encryption in transit: N/A (no transmission).
- **Health apps declaration:** if prompted, describe as a *measurement/record-keeping utility*,
  not a medical device; makes no diagnosis/treatment claims. Do not enroll in medical-device
  categories.
- **Content rating (IARC) questionnaire:** answer truthfully re: references to substances;
  expect a mature rating; do not claim it is a children's app.
- **Store listing:** use `docs/store/LISTING-DRAFT.md`; keep measurement-only framing; include
  the "not medical advice" line.

## 7. Validation evidence appendix (all verifiable in-repo)

**Golden calculations — verified against the engine (`src/engine`):**

| Input | Output | Status |
|---|---|---|
| 5 mg / 2 mL / 250 mcg | 2,500 mcg/mL · 0.1 mL · 10 U · 20 doses · no warning | ✅ |
| 5 mg / 250 mcg / target 10 U | 2 mL diluent | ✅ |
| 10 mg / 2 mL / 0.5 mg | 5 mg/mL · 0.1 mL · 10 U · 20 doses | ✅ |
| 40 U on a 30-unit syringe | **40 U unchanged** + "more than a 30-unit syringe holds" warning | ✅ |
| capacity 30 / 50 / 100 for 5 mg/2 mL/250 mcg | **all 10 U** (capacity never scales units) | ✅ |
| 0 / −1 / NaN inputs | validation errors, no output | ✅ |
| dose > vial · sub-2-unit | factual warnings, result unchanged | ✅ |

**Automated tests:** 162 tests across 23 suites, `tsc --noEmit` clean. Suites include:
`engine/index`, `engine/syringe`, `engine/inventory`, `engine/schedule`,
`engine/occurrences-dst`, `engine/atomic-readout`, `engine/vial-calc-params`,
`engine/vialWarnings`, `db/ledger`, `db/migrate-v1`, `db/migrations-runner`,
`db/normaliseVial`, `db/parseCollection`, `db/rollover`, `db/snapshot`, `backup/backup`,
`export/filenames`, `onboarding/vialDraft`, `store/askConsent`, `ask/ask.eval`.

**Safety invariant (documented + tested):** a U-100 syringe is always 100 units/mL; capacity
(30/50/100 = 0.3/0.5/1.0 mL) is barrel volume used only for overflow warnings and the gauge —
never a units multiplier. This is the exact error competitor apps make; PepRep's is test-locked.

**No-recommendation enforcement:** no dose/protocol/stack fields exist in the data model;
reference seed is identity+measurement only; the disabled Ask policy (`src/ask/policy.ts`,
`systemPrompt.ts`) refuses dose/comparison/efficacy/IU-conversion requests.

## 8. Pre-submission checklist (owner)

- [ ] Counsel review of the classification position and this pack (recommended).
- [ ] Host Privacy Policy + Support pages; paste URLs into both stores.
- [ ] App Store: paste §4 review notes; complete §5 privacy labels; set age rating.
- [ ] Play: complete §6 data-safety + health declarations + IARC rating.
- [ ] Screenshots (owner) that show measurement framing + disclaimer, not dosing guidance.
- [ ] Device a11y sweep passed (T0.3 checklist) — separate owner gate.
- [ ] EAS production build → TestFlight / Play internal test → fix findings → submit.

## 9. If rejected — response plan

- Reply factually: PepRep converts user-entered measurements into syringe units and does not
  source or recommend doses; offer to add any clarifying disclaimer the team specifies.
- Consider softening anything that literally reads as "dosage calculator" in name/marketing to
  "reconstitution/measurement calculator."
- If the block is subject-matter (peptides) rather than the calculator rule, that is a product/
  business decision for the owner + counsel, not a wording fix — do not try to disguise it.
- Escalate to the App Review Board with the §7 evidence if you believe the classification is
  wrong. Do not resubmit unchanged repeatedly.

## 10. Decisions that require the owner (and possibly counsel)

- Whether to engage regulatory/app-store counsel before submitting (recommended).
- The final classification call and how assertively to argue "not a dosage calculator."
- Age rating and how to answer substance-reference questions in the rating questionnaires.
- Whether to adjust the app/marketing name away from "dosage" language.
- Acceptance of the residual rejection risk inherent to this category.
