import { EXPORT_PLAINTEXT_WARNING, exportFileName } from "../filenames";

describe("exportFileName", () => {
  it("uses a date stamp with no PII", () => {
    expect(exportFileName("doses-csv", "2026-07-18")).toBe("peprep-doses-2026-07-18.csv");
    expect(exportFileName("data-json", "2026-07-18")).toBe("peprep-data-2026-07-18.json");
  });

  it("never embeds compound names or other user strings", () => {
    const name = exportFileName("doses-csv", "2026-07-18");
    expect(name.toLowerCase()).not.toContain("bpc");
    expect(name).not.toMatch(/@/);
  });
});

describe("EXPORT_PLAINTEXT_WARNING", () => {
  it("states that exports are unencrypted plaintext", () => {
    expect(EXPORT_PLAINTEXT_WARNING.toLowerCase()).toContain("unencrypted");
    expect(EXPORT_PLAINTEXT_WARNING.toLowerCase()).toContain("plaintext");
  });
});
