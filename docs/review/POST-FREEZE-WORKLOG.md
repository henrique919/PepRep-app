# PepRep — Post-Freeze Launch Verification Worklog

**Branch:** `cursor/peprep-launch-verification`  
**Started:** 2026-07-18  
**Baseline HEAD at branch creation:** `ca062d9` (same as `origin/main`)

---

## STEP 1 — Protect and review

### Git baseline (verified)
| Field | Value |
|---|---|
| Remote | `https://github.com/henrique919/PepRep-app.git` |
| Branch | `cursor/peprep-launch-verification` (from `main` @ `ca062d9`) |
| Package manager | npm lockfile + bun.lock under `expo/` |

### Commit-by-commit review
Release series R1–R8 + a11y T0.3 on main — intended PepRep work only. No CleanRun commits.

### Status
- [x] Dedicated branch created
- [x] Branch pushed (when PF9 completes)
- [ ] Draft PR (optional; owner)

---

## STEP 2 — Baseline

- typecheck clean
- **184** tests / 25 suites (includes cloudBackup + expanded backup tests)
- lint: warnings cleaned in touched files; Expo Doctor: dual lockfiles + package version drift noted
- AI SDK absent; Ask disabled

## STEP 3 — Native config

- Disposable Android prebuild: INTERNET + notification perms; blocked camera/mic/location/contacts/storage/`SYSTEM_ALERT_WINDOW`
- Icons 1024×1024 RGB no alpha

## STEP 4 — Privacy inventory

- `docs/privacy/V1-DATA-FLOW-INVENTORY.md`
- Rejected unsupported “zero network” / blanket “Data Not Collected”
- Privacy/support copy disclose optional cloud ciphertext + email OTP

## STEP 5 — Local backup

- Max file size, truncated JSON, future version, empty dataset tests
- PBKDF2 + AES-GCM unchanged (@noble)

## STEP 6 — Supabase encrypted cloud backup

### Supabase skill actions
- `search_docs` for Auth OTP / Storage RLS patterns
- `list_organizations` → PepRep org `jvshsjadaxqxcvsznlnu` (0 projects in MCP scope)
- `list_projects` → `[]` — **cannot** reach `opbqlsmwljqkkdvguojh`
- **Did not** create a new project; **did not** touch CleanRun
- Migration + client landed in repo; remote apply **OWNER-BLOCKED** (`docs/supabase/REMOTE-APPLY.md`)

### Delivered in repo
- `supabase/migrations/20260718120000_peprep_encrypted_backups.sql` (RLS + GRANTs + private bucket + storage policies with SELECT/INSERT/UPDATE/DELETE)
- `expo/src/cloudBackup/*` (config guard, SecureStore session, OTP, upload/list/download/delete)
- Settings `CloudBackupPanel` (only if env configured)
- Unit tests: config project-ref guard + path ownership

## STEP 7 — Device checklist

- `docs/release/DEVICE-VERIFICATION-CHECKLIST.md` — owner-run; nothing self-certified

## STEP 8 — OD-3 / store

- Guideline **1.4.2** for dosage calculators; 1.4.1 accuracy note
- Play Health declaration note; cloud disclosure

## STEP 9 — Handoff

Pending: final commit(s) + push this branch. Do not merge to main from agent.

### Owner next actions
1. Re-auth Supabase MCP/CLI scoped to `opbqlsmwljqkkdvguojh`
2. Read-only inventory (SUPABASE-SAFETY-INVENTORY §2)
3. Apply migration; run advisors
4. Set `EXPO_PUBLIC_SUPABASE_*` for builds that should show cloud backup
5. Device checklist + OD-3 legal review + store submit
