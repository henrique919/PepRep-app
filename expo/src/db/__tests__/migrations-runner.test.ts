import {
  getStorage,
  MemoryStorageAdapter,
  STORAGE_PREFIX,
  setStorageAdapter,
} from "../adapter";
import { SCHEMA_VERSION, runMigrations } from "../migrations";

describe("runMigrations", () => {
  beforeEach(() => {
    setStorageAdapter(new MemoryStorageAdapter());
  });

  it("advances an empty store to the current schema version", async () => {
    await runMigrations();
    const version = await getStorage().getItem(`${STORAGE_PREFIX}schemaVersion`);
    expect(version).toBe(String(SCHEMA_VERSION));
    expect(SCHEMA_VERSION).toBe(4);
  });

  it("is idempotent when already at current version", async () => {
    await getStorage().setItem(`${STORAGE_PREFIX}schemaVersion`, String(SCHEMA_VERSION));
    await runMigrations();
    expect(await getStorage().getItem(`${STORAGE_PREFIX}schemaVersion`)).toBe(
      String(SCHEMA_VERSION),
    );
  });

  it("walks forward from v0 through each step without throwing", async () => {
    await getStorage().setItem(`${STORAGE_PREFIX}schemaVersion`, "0");
    await expect(runMigrations()).resolves.toBeUndefined();
    expect(await getStorage().getItem(`${STORAGE_PREFIX}schemaVersion`)).toBe(
      String(SCHEMA_VERSION),
    );
  });
});
