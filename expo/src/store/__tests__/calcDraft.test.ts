import { MemoryStorageAdapter, setStorageAdapter } from "@/src/db/adapter";

import { draftHasContent, parseCalcDraft, useCalcDraftStore, type CalcDraft } from "../calcDraft";

const FULL_DRAFT: CalcDraft = {
  mode: "draw",
  compoundLabel: "My peptide",
  vialText: "10",
  waterText: "1.5",
  doseText: "250",
  doseUnit: "mcg",
  targetUnitsText: "",
  capacity: 50,
  sourceVial: { id: "vial-1", vialMg: "10", diluentMl: "1.5" },
};

describe("parseCalcDraft", () => {
  it("returns null for null input", () => {
    expect(parseCalcDraft(null)).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseCalcDraft("{not json")).toBeNull();
  });

  it("returns null when required fields are missing or the wrong shape", () => {
    expect(parseCalcDraft(JSON.stringify({ mode: "draw" }))).toBeNull();
    expect(parseCalcDraft(JSON.stringify({ ...FULL_DRAFT, mode: "reverse" }))).toBeNull();
    expect(parseCalcDraft(JSON.stringify({ ...FULL_DRAFT, capacity: 40 }))).toBeNull();
    expect(parseCalcDraft(JSON.stringify({ ...FULL_DRAFT, doseUnit: "g" }))).toBeNull();
    expect(parseCalcDraft(JSON.stringify({ ...FULL_DRAFT, sourceVial: { id: "x" } }))).toBeNull();
  });

  it("round-trips a well-formed draft, including a null sourceVial", () => {
    expect(parseCalcDraft(JSON.stringify(FULL_DRAFT))).toEqual(FULL_DRAFT);
    const noSource = { ...FULL_DRAFT, sourceVial: null };
    expect(parseCalcDraft(JSON.stringify(noSource))).toEqual(noSource);
  });
});

describe("draftHasContent", () => {
  const empty: CalcDraft = {
    mode: "draw",
    compoundLabel: "",
    vialText: "",
    waterText: "",
    doseText: "",
    doseUnit: "mcg",
    targetUnitsText: "",
    capacity: 50,
    sourceVial: null,
  };

  it("is false for a fully empty draft", () => {
    expect(draftHasContent(empty)).toBe(false);
  });

  it("is true when any user-entered field has content", () => {
    expect(draftHasContent({ ...empty, vialText: "10" })).toBe(true);
    expect(draftHasContent({ ...empty, compoundLabel: "Test" })).toBe(true);
    expect(draftHasContent({ ...empty, targetUnitsText: "5" })).toBe(true);
  });
});

describe("useCalcDraftStore", () => {
  beforeEach(() => {
    setStorageAdapter(new MemoryStorageAdapter());
    useCalcDraftStore.setState({ draft: null, hydrated: false });
  });

  it("hydrates to null when nothing has been saved yet", async () => {
    await useCalcDraftStore.getState().hydrate();
    expect(useCalcDraftStore.getState().draft).toBeNull();
    expect(useCalcDraftStore.getState().hydrated).toBe(true);
  });

  it("round-trips a saved draft through storage", async () => {
    await useCalcDraftStore.getState().save(FULL_DRAFT);
    expect(useCalcDraftStore.getState().draft).toEqual(FULL_DRAFT);

    useCalcDraftStore.setState({ draft: null, hydrated: false });
    await useCalcDraftStore.getState().hydrate();
    expect(useCalcDraftStore.getState().draft).toEqual(FULL_DRAFT);
  });

  it("reset clears the in-memory draft", async () => {
    await useCalcDraftStore.getState().save(FULL_DRAFT);
    useCalcDraftStore.getState().reset();
    expect(useCalcDraftStore.getState().draft).toBeNull();
  });
});
