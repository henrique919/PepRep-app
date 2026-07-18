# PepRep — Supabase Safety Inventory

**Review date:** 2026-07-18 · **Scope:** read-only; no writes attempted.

---

## 0. Target identity (do not confuse projects)

| Field | Value |
|---|---|
| Organization | `henrique919` |
| Organization ID | `rlvoefbwoisetlwudozt` |
| **PepRep project ref** | **`opbqlsmwljqkkdvguojh`** (region `ap-southeast-1`, Sydney) |
| **NEVER TOUCH** | CleanRun project ref **`wleaepmpehzubveevcmi`** — never query, link, migrate, mutate, pause, reset, or deploy to it |

## 1. Live inventory status — NOT PERFORMED THIS SESSION (honest gap)

A live read-only inventory **could not be run** in this environment:

- No Supabase MCP server is connected to this session.
- The Supabase CLI is **not on PATH** and no `.supabase/` config or linked project exists in
  the repo working tree.
- No project credentials (access token / DB URL / publishable key) are available here, and
  this is a non-interactive session (cannot run `supabase login`).

**No inventory results are fabricated.** The only evidence available is the starting state
quoted in the review brief, treated as *prior*, not *current*:

> As prepared: PepRep project `ACTIVE_HEALTHY`; no application tables in `public`; no
> application migrations; no users; no Storage objects; no Edge Functions; security advisor
> warned **leaked-password protection disabled**.

**Because this is stale, it must be re-inventoried before any decision or DDL.** §2 gives the
exact read-only steps.

## 2. Read-only re-inventory to run before any change

Authenticate against the PepRep project **only** (verify `opbqlsmwljqkkdvguojh` first), then
collect — all read-only:

1. `schemas`, `tables`, `columns`, per-table `row_count`
2. `functions`, `triggers`, `views`, `policies`, `grants`
3. applied `migrations`
4. Auth: users count, enabled providers
5. Storage: buckets + object counts
6. Edge Functions (names only)
7. `extensions`
8. Security advisors + performance advisors
9. Recent logs (no PII extraction)

**Classification rubric** for every object found:
- **PepRep-expected** (matches the v1 schema we design)
- **Unrelated / CleanRun-like** (belongs to another product)
- **Supabase-managed** (`auth.*`, `storage.*`, `realtime.*`, extensions)
- **Unknown — owner review required**

## 3. Non-destructive constraints (absolute)

- Never drop, truncate, rename, overwrite, repurpose, or copy unrelated/unknown data.
- Never reset the project. Never "clean up" by name alone.
- If unexpected data exists: capture schema + row-count evidence only, propose a **reversible
  isolation plan**, and leave it untouched. Escalate to OWNER-DECISIONS.
- No production DDL until migration + rollback plan + RLS tests + target ref are all reviewed.
- Prefer local Supabase or an **owner-cost-approved** dev branch for testing.

## 4. Architecture decision for v1 — smallest defensible design

**Recommendation: v1 ships local-first only, with OPTIONAL encrypted manual backup FILES —
not record-level cloud sync, not accounts.**

Rationale:
- The product's core promise is local-first, no-account, no-network. Record-level sync forces
  an account-first cloud health platform — the opposite of the positioning and a much larger,
  RLS-heavy surface.
- Encrypted backup files are a *complete, testable* feature at a fraction of the complexity:
  export → (client-side encrypt) → user saves file (or optional upload to their own Storage
  path later). Restore validates + previews + confirms; never silently overwrites.
- Avoids the leaked-password-protection gate entirely for v1 (no password auth needed).
- Supabase remains **optional, opt-in, behind a repository/service interface**, so it can be
  added later without touching the local spine.

Do **not** build two half systems. Pick encrypted backup files for v1; defer sync.

## 5. If/when cloud backup is enabled (design contract)

- **Local-first invariant:** the app is fully functional with no account and no network.
- **Keys:** publishable client key only in the app; **never** ship a secret/service-role key.
- **Auth (if added):** platform-appropriate protected session storage; prefer passwordless/
  OAuth to avoid the leaked-password gate.
- **Ownership:** every user row owned by `auth.uid()`; **RLS on every exposed table**.
  Include explicit **GRANT**s for Data API access (2026 change: grants + RLS, not RLS alone).
  UPDATE policies need `USING` **and** `WITH CHECK` plus a SELECT policy. `TO authenticated`
  alone is **not** authorization — enforce ownership in every policy.
- **Storage:** private paths begin with the authenticated user ID; explicit
  SELECT/INSERT/UPDATE/DELETE policies. No public buckets for health data.
- **Backup manifest:** schema version, app version, device ID, timestamp, checksum, byte size,
  restore-compatibility flag.
- **Uploads:** retryable + idempotent, with an outbox and a visible sync/backup status.
- **Restore:** transactional, validated, preview + confirm, never overwrites local silently.
- **Deletion/export/account-deletion/retention/conflict:** all explicit and documented.
- **Encryption honesty:** distinguish device encryption vs TLS vs provider-at-rest vs genuine
  E2EE. **Do not claim E2EE** unless client-side key lifecycle, recovery, rotation, and
  cross-device restore are implemented and tested.
- Health data is **never** used for advertising or model training.
- `SECURITY DEFINER` only if essential, in a private schema, ownership-checked, execute
  privileges deliberately restricted.
- Migrations additive + versioned; production DDL only after rollback/RLS-test/ref review.

## 6. Supabase safety verdict

**No unrelated data was observed by this reviewer — because no live query was possible, not
because the project was confirmed empty.** Treat the project as *unverified this session*.
Re-run the §2 read-only inventory (owner-authenticated) before any implementation. The leaked-
password-protection warning is a **dashboard configuration gate** relevant only if password
auth is enabled — for the recommended v1 (no accounts) it does not block, but must not be
described as "fixed" by any migration.
