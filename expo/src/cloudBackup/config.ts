/**
 * Optional Supabase encrypted cloud backup — configuration (PF6 / OD-4 path B).
 *
 * Local-only mode is the default: with no `EXPO_PUBLIC_SUPABASE_*` env vars set, this module
 * reports "not configured" and nothing in `client.ts`/`api.ts` is initialized or called. No
 * account and no network are required to use PepRep.
 *
 * PepRep's own Supabase project ref MUST equal `PEPREP_SUPABASE_PROJECT_REF`. Every client
 * write in `api.ts` calls `assertPepRepProjectRef()` first and aborts otherwise — this guards
 * against a misconfigured build ever writing to the wrong (or an unrelated) Supabase project.
 */

/** The only Supabase project PepRep is allowed to write to (org `henrique919`). */
export const PEPREP_SUPABASE_PROJECT_REF = "opbqlsmwljqkkdvguojh";

export type CloudBackupConfig = {
  url: string;
  anonKey: string;
  projectRef: string;
};

function normaliseEnv(value: string | undefined): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

/**
 * Reads the current environment. Never cached — always reflects the live env so tests (and,
 * in principle, a runtime config change) are observed immediately.
 */
export function getCloudBackupConfig(): CloudBackupConfig | null {
  const url = normaliseEnv(process.env.EXPO_PUBLIC_SUPABASE_URL);
  const anonKey = normaliseEnv(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  const projectRef = normaliseEnv(process.env.EXPO_PUBLIC_SUPABASE_PROJECT_REF);
  if (url === undefined || anonKey === undefined || projectRef === undefined) return null;
  return { url, anonKey, projectRef };
}

/**
 * True only when every env var is present AND the configured project ref is exactly PepRep's
 * own project. Use this to decide whether to show the Settings cloud-backup section at all.
 */
export function isCloudBackupConfigured(): boolean {
  const config = getCloudBackupConfig();
  return config !== null && config.projectRef === PEPREP_SUPABASE_PROJECT_REF;
}

/**
 * Throws if cloud backup is not configured, or if the configured project ref does not match
 * PepRep's own project. Call this first, before any Supabase client is created or used, from
 * every function in `api.ts` (sign-in, upload, list, download, delete, sign-out).
 */
export function assertPepRepProjectRef(): CloudBackupConfig {
  const config = getCloudBackupConfig();
  if (config === null) {
    throw new Error("Cloud backup is not configured on this device.");
  }
  if (config.projectRef !== PEPREP_SUPABASE_PROJECT_REF) {
    throw new Error(
      `Refusing to write: EXPO_PUBLIC_SUPABASE_PROJECT_REF "${config.projectRef}" does not ` +
        `match the PepRep project ("${PEPREP_SUPABASE_PROJECT_REF}").`,
    );
  }
  return config;
}
