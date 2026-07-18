import {
  assertPepRepProjectRef,
  getCloudBackupConfig,
  isCloudBackupConfigured,
  PEPREP_SUPABASE_PROJECT_REF,
} from "../config";

const ENV_KEYS = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  "EXPO_PUBLIC_SUPABASE_PROJECT_REF",
] as const;

function clearEnv(): void {
  for (const key of ENV_KEYS) delete process.env[key];
}

describe("cloud backup config — local-only by default", () => {
  const originalEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) originalEnv[key] = process.env[key];
    clearEnv();
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  it("reports not configured with no env vars set", () => {
    expect(getCloudBackupConfig()).toBeNull();
    expect(isCloudBackupConfigured()).toBe(false);
  });

  it("reports not configured when only some env vars are set", () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://opbqlsmwljqkkdvguojh.supabase.co";
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    // project ref intentionally missing
    expect(getCloudBackupConfig()).toBeNull();
    expect(isCloudBackupConfigured()).toBe(false);
  });

  it("is configured when all three env vars are set and the ref matches PepRep", () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://opbqlsmwljqkkdvguojh.supabase.co";
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.EXPO_PUBLIC_SUPABASE_PROJECT_REF = PEPREP_SUPABASE_PROJECT_REF;
    expect(isCloudBackupConfigured()).toBe(true);
    expect(getCloudBackupConfig()).toEqual({
      url: "https://opbqlsmwljqkkdvguojh.supabase.co",
      anonKey: "anon-key",
      projectRef: PEPREP_SUPABASE_PROJECT_REF,
    });
  });

  it("is NOT configured when the project ref does not match PepRep (e.g. CleanRun)", () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://wleaepmpehzubveevcmi.supabase.co";
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.EXPO_PUBLIC_SUPABASE_PROJECT_REF = "wleaepmpehzubveevcmi";
    expect(isCloudBackupConfigured()).toBe(false);
  });
});

describe("assertPepRepProjectRef — abort-on-mismatch guard", () => {
  const originalEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) originalEnv[key] = process.env[key];
    clearEnv();
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  it("throws when cloud backup is not configured at all", () => {
    expect(() => assertPepRepProjectRef()).toThrow(/not configured/i);
  });

  it("throws when the project ref is any other project (never write elsewhere)", () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://wleaepmpehzubveevcmi.supabase.co";
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.EXPO_PUBLIC_SUPABASE_PROJECT_REF = "wleaepmpehzubveevcmi";
    expect(() => assertPepRepProjectRef()).toThrow(/does not match/i);
  });

  it("returns the config when the project ref matches PepRep exactly", () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://opbqlsmwljqkkdvguojh.supabase.co";
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.EXPO_PUBLIC_SUPABASE_PROJECT_REF = PEPREP_SUPABASE_PROJECT_REF;
    const config = assertPepRepProjectRef();
    expect(config.projectRef).toBe(PEPREP_SUPABASE_PROJECT_REF);
  });

  it("PEPREP_SUPABASE_PROJECT_REF is the documented PepRep ref, not CleanRun", () => {
    expect(PEPREP_SUPABASE_PROJECT_REF).toBe("opbqlsmwljqkkdvguojh");
    expect(PEPREP_SUPABASE_PROJECT_REF).not.toBe("wleaepmpehzubveevcmi");
  });
});
