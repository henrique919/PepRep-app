# PepRep — Owner Decisions

Only items that genuinely need the owner, legal review, store-console access, payment
approval, credentials, or a material product choice. Each has a recommended default and the
consequence of deferring. Engineering tasks live in `ACTION-QUEUE.md` — these are **not**
coding tasks.

---

- [x] **OD-1 — Ask in v1: keep (off + consent + red-team) or remove?**
  Recommended default: **remove Ask from v1** (ship behind a disabled flag) unless the red-team
  (ACTION-QUEUE T3.1) is completed and signed off before launch.
  Consequence of deferral: if Ask ships enabled/unverified, PepRep risks emitting dosing-adjacent
  content — the one thing the product boundary forbids — and an App Review medical-advice flag.
  Owner action: choose keep-with-gates vs remove-for-v1.
  **Decided 2026-07-18 (Harry): REMOVE for v1** — re-add later after T3.1. Code: `ASK_V1_ENABLED=false`.

- [x] **OD-2 — Store identity / bundle IDs**
  Recommended default: bundle+package `com.henrique919.peprep` (or an owned domain
  `app.peprep.mobile`), scheme `peprep`; confirm EAS `projectId d5833765…` is under the
  `henrique919` account.
  Consequence of deferral: cannot publish under owner control; changing IDs *after* launch
  creates a new, separate app and loses ratings/installs. Free to change now; expensive later.
  Owner action: confirm bundle id string + EAS project ownership.
  **Decided 2026-07-18 (Harry):** `com.henrique919.peprep`, scheme `peprep`, Expo owner
  `henrique919`. EAS projectId kept (`d5833765…`).

- [ ] **OD-3 — Apple/Google medical-review posture** *(legal / store-console)*
  Recommended default: prepare a validation-evidence pack (golden calcs, engine tests,
  measurement-only framing, no-recommendation boundary) and App Review notes; **do not assume
  approval**. Consider counsel review of the medical/dosage-calculator guidelines.
  Consequence of deferral: rejection or removal risk discovered late.
  Owner action: decide on legal review; owner submits to store console.

- [x] **OD-4 — Data architecture for v1: encrypted backup files vs cloud sync**
  Recommended default: **encrypted manual backup files, no account** (SUPABASE-SAFETY-INVENTORY
  §4). Consequence of deferral: risk of drifting into an account-first cloud health platform
  (larger surface, RLS complexity, privacy exposure) against the product's local-first promise.
  Owner action: approve files-for-v1, or approve the larger sync scope explicitly.
  **Decided 2026-07-18 (Harry): encrypted backups, shared to external storage** (Files / Drive /
  etc.). Path **A now, B later** — files first; Supabase sync deferred.

- [ ] **OD-5 — Supabase re-inventory + any dev branch cost** *(deferred — B later)*
  Recommended default: run the owner-authenticated read-only inventory
  (SUPABASE-SAFETY-INVENTORY §2) before any DDL; test migrations locally, not on a paid branch,
  unless cost is approved. Consequence of deferral: cannot safely confirm the project is clean;
  DDL on an unverified project risks touching unknown data. **Never touch CleanRun
  `wleaepmpehzubveevcmi`.** Owner action: provide read-only access or run the inventory; approve
  or decline any paid dev branch.
  **Decided 2026-07-18 (Harry):** do **not** build sync yet. Revisit OD-5 inventory before any
  cloud DDL when multi-device sync is wanted.

- [ ] **OD-6 — Leaked-password protection (only if password auth is ever enabled)**
  Recommended default: prefer passwordless/OAuth or no accounts in v1, sidestepping this. If
  password auth is enabled, turn on leaked-password protection in the Supabase dashboard (a
  config gate, not a migration). Consequence of deferral: weak-credential exposure if password
  auth ships without it. Owner action: none for the recommended v1; else flip the dashboard
  setting.

- [ ] **OD-7 — Existing-user Ask consent migration**
  Recommended default: on the settings-default flip (T0.2), treat any existing `askEnabled`
  value as **off until re-consented**, so no one keeps transmitting without the new JIT consent.
  Consequence of deferral: users upgraded from a build where Ask was on keep sending question
  text without the informed consent flow. Owner action: confirm this conservative migration.
