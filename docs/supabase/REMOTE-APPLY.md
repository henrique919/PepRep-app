# PepRep — Supabase remote apply status (PF6)

**Status: APPLIED** on project `opbqlsmwljqkkdvguojh` (2026-07-18) via project-scoped
Supabase MCP (`apply_migration` name `peprep_encrypted_backups`).

## Verified after apply

| Object | Status |
|---|---|
| `public.peprep_backup_manifests` | Present, RLS enabled, 0 rows |
| Storage bucket `peprep-encrypted-backups` | Private, 8 MiB limit |
| Storage policies `peprep_backups_*` | select/insert/update/delete |
| Manifest grants | authenticated CRUD only; no anon grants |
| Account-deletion function | `delete-peprep-account` v2 active, JWT required |
| Project URL | `https://opbqlsmwljqkkdvguojh.supabase.co` |

## Advisors (post-apply)

- **Security WARN:** leaked-password protection disabled — expected/non-blocking while
  password auth is unused (email OTP only for this feature). See OD-6.
- **Performance INFO:** unused index on `peprep_backup_manifests_user_created_idx` —
  expected on an empty table; keep for list-by-user queries.

## 2026-07-19 launch hardening

- Applied grant hardening migration `20260719073601`.
- Deployed `delete-peprep-account` v2 with authenticated user verification, orphaned-object
  cleanup, backup deletion, and Auth user deletion.
- Verified own-row access, cross-user isolation, and anonymous denial in rolled-back SQL tests.
- Verified unauthenticated function requests return `401` and CORS preflight returns `200`.
- Verified final production state remained empty: 0 manifests and 0 storage objects.

## Why SQL Editor may have failed earlier

Common causes (migration SQL itself is valid on this project):

1. Pasting the **file path** instead of the **file contents** into SQL Editor.
2. Running against the wrong project (must be `opbqlsmwljqkkdvguojh`, never CleanRun).
3. Partial selection / truncated paste (especially around storage policies).
4. Dashboard UI quoting/encoding changes when copying from chat.

Prefer MCP `apply_migration` or CLI `supabase db push` with the linked PepRep project.

## Client env

- Local: `expo/.env` (gitignored) — already written for this machine.
- EAS: all three vars set on `@henrique919/peprep-app` for
  `development` / `preview` / `production` (see `docs/supabase/EXPO-ENV.md`).
- `expo/eas.json` profiles pin `"environment"` so builds pick the matching set.

Use the **anon** (legacy JWT) or **publishable** key only — never `service_role`.
Until these are set, the app stays local-only.

## What must never happen

- Never run any migration, query, or admin action against CleanRun
  (`wleaepmpehzubveevcmi`).
- Never create a second PepRep Supabase project as a workaround.

## Rollback

Rollback is additive-safe and reversible:

```sql
drop policy if exists "peprep_backups_select_own" on storage.objects;
drop policy if exists "peprep_backups_insert_own" on storage.objects;
drop policy if exists "peprep_backups_update_own" on storage.objects;
drop policy if exists "peprep_backups_delete_own" on storage.objects;

-- Optionally remove the bucket (only if no backups should be retained).
-- delete from storage.buckets where id = 'peprep-encrypted-backups';

drop table if exists public.peprep_backup_manifests;
```

Safest client rollback: unset `EXPO_PUBLIC_SUPABASE_*` (hides UI, no DB writes).

## Non-goals reaffirmed

- No record-level sync. Ciphertext + manifest metadata only.
- No service-role key in the client.
