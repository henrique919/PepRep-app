import { parseCollectionJson } from "../parseCollection";

describe("parseCollectionJson", () => {
  it("returns empty for null", () => {
    expect(parseCollectionJson(null)).toEqual({ items: [], quarantined: false });
  });

  it("quarantines invalid JSON without throwing", () => {
    const result = parseCollectionJson<{ id: string }>("{not json");
    expect(result.items).toEqual([]);
    expect(result.quarantined).toBe(true);
    expect(result.reason).toBe("invalid-json");
  });

  it("quarantines non-array payloads", () => {
    const result = parseCollectionJson<{ id: string }>('{"id":"x"}');
    expect(result.items).toEqual([]);
    expect(result.quarantined).toBe(true);
    expect(result.reason).toBe("not-array");
  });

  it("keeps valid rows and flags dropped malformed ones", () => {
    const result = parseCollectionJson<{ id: string }>(
      JSON.stringify([{ id: "a" }, { nope: true }, null, { id: "b" }]),
    );
    expect(result.items).toEqual([{ id: "a" }, { id: "b" }]);
    expect(result.quarantined).toBe(true);
  });
});
