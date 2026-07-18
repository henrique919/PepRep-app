# PepRep — Supabase remote apply status (PF6)

**Status: REMOTE APPLY BLOCKED.** This migration exists only in
`supabase/migrations/20260718120000_peprep_encrypted_backups.sql` in this repository. It has
**not** been run against any live Supabase project.

## Why it's blocked

- The MCP session can see org `PepRep` (`jvshsjadaxqxcvsznlnu`) with **0 projects**.
  The documented target project `opbqlsmwljqkkdvguojh` (org `henrique919` /
  `rlvoefbwoisetlwudozt` per SUPABASE-SAFETY-INVENTORY) is **not** in this MCP scope —
  `list_projects` returns `[]` and `get_project` cannot inventory it.
- No Supabase CLI access token, DB URL, or service-role credential is available in this
  environment, and this is a non-interactive session (`supabase login` cannot run).
- Per repo policy (`docs/review/SUPABASE-SAFETY-INVENTORY.md`, `docs/review/OWNER-DECISIONS.md`
  OD-5), no DDL is applied to any Supabase project until the owner has re-authenticated
  MCP/CLI access **scoped to `opbqlsmwljqkkdvguojh` specifically**, and a fresh read-only
  inventory has confirmed the project is clean.
- **This agent did not create a new Supabase project** and will not — the target project
  already exists (`opbqlsmwljqkkdvguojh`); creating a second one would fragment the setup and
  is explicitly out of scope.

## What must never happen

- Never run any migration, query, or admin action against CleanRun
  (`wleaepmpehzubveevcmi`) — that project is unrelated to PepRep and must not be touched,
  queried, or confused with PepRep in any tool call.
- Never create a new Supabase project as a workaround for missing access to
  `opbqlsmwljqkkdvguojh`.

## How the owner applies this migration when ready

1. Authenticate the Supabase CLI or MCP server with an access token/session that has access to
   organization `henrique919` and confirm the visible project ref is exactly
   `opbqlsmwljqkkdvguojh` before doing anything else (`supabase projects list` or
   `list_projects` via MCP).
2. Run the §2 read-only inventory from `docs/review/SUPABASE-SAFETY-INVENTORY.md` first —
   tables, RLS policies, functions, storage buckets, extensions, advisors. Confirm no
   unexpected objects exist and nothing here collides with existing PepRep or unrelated data.
3. Link the local repo to the project (`supabase link --project-ref opbqlsmwljqkkdvguojh`), or
   apply the file directly via the dashboard SQL editor / `apply_migration` MCP tool scoped to
   that project only.
4. Apply `supabase/migrations/20260718120000_peprep_encrypted_backups.sql` (idempotent —
   `create table if not exists`, `create index if not exists`, `drop policy if exists` before
   each `create policy`, storage bucket upsert via `on conflict`).
5. Re-run `get_advisors` (security + performance) after applying and resolve any new warning
   before enabling the feature for real users.
6. Set `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and
   `EXPO_PUBLIC_SUPABASE_PROJECT_REF=opbqlsmwljqkkdvguojh` in the app's build/env config. Until
   these are set, the app runs in local-only mode and never imports/initializes the Supabase
   client (see `expo/src/cloudBackup/config.ts`).
7. Confirm email OTP (passwordless) is the only enabled auth method — no password auth is used
   by this feature, so the leaked-password-protection dashboard gate (OD-6) does not apply.

## Rollback

Rollback is additive-safe and reversible:

```sql
-- Drop storage policies (safe to re-run; each guarded by IF EXISTS in the migration itself).
drop policy if exists "peprep_backups_select_own" on storage.objects;
drop policy if exists "peprep_backups_insert_own" on storage.objects;
drop policy if exists "peprep_backups_update_own" on storage.objects;
drop policy if exists "peprep_backups_delete_own" on storage.objects;

-- Optionally remove the bucket (only if no backups should be retained — irreversible for
-- existing objects; prefer leaving the bucket and simply disabling the client feature flag
-- by unsetting EXPO_PUBLIC_SUPABASE_* instead).
-- delete from storage.buckets where id = 'peprep-encrypted-backups';

-- Drop the manifest table.
drop table if exists public.peprep_backup_manifests;
```

Disabling the feature client-side (unset `EXPO_PUBLIC_SUPABASE_URL` /
`EXPO_PUBLIC_SUPABASE_ANON_KEY` / `EXPO_PUBLIC_SUPABASE_PROJECT_REF`) is the safest rollback —
it hides the Settings UI and blocks all client writes without touching the database, so it can
be done first while a full schema rollback is considered.

## Non-goals reaffirmed

- No record-level sync. No health content (vials/doses/plans) is ever stored server-side.
  Only ciphertext backup files (Storage) and non-health manifest metadata (Postgres) are
  handled by this migration.
- No service-role key ships in the client. Only the publishable/anon key, gated behind
  `EXPO_PUBLIC_*` env vars.
