-- PepRep clients need row CRUD only. RLS limits each operation to auth.uid().
-- Remove privileges that are unnecessary for the PostgREST client role.
revoke all privileges on table public.peprep_backup_manifests from anon;
revoke truncate, references, trigger on table public.peprep_backup_manifests from authenticated;
grant select, insert, update, delete on table public.peprep_backup_manifests to authenticated;
