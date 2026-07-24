import { normalizeTimeText } from "../timeText";

describe("normalizeTimeText", () => {
  it("accepts canonical HH:mm", () => {
    expect(normalizeTimeText("08:00")).toBe("08:00");
    expect(normalizeTimeText("23:59")).toBe("23:59");
  });

  it("accepts dot, comma, and semicolon as the separator (numeric-keypad entry)", () => {
    expect(normalizeTimeText("9.45")).toBe("09:45");
    expect(normalizeTimeText("09.45")).toBe("09:45");
    expect(normalizeTimeText("9,45")).toBe("09:45");
    expect(normalizeTimeText("9;45")).toBe("09:45");
  });

  it("accepts separator-free digits", () => {
    expect(normalizeTimeText("0945")).toBe("09:45");
    expect(normalizeTimeText("945")).toBe("09:45");
    expect(normalizeTimeText("2359")).toBe("23:59");
  });

  it("accepts a bare hour as on-the-hour", () => {
    expect(normalizeTimeText("9")).toBe("09:00");
    expect(normalizeTimeText("23")).toBe("23:00");
  });

  it("pads single-digit fields", () => {
    expect(normalizeTimeText("8:5")).toBe("08:05");
  });

  it("trims whitespace", () => {
    expect(normalizeTimeText("  08:00  ")).toBe("08:00");
  });

  it("rejects out-of-range and non-time input", () => {
    expect(normalizeTimeText("24:00")).toBeNull();
    expect(normalizeTimeText("12:60")).toBeNull();
    expect(normalizeTimeText("2500")).toBeNull();
    expect(normalizeTimeText("")).toBeNull();
    expect(normalizeTimeText("abc")).toBeNull();
    expect(normalizeTimeText("9.4.5")).toBeNull();
    expect(normalizeTimeText("-9:00")).toBeNull();
  });
});
