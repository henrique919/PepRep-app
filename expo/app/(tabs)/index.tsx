import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronDown, ChevronUp, NotebookPen, TestTubes } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import MathSteps from "@/src/components/domain/MathSteps";
import SyringeGauge from "@/src/components/domain/SyringeGauge";
import Warnings from "@/src/components/domain/Warnings";
import AnimatedReadout from "@/src/components/ui/AnimatedReadout";
import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import Callout from "@/src/components/ui/Callout";
import Card from "@/src/components/ui/Card";
import Field from "@/src/components/ui/Field";
import Hairline from "@/src/components/ui/Hairline";
import QuickPicks from "@/src/components/ui/QuickPicks";
import Screen from "@/src/components/ui/Screen";
import SegmentedControl from "@/src/components/ui/SegmentedControl";
import { withAccessibleTabScreen } from "@/src/components/ui/AccessibleTabScreen";
import { hapticTick } from "@/src/haptics";
import type { DiluentOutcome, DrawOutcome, MassUnit, SyringeCapacity } from "@/src/engine";
import {
  calculateDiluent,
  calculateDraw,
  fmt,
  requiresDrawCorrection,
  SYRINGES,
} from "@/src/engine";
import { parseNumeric } from "@/src/engine/parse";
import { vialLinkIntact, type VialLinkSource } from "@/src/engine/vialCalcParams";
import { draftHasContent, useCalcDraftStore, type CalcDraft } from "@/src/store/calcDraft";
import { useTheme } from "@/src/theme";
import {
  DISCLAIMER,
  hairlineWidth,
  letterSpacing,
  radius,
  spacing,
  type ColorTokens,
} from "@/src/theme/tokens";

function createCalcStyles(colors: ColorTokens) {
  return StyleSheet.create({
    flex: { flex: 1 },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      gap: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      marginBottom: spacing.xs,
    },
    modeSeg: { width: 168 },
    formCard: { gap: spacing.xl },
    unitToggle: { width: 118 },
    fieldBlock: { gap: spacing.sm },
    resultGroup: { gap: spacing.md },
    resultCard: { gap: spacing.md, borderRadius: 22, padding: spacing.xl },
    overlineBlock: { gap: spacing.xs },
    bigNumberRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: spacing.sm,
    },
    unitSuffix: {
      letterSpacing: letterSpacing.tight,
      paddingBottom: spacing.xs,
      color: colors.accent,
    },
    gaugeWell: {
      backgroundColor: colors.surfaceSunken,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    statsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    statCard: {
      flexGrow: 1,
      flexBasis: "47%",
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: hairlineWidth,
      borderColor: colors.hairline,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      gap: spacing.xs,
    },
    mathCard: { overflow: "hidden" },
    mathToggle: {
      borderWidth: 0,
      borderRadius: 0,
      backgroundColor: colors.surface,
    },
    mathBody: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.md,
      backgroundColor: colors.bg,
    },
    mathHairline: { marginHorizontal: -spacing.lg },
    mathLabel: { marginTop: spacing.xs },
    actionColumn: { gap: spacing.lg },
    actionBlock: { gap: spacing.sm },
    actionHint: {
      textAlign: "center",
      paddingHorizontal: spacing.md,
    },
    disclaimer: {
      textAlign: "center",
      paddingHorizontal: spacing.lg,
      marginTop: spacing.sm,
    },
  });
}

type CalcMode = "draw" | "water";

function stringParam(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") return value[0];
  return "";
}

function unitFromConvention(value: string): MassUnit | null {
  if (value === "mg" || value === "mcg") return value;
  return null;
}

function capacityFromParam(value: string): SyringeCapacity | null {
  if (value === "30" || value === "50" || value === "100") return Number(value) as SyringeCapacity;
  return null;
}

