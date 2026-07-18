import { generateBackupId, objectPath, validateOwnedPath } from "../paths";

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";

describe("generateBackupId", () => {
  it("produces a well-formed, unique UUIDv4 each call", () => {
    const first = generateBackupId();
    const second = generateBackupId();
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(first).toMatch(uuidPattern);
    expect(second).toMatch(uuidPattern);
    expect(first).not.toBe(second);
  });
});

describe("objectPath", () => {
  it("builds the canonical {userId}/{backupId}.peprepbackup path", () => {
    const backupId = generateBackupId();
    expect(objectPath(USER_A, backupId)).toBe(`${USER_A}/${backupId}.peprepbackup`);
  });

  it("rejects a malformed user id", () => {
    expect(() => objectPath("not-a-uuid", generateBackupId())).toThrow();
  });

  it("rejects a malformed backup id", () => {
    expect(() => objectPath(USER_A, "not-a-uuid")).toThrow();
  });
});

describe("validateOwnedPath — ownership re-check (defense in depth)", () => {
  it("accepts a path owned by the given user", () => {
    const backupId = generateBackupId();
    const path = objectPath(USER_A, backupId);
    const result = validateOwnedPath(path, USER_A);
    expect(result).toEqual({ ok: true, backupId });
  });

  it("rejects a path owned by a different user", () => {
    const path = objectPath(USER_A, generateBackupId());
    const result = validateOwnedPath(path, USER_B);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not-owned");
  });

  it("rejects a path with the wrong extension", () => {
    const result = validateOwnedPath(`${USER_A}/${generateBackupId()}.json`, USER_A);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("malformed");
  });

  it("rejects a path with too many segments (possible traversal attempt)", () => {
    const result = validateOwnedPath(`${USER_A}/nested/${generateBackupId()}.peprepbackup`, USER_A);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("malformed");
  });

  it("rejects a path with too few segments", () => {
    const result = validateOwnedPath("just-a-filename.peprepbackup", USER_A);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("malformed");
  });

  it("rejects a non-uuid backup id even under the right owner", () => {
    const result = validateOwnedPath(`${USER_A}/../etc-passwd.peprepbackup`, USER_A);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("malformed");
  });
});
