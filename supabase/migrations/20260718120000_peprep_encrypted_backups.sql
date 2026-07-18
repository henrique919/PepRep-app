-- PepRep — optional encrypted cloud backup (PF6 / OD-4 path B).
--
-- Target project: opbqlsmwljqkkdvguojh (org henrique919) ONLY.
-- NEVER apply to CleanRun (wleaepmpehzubveevcmi) or any other project.
--
-- Scope: manifests + object storage for CIPHERTEXT backup files only. This migration never
-- creates a table that stores health content (vials/doses/plans/etc.) — the ciphertext blob
-- itself lives in Storage; this schema only stores metadata needed to list/restore it.
--
-- Security model (2026 Supabase guidance): RLS + explicit GRANTs together, not RLS alone.
-- Every policy re-checks ownership via `(select auth.uid()) = user_id`. No SECURITY DEFINER.

-- ============================================================================
-- 1. Table: public.peprep_backup_manifests
-- ============================================================================

create table if not exists public.peprep_backup_manifests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  object_path text not null,
  created_at timestamptz not null default now(),
  format_version integer not null,
  schema_version integer not null,
  app_version text not null,
  byte_size integer not null check (byte_size > 0),
  checksum_sha256 text not null,
  device_label text null,
  constraint peprep_backup_manifests_user_id_id_key unique (user_id, id)
);

comment on table public.peprep_backup_manifests is
  'Metadata for user-uploaded encrypted PepRep backup files. Never stores health content — '
  'only manifest fields already present in the local encrypted-backup format. The referenced '
  'object at object_path is opaque ciphertext.';

create index if not exists peprep_backup_manifests_user_created_idx
  on public.peprep_backup_manifests (user_id, created_at desc);

-- ============================================================================
-- 2. Row Level Security — ownership only, every policy re-checks auth.uid()
-- ============================================================================

alter table public.peprep_backup_manifests enable row level security;

drop policy if exists "peprep_backup_manifests_select_own" on public.peprep_backup_manifests;
create policy "peprep_backup_manifests_select_own"
  on public.peprep_backup_manifests
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "peprep_backup_manifests_insert_own" on public.peprep_backup_manifests;
create policy "peprep_backup_manifests_insert_own"
  on public.peprep_backup_manifests
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "peprep_backup_manifests_update_own" on public.peprep_backup_manifests;
create policy "peprep_backup_manifests_update_own"
  on public.peprep_backup_manifests
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "peprep_backup_manifests_delete_own" on public.peprep_backup_manifests;
create policy "peprep_backup_manifests_delete_own"
  on public.peprep_backup_manifests
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================================
-- 3. Explicit GRANTs (Data API access) — RLS alone is not sufficient.
-- ============================================================================

revoke all on table public.peprep_backup_manifests from anon;
revoke all on table public.peprep_backup_manifests from public;

grant select, insert, update, delete on table public.peprep_backup_manifests to authenticated;

-- Sequences are not used (uuid pk via gen_random_uuid()); nothing further to grant.

-- ============================================================================
-- 4. Storage bucket: peprep-encrypted-backups (private)
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit)
values ('peprep-encrypted-backups', 'peprep-encrypted-backups', false, 8388608)
on conflict (id) do update
  set public = false,
      file_size_limit = 8388608;

-- ============================================================================
-- 5. Storage policies — ownership by first path segment = auth.uid()::text.
--    Object paths are always "{user_id}/{backup_id}.peprepbackup" (see expo/src/cloudBackup/paths.ts).
--    Upsert (create-or-replace) needs SELECT + INSERT + UPDATE per 2026 storage guidance.
-- ============================================================================

drop policy if exists "peprep_backups_select_own" on storage.objects;
create policy "peprep_backups_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'peprep-encrypted-backups'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "peprep_backups_insert_own" on storage.objects;
create policy "peprep_backups_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'peprep-encrypted-backups'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "peprep_backups_update_own" on storage.objects;
create policy "peprep_backups_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'peprep-encrypted-backups'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'peprep-encrypted-backups'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

drop policy if exists "peprep_backups_delete_own" on storage.objects;
create policy "peprep_backups_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'peprep-encrypted-backups'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- No SECURITY DEFINER functions are introduced by this migration. No function is created at
-- all — ownership is enforced entirely by RLS + GRANT above.