/** "vial", "vial and dose", "vial, water and dose" — never contradicts fields already filled in. */
function joinFieldNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function CalculatorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const styles = useMemo(() => createCalcStyles(colors), [colors]);

  const prefilledName = stringParam(params.compoundName);
  const prefilledUnit = unitFromConvention(stringParam(params.massUnitConvention));
  const prefilledVial = stringParam(params.vialMg);
  const prefilledWater = stringParam(params.diluentMl);
  const prefilledVialId = stringParam(params.vialId);
  const prefilledCapacity =
    capacityFromParam(stringParam(params.syringeCapacity)) ??
    capacityFromParam(stringParam(params.capacity));

  const [mode, setMode] = useState<CalcMode>("draw");
  const [compoundLabel, setCompoundLabel] = useState<string>(prefilledName);
  // Empty by default — never prefill demo vial/water that could read as a suggested setup.
  const [vialText, setVialText] = useState<string>(prefilledVial);
  const [waterText, setWaterText] = useState<string>(prefilledWater);
  const [doseText, setDoseText] = useState<string>("");
  const [doseUnit, setDoseUnit] = useState<MassUnit>(prefilledUnit ?? "mcg");
  const [targetUnitsText, setTargetUnitsText] = useState<string>("");
  const [capacity, setCapacity] = useState<SyringeCapacity>(prefilledCapacity ?? 50);
  const [showMath, setShowMath] = useState<boolean>(false);
  // The saved vial this draft was seeded from, if any — lets a dose logged
  // from here debit the right vial as long as the numbers still match it.
  const [sourceVial, setSourceVial] = useState<VialLinkSource | null>(
    prefilledVialId.length > 0 && prefilledVial.length > 0 && prefilledWater.length > 0
      ? { id: prefilledVialId, vialMg: prefilledVial, diluentMl: prefilledWater }
      : null,
  );
  const [restoredFromDraft, setRestoredFromDraft] = useState<boolean>(false);

  useEffect(() => {
    const name = stringParam(params.compoundName);
    const unit = unitFromConvention(stringParam(params.massUnitConvention));
    const vial = stringParam(params.vialMg);
    const water = stringParam(params.diluentMl);
    const vialId = stringParam(params.vialId);
    const nextCapacity =
      capacityFromParam(stringParam(params.syringeCapacity)) ??
      capacityFromParam(stringParam(params.capacity));
    // Re-seeds editable fields when a later navigation brings new route
    // params (e.g. "Calculate with this vial" while already on this screen)
    // without clobbering fields the params didn't provide.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (name.length > 0) setCompoundLabel(name);
    if (unit !== null) setDoseUnit(unit);
    if (vial.length > 0) setVialText(vial);
    if (water.length > 0) setWaterText(water);
    if (nextCapacity !== null) setCapacity(nextCapacity);
    if (vialId.length > 0 && vial.length > 0 && water.length > 0) {
      setSourceVial({ id: vialId, vialMg: vial, diluentMl: water });
      setRestoredFromDraft(false);
    }
  }, [
    params.compoundName,
    params.massUnitConvention,
    params.vialMg,
    params.diluentMl,
    params.syringeCapacity,
    params.capacity,
    params.vialId,
  ]);

  // Not a reactive subscription — this effect also WRITES this store via
  // saveCalcDraft, and subscribing to the value it writes would re-fire the
  // effect on every save (a new object each time) for an infinite loop.
  // The restore only ever needs the draft once, read imperatively below.
  const calcDraftHydrated = useCalcDraftStore((state) => state.hydrated);
  const saveCalcDraft = useCalcDraftStore((state) => state.save);
  // "init" — waiting on hydration/first decision; "restoring" — a restore's
  // setState calls were just issued and this effect is waiting for them to
  // land (a sibling firing in the same commit would otherwise see stale
  // pre-restore values and misread them as a user edit); "live" — normal,
  // every firing from here is a genuine change to persist.
  const phase = useRef<"init" | "restoring" | "live">("init");

  // Restore the last session's draft on a cold start with no fresh route
  // params (a navigation with params, e.g. "Calculate with this vial",
  // always wins over an older draft), then persist every change after —
  // one effect so the restore and its own resulting re-render can't race.
  useEffect(() => {
    if (!calcDraftHydrated) return;

    if (phase.current === "init") {
      const hasFreshParams =
        prefilledName.length > 0 || prefilledVial.length > 0 || prefilledWater.length > 0;
      const draft = useCalcDraftStore.getState().draft;
      if (hasFreshParams || draft === null || !draftHasContent(draft)) {
        phase.current = "live";
        return;
      }
      phase.current = "restoring";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode(draft.mode);
      setCompoundLabel(draft.compoundLabel);
      setVialText(draft.vialText);
      setWaterText(draft.waterText);
      setDoseText(draft.doseText);
      setDoseUnit(draft.doseUnit);
      setTargetUnitsText(draft.targetUnitsText);
      setCapacity(draft.capacity);
      setSourceVial(draft.sourceVial);
      setRestoredFromDraft(true);
      return;
    }

    if (phase.current === "restoring") {
      // The restore's own values have now landed — don't re-persist our
      // own echo or clear the note we just showed for it.
      phase.current = "live";
      return;
    }

    // A genuine edit — the "restored" note no longer describes what's on screen.
    setRestoredFromDraft(false);
    const draft: CalcDraft = {
      mode,
      compoundLabel,
      vialText,
      waterText,
      doseText,
      doseUnit,
      targetUnitsText,
      capacity,
      sourceVial,
    };
    void saveCalcDraft(draft);
  }, [
    calcDraftHydrated,
    prefilledName,
    prefilledVial,
    prefilledWater,
    mode,
    compoundLabel,
    vialText,
    waterText,
    doseText,
    doseUnit,
    targetUnitsText,
    capacity,
    sourceVial,
    saveCalcDraft,
  ]);

  const linkedVialId =
    sourceVial !== null && vialLinkIntact(sourceVial, { vialText, waterText })
      ? sourceVial.id
      : undefined;

  const vialMg = parseNumeric(vialText);
  const diluentMl = parseNumeric(waterText);
  const doseValue = parseNumeric(doseText);
  const targetUnits = parseNumeric(targetUnitsText);

  const drawResult: DrawOutcome | null = useMemo(() => {
    if (mode !== "draw" || vialMg === null || diluentMl === null || doseValue === null) return null;
    return calculateDraw({ vialMg, diluentMl, doseValue, doseUnit, syringeCapacityUnits: capacity });
  }, [mode, vialMg, diluentMl, doseValue, doseUnit, capacity]);

  const waterResult: DiluentOutcome | null = useMemo(() => {
    if (mode !== "water" || vialMg === null || doseValue === null || targetUnits === null) return null;
    return calculateDiluent({ vialMg, doseValue, doseUnit, targetUnits });
  }, [mode, vialMg, doseValue, doseUnit, targetUnits]);

  const activeResult = mode === "draw" ? drawResult : waterResult;
  const hasOkResult = activeResult !== null && activeResult.ok;
  const drawNeedsCorrection =
    drawResult !== null && drawResult.ok && requiresDrawCorrection(drawResult, capacity);
  const showUnitCallout = mode === "draw" && doseUnit === "mcg";

  // Only ever names the fields that are actually still empty, so this can't
  // contradict values already showing above it (e.g. a prefilled vial).
  const missingFields =
    mode === "draw"
      ? ([
          vialMg === null && "vial",
          diluentMl === null && "water",
          doseValue === null && "dose",
        ].filter((field): field is string => field !== false))
      : ([
          vialMg === null && "vial",
          doseValue === null && "dose",
          targetUnits === null && "target units",
        ].filter((field): field is string => field !== false));

  const logThisDose = () => {
    if (drawResult === null || !drawResult.ok || doseValue === null) return;
    hapticTick();
    router.push({
      pathname: "/log-entry",
      params: {
        doseValue: String(doseValue),
        doseUnit,
        units: String(drawResult.units),
        volumeMl: String(drawResult.volumeMl),
        ...(compoundLabel.trim().length > 0
          ? { compoundName: compoundLabel.trim() }
          : {}),
        ...(linkedVialId !== undefined ? { vialId: linkedVialId } : {}),
      },
    });
  };

  const saveAsVial = () => {
    if (drawResult === null || !drawResult.ok || vialMg === null || diluentMl === null) return;
    hapticTick();
    router.push({
      pathname: "/vial-new",
      params: {
        vialMg: String(vialMg),
        diluentMl: String(diluentMl),
        syringeCapacity: String(capacity),
        ...(compoundLabel.trim().length > 0
          ? { compoundName: compoundLabel.trim() }
          : {}),
      },
    });
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="display">Calculator</AppText>
              {compoundLabel.length > 0 ? (
                <AppText variant="label" tone="secondary" testID="calc-compound-name">
                  {compoundLabel}
                </AppText>
              ) : null}
            </View>
            <View style={styles.modeSeg}>
              <SegmentedControl<CalcMode>
                options={[
                  { value: "draw", label: "Recon" },
                  { value: "water", label: "Reverse" },
                ]}
                value={mode}
                onChange={setMode}
                testID="calc-mode"
              />
            </View>
          </View>

          <AppText variant="caption" tone="secondary">
            {mode === "draw"
              ? "You've mixed your vial. Enter water and your dose — see units to draw."
              : "Before you mix. Pick dose and draw size — see how much water to add."}
          </AppText>

          {restoredFromDraft ? (
            <Callout tone="info" compact testID="calc-restored-note">
              Restored from your last session.
            </Callout>
          ) : null}

          <Card elevated style={styles.formCard}>
            <View style={styles.fieldBlock}>
              <Field
                label="Peptide in vial"
                hint="total content, not your dose"
                value={vialText}
                onChangeText={setVialText}
                suffix="mg"
                placeholder="5"
                testID="input-vial"
              />
              <QuickPicks
                options={[
                  { label: "2 mg", value: "2" },
                  { label: "5 mg", value: "5" },
                  { label: "10 mg", value: "10" },
                  { label: "15 mg", value: "15" },
                ]}
                selected={vialText}
                onSelect={setVialText}
                testID="qp-vial"
              />
            </View>

            {mode === "draw" ? (
              <View style={styles.fieldBlock}>
                <Field
                  label="Bacteriostatic water"
                  hint="mL only — not units"
                  value={waterText}
                  onChangeText={setWaterText}
                  suffix="mL"
                  placeholder="2"
                  testID="input-water"
                />
                <QuickPicks
                  options={[
                    { label: "1 mL", value: "1" },
                    { label: "2 mL", value: "2" },
                    { label: "3 mL", value: "3" },
                  ]}
                  selected={waterText}
                  onSelect={setWaterText}
                  testID="qp-water"
                />
              </View>
            ) : (
              <Field
                label="Units you want one dose to be"
                hint="U-100 scale"
                value={targetUnitsText}
                onChangeText={setTargetUnitsText}
                suffix="units"
                placeholder="10"
                testID="input-target-units"
              />
            )}

            <Field
              label="Desired dose"
              hint="your entry — not a recommendation"
              value={doseText}
              onChangeText={setDoseText}
              suffix={doseUnit}
              placeholder={doseUnit === "mcg" ? "250" : "0.25"}
              testID="input-dose"
              accessory={
                <View style={styles.unitToggle}>
                  <SegmentedControl<MassUnit>
                    options={[
                      { value: "mcg", label: "mcg" },
                      { value: "mg", label: "mg" },
                    ]}
                    value={doseUnit}
                    onChange={setDoseUnit}
                    mono
                    appearance="solid"
                  />
                </View>
              }
            />

            {mode === "draw" && (
              <View style={styles.fieldBlock}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <AppText variant="overline" tone="secondary">
                    Syringe capacity
                  </AppText>
                  <AppText variant="caption" mono tone="faint">
                    U-100 insulin scale
                  </AppText>
                </View>
                <QuickPicks
                  equal
                  options={SYRINGES.map((spec) => ({
                    label: `${spec.capacityMl} mL`,
                    sublabel: `${spec.capacityUnits} units`,
                    value: String(spec.capacityUnits),
                  }))}
                  selected={String(capacity)}
                  onSelect={(value) => {
                    const next = capacityFromParam(value);
                    if (next !== null) setCapacity(next);
                  }}
                  testID="syringe-capacity"
                />
              </View>
            )}
          </Card>

          {showUnitCallout ? (
            <Callout tone="warn" title="Unit check" compact={hasOkResult}>
              {hasOkResult
                ? "Unit check — units and mL shown separately."
                : "Dose is in mcg · vial is in mg. The result shows syringe units and mL separately so they cannot be confused."}
            </Callout>
          ) : null}

          {activeResult === null && (
            <Card elevated style={styles.resultCard}>
              <AppText variant="overline" tone="secondary">
                {mode === "draw" ? "Exact draw" : "Water to add"}
              </AppText>
              <AppText variant="body" tone="secondary">
                {mode === "draw"
                  ? `Enter your ${joinFieldNames(missingFields)}. The draw appears here.`
                  : `Enter your ${joinFieldNames(missingFields)}. Water volume appears here.`}
              </AppText>
            </Card>
          )}

          {activeResult !== null && !activeResult.ok && (
            <Card elevated style={styles.resultCard}>
              <AppText variant="overline" tone="secondary">
                Check inputs
              </AppText>
              {activeResult.errors.map((error) => (
                <AppText key={error} variant="label" tone="secondary">
                  {error}
                </AppText>
              ))}
            </Card>
          )}

          {hasOkResult && activeResult.ok && (
            <Warnings
              warnings={activeResult.warnings}
              critical={mode === "draw" && drawNeedsCorrection}
            />
          )}

          {mode === "draw" && drawResult !== null && drawResult.ok && (
            <View style={styles.resultGroup}>
              <Card dark elevated style={styles.resultCard} testID="draw-result">
                <View style={styles.overlineBlock}>
                  <AppText variant="overline" tone="onDarkSecondary">
                    Exact draw
                  </AppText>
                </View>
                <View style={styles.bigNumberRow}>
                  <AnimatedReadout value={drawResult.units} decimals={1} testID="draw-units-readout" />
                  <AppText
                    variant="heading"
                    mono
                    weight="medium"
                    style={styles.unitSuffix}
                  >
                    units
                  </AppText>
                </View>
                <AppText variant="label" tone="onDarkSecondary" mono>
                  U-100 · {fmt(drawResult.volumeMl, 3)} mL
                </AppText>

                <Hairline dark />

                <View style={styles.gaugeWell}>
                  <SyringeGauge units={drawResult.units} capacity={capacity} />
                </View>
              </Card>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <AppText variant="overline" tone="faint">
                    Concentration
                  </AppText>
                  <AppText variant="heading" mono weight="semibold">
                    {fmt(drawResult.concentrationMgPerMl, 3)} mg/mL
                  </AppText>
                </View>
                <View style={styles.statCard}>
                  <AppText variant="overline" tone="faint">
                    Volume / dose
                  </AppText>
                  <AppText variant="heading" mono weight="semibold">
                    {fmt(drawResult.volumeMl, 3)} mL
                  </AppText>
                </View>
                <View style={styles.statCard}>
                  <AppText variant="overline" tone="faint">
                    Doses in vial
                  </AppText>
                  <AppText variant="heading" mono weight="semibold">
                    {String(drawResult.dosesPerVial)}
                  </AppText>
                  <AppText variant="caption" tone="faint" mono>
                    at {fmt(drawResult.doseMcg)} mcg
                  </AppText>
                </View>
              </View>
            </View>
          )}

          {mode === "water" && waterResult !== null && waterResult.ok && targetUnits !== null && (
            <View style={styles.resultGroup}>
              <Card dark elevated style={styles.resultCard} testID="water-result">
                <AppText variant="overline" tone="onDarkSecondary">
                  Water to add
                </AppText>
                <View style={styles.bigNumberRow}>
                  <AnimatedReadout value={waterResult.diluentMl} decimals={2} testID="water-ml-readout" />
                  <AppText variant="heading" mono weight="medium" style={styles.unitSuffix}>
                    mL
                  </AppText>
                </View>
                <AppText variant="label" tone="onDarkSecondary" mono>
                  bacteriostatic water · one-time mix
                </AppText>
                <Hairline dark />
                {/* The gauge depicts the DOSE draw, not the water above — without
                    the caption, "1.5 mL" next to a 15-unit gauge reads as a
                    (wrong) mL→units conversion. */}
                <AppText variant="caption" tone="onDarkSecondary">
                  Each dose you draw: {fmt(targetUnits)} units on a U-100 syringe
                </AppText>
                <View style={styles.gaugeWell}>
                  <SyringeGauge units={targetUnits} capacity={100} />
                </View>
              </Card>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <AppText variant="overline" tone="faint">
                    Concentration
                  </AppText>
                  <AppText variant="heading" mono weight="semibold">
                    {fmt(waterResult.concentrationMgPerMl, 3)} mg/mL
                  </AppText>
                </View>
                <View style={styles.statCard}>
                  <AppText variant="overline" tone="faint">
                    Doses in vial
                  </AppText>
                  <AppText variant="heading" mono weight="semibold">
                    {String(waterResult.dosesPerVial)}
                  </AppText>
                </View>
              </View>
            </View>
          )}

          {hasOkResult && activeResult.ok && (
            <Card elevated padded={false} style={styles.mathCard}>
              <Button
                label={showMath ? "Hide the math" : "Show the math"}
                tone="ghost"
                onPress={() => setShowMath((current) => !current)}
                icon={
                  showMath ? (
                    <ChevronUp size={16} color={colors.ink} />
                  ) : (
                    <ChevronDown size={16} color={colors.ink} />
                  )
                }
                style={styles.mathToggle}
                testID="toggle-math"
              />
              {showMath && (
                <Animated.View
                  entering={FadeInDown.duration(280).springify().damping(18)}
                  style={styles.mathBody}
                >
                  <View style={styles.mathHairline}>
                    <Hairline />
                  </View>
                  <AppText variant="overline" tone="faint" style={styles.mathLabel}>
                    Worked steps
                  </AppText>
                  <MathSteps steps={activeResult.steps} />
                </Animated.View>
              )}
            </Card>
          )}

          {mode === "draw" && drawResult !== null && drawResult.ok && (
            <View style={styles.actionColumn}>
              <View style={styles.actionBlock}>
                <Button
                  label="Save as vial"
                  tone="primary"
                  onPress={saveAsVial}
                  icon={<TestTubes size={17} color={colors.onSolid} />}
                  testID="save-as-vial"
                />
                <AppText variant="caption" tone="faint" style={styles.actionHint}>
                  Keeps this mix for reuse — opens vial setup with these numbers.
                </AppText>
              </View>
              <View style={styles.actionBlock}>
                <Button
                  label={drawNeedsCorrection ? "Correct inputs before logging" : "Log this dose"}
                  tone="ghost"
                  onPress={logThisDose}
                  disabled={drawNeedsCorrection}
                  icon={<NotebookPen size={17} color={colors.ink} />}
                  testID="log-this-dose"
                />
                <AppText variant="caption" tone="faint" style={styles.actionHint}>
                  {drawNeedsCorrection
                    ? "This result does not fit the selected syringe or exceeds the vial amount."
                    : "One-off record in History — does not create a vial."}
                </AppText>
              </View>
            </View>
          )}

          <AppText variant="caption" tone="secondary" style={styles.disclaimer}>
            {DISCLAIMER}
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

export default withAccessibleTabScreen(CalculatorScreen, (pathname) => pathname === "/");
