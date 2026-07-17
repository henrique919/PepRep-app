import type { Plan, ScheduleVersion } from "../../db/types";
import {
  eachDayKey,
  localDateTimeIso,
  occurrencesOnDay,
} from "../schedule";

function version(
  partial: Partial<ScheduleVersion> & Pick<ScheduleVersion, "id" | "effectiveFrom" | "effectiveTo">,
): ScheduleVersion {
  return {
    id: partial.id,
    planId: partial.planId ?? "plan-1",
    effectiveFrom: partial.effectiveFrom,
    effectiveTo: partial.effectiveTo,
    name: partial.name ?? "Plan",
    doseValue: partial.doseValue ?? 250,
    doseUnit: partial.doseUnit ?? "mcg",
    daysOfWeek: partial.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6],
    timesLocal: partial.timesLocal ?? ["08:00"],
    vialId: partial.vialId,
    createdAt: partial.createdAt ?? "2026-03-01T08:00:00.000Z",
  };
}

describe("occurrence generation across a DST boundary", () => {
  // US spring-forward 2026: 2026-03-08 (local clocks jump 02:00 → 03:00).
  it("eachDayKey walks calendar days with date-fns — no skip or duplicate", () => {
    expect(eachDayKey("2026-03-07", "2026-03-09")).toEqual([
      "2026-03-07",
      "2026-03-08",
      "2026-03-09",
    ]);
  });

  it("never uses epoch-ms / 86400000 (length matches inclusive calendar span)", () => {
    const keys = eachDayKey("2026-11-01", "2026-11-02"); // US fall-back weekend
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe("2026-11-01");
    expect(keys[1]).toBe("2026-11-02");
  });

  it("occurrencesOnDay resolves the version active THEN across the DST day", () => {
    const vBefore = version({
      id: "v-before",
      effectiveFrom: "2026-03-01",
      effectiveTo: "2026-03-07",
      doseValue: 100,
      timesLocal: ["08:00"],
    });
    const vAfter = version({
      id: "v-after",
      effectiveFrom: "2026-03-08",
      effectiveTo: null,
      doseValue: 200,
      timesLocal: ["08:00", "20:00"],
    });
    const plan: Plan = {
      id: "plan-1",
      compoundName: "DST compound",
      createdAt: "2026-03-01T08:00:00.000Z",
      versions: [vBefore, vAfter],
    };

    const before = occurrencesOnDay([plan], "2026-03-07");
    expect(before).toHaveLength(1);
    expect(before[0]?.version.id).toBe("v-before");
    expect(before[0]?.version.doseValue).toBe(100);

    const onTransition = occurrencesOnDay([plan], "2026-03-08");
    expect(onTransition).toHaveLength(2);
    expect(onTransition.every((row) => row.version.id === "v-after")).toBe(true);
    expect(onTransition[0]?.version.doseValue).toBe(200);

    // Editing to a newer version must not rewrite the past day's occurrences.
    const vNewest = version({
      id: "v-newest",
      effectiveFrom: "2026-03-10",
      effectiveTo: null,
      doseValue: 999,
      timesLocal: ["12:00"],
    });
    const edited: Plan = {
      ...plan,
      versions: [
        { ...vBefore },
        { ...vAfter, effectiveTo: "2026-03-09" },
        vNewest,
      ],
    };
    const pastAgain = occurrencesOnDay([edited], "2026-03-07");
    expect(pastAgain[0]?.version.doseValue).toBe(100);
    expect(pastAgain[0]?.version.id).toBe("v-before");
  });

  it("localDateTimeIso keeps the requested calendar day across spring-forward", () => {
    const iso = localDateTimeIso("2026-03-08", "08:00");
    // Day key of the resulting instant in local time must still be 2026-03-08.
    const local = new Date(iso);
    const y = local.getFullYear();
    const m = String(local.getMonth() + 1).padStart(2, "0");
    const d = String(local.getDate()).padStart(2, "0");
    expect(`${y}-${m}-${d}`).toBe("2026-03-08");
    expect(local.getHours()).toBe(8);
  });
});
