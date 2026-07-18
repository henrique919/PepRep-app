import {
  DEFAULT_LOW_STOCK_PERCENT,
  isExpiredOrDue,
  isLowStock,
} from "../vialWarnings";

describe("isExpiredOrDue", () => {
  it("is false when no expiry is set", () => {
    expect(isExpiredOrDue(null, "2026-07-18T12:00:00.000Z")).toBe(false);
    expect(isExpiredOrDue(undefined, "2026-07-18T12:00:00.000Z")).toBe(false);
  });

  it("is true when expiry is in the past", () => {
    expect(isExpiredOrDue("2026-07-01T00:00:00.000Z", "2026-07-18T12:00:00.000Z")).toBe(
      true,
    );
  });

  it("is false when expiry is still ahead", () => {
    expect(isExpiredOrDue("2026-08-01T00:00:00.000Z", "2026-07-18T12:00:00.000Z")).toBe(
      false,
    );
  });
});

describe("isLowStock", () => {
  it("uses the default threshold when vial has none", () => {
    expect(isLowStock(25, null)).toBe(true);
    expect(isLowStock(26, null)).toBe(false);
    expect(DEFAULT_LOW_STOCK_PERCENT).toBe(25);
  });

  it("honours a user-set threshold", () => {
    expect(isLowStock(40, 50)).toBe(true);
    expect(isLowStock(51, 50)).toBe(false);
  });
});
