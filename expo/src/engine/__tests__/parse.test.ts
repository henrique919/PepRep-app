import { isPositiveNumeric, parseNumeric } from "../parse";

describe("parseNumeric", () => {
  it("parses plain integers and decimals", () => {
    expect(parseNumeric("10")).toBe(10);
    expect(parseNumeric("2.5")).toBe(2.5);
  });

  it("treats a comma as a decimal separator", () => {
    expect(parseNumeric("2,5")).toBe(2.5);
  });

  it("trims surrounding whitespace", () => {
    expect(parseNumeric("  10  ")).toBe(10);
  });

  it("returns null for empty or bare-dot input", () => {
    expect(parseNumeric("")).toBeNull();
    expect(parseNumeric("   ")).toBeNull();
    expect(parseNumeric(".")).toBeNull();
  });

  it("rejects non-numeric text instead of coercing it", () => {
    expect(parseNumeric("abc")).toBeNull();
    expect(parseNumeric("1e5")).toBeNull();
    expect(parseNumeric("10mg")).toBeNull();
    expect(parseNumeric("1 2")).toBeNull();
    expect(parseNumeric("1.2.3")).toBeNull();
    expect(parseNumeric("-5")).toBeNull();
    expect(parseNumeric("Infinity")).toBeNull();
  });
});

describe("isPositiveNumeric", () => {
  it("is true only for numbers greater than zero", () => {
    expect(isPositiveNumeric("10")).toBe(true);
    expect(isPositiveNumeric("0")).toBe(false);
    expect(isPositiveNumeric("-1")).toBe(false);
    expect(isPositiveNumeric("")).toBe(false);
    expect(isPositiveNumeric("abc")).toBe(false);
  });
});
