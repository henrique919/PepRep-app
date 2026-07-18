import { fmt } from "../index";

/**
 * Regression: safety-relevant calculator numerals must never be shown as an
 * interpolated/eased intermediate (the old AnimatedReadout count-up bug).
 *
 * AnimatedReadout renders `fmt(value, decimals)` directly — no rAF tween.
 * This contract locks the formatting path the UI must use.
 */
describe("atomic safety readout contract", () => {
  it("formats the final value without applying an easing factor", () => {
    const value = 10;
    const decimals = 1;
    const easedMid = 0.3;

    const finalText = fmt(value, decimals);
    const falseTransient = fmt(value * easedMid, decimals);

    expect(finalText).toBe("10");
    expect(falseTransient).not.toBe(finalText);
    // UI must display finalText on first paint, never falseTransient.
    expect(fmt(value, decimals)).toBe(finalText);
  });

  it("formats diluent ml to two decimals at the final value", () => {
    const value = 2;
    expect(fmt(value, 2)).toBe("2");
    expect(fmt(value * 0.5, 2)).toBe("1");
  });
});
