import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronDown, ChevronUp, NotebookPen, TestTubes } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import MathSteps from "@/src/components/domain/MathSteps";
import SyringeGauge from "@/src/components/domain/SyringeGauge";
import Warnings from "@/src/components/domain/Warnings";
import AnimatedReadout from "@/src/components/ui/AnimatedReadout";
import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import Hairline from "@/src/components/ui/Hairline";
import Field from "@/src/components/ui/Field";
import Screen from "@/src/components/ui/Screen";
import SegmentedControl from "@/src/components/ui/SegmentedControl";
import { hapticTick } from "@/src/haptics";
import type { DiluentOutcome, DrawOutcome, MassUnit, SyringeCapacity } from "@/src/engine";
import { calculateDiluent, calculateDraw, fmt, SYRINGES } from "@/src/engine";
import { parseNumeric } from "@/src/engine/parse";
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
      padding: spacing.lg,
      gap: spacing.section,
      paddingBottom: spacing.xxl,
    },
    header: {
      gap: spacing.xs,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    modeBlock: { gap: spacing.sm },
    modeHint: { paddingHorizontal: spacing.xs },
    formCard: { gap: spacing.xl },
    unitToggle: { width: 118 },
    syringeRow: { gap: spacing.sm },
    resultGroup: { gap: spacing.md },
    resultCard: { gap: spacing.lg },
    overlineBlock: { gap: spacing.xs },
    redTick: {
      width: 3,
      height: 12,
      backgroundColor: colors.accent,
      borderRadius: 1,
    },
    bigNumberRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: spacing.sm,
    },
    unitSuffix: {
      letterSpacing: letterSpacing.tight,
      paddingBottom: spacing.xs,
    },
    gaugeWell: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: hairlineWidth,
      borderColor: colors.hairlineDark,
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
      borderRadius: radius.md,
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

export default function CalculatorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const styles = useMemo(() => createCalcStyles(colors), [colors]);

  const prefilledName = stringParam(params.compoundName);
  const prefilledUnit = unitFromConvention(stringParam(params.massUnitConvention));
  const prefilledVial = stringParam(params.vialMg);
  const prefilledWater = stringParam(params.diluentMl);
  const prefilledCapacity =
    capacityFromParam(stringParam(params.syringeCapacity)) ??
    capacityFromParam(stringParam(params.capacity));

  const [mode, setMode] = useState<CalcMode>("draw");
  const [compoundLabel, setCompoundLabel] = useState<string>(prefilledName);
  const [vialText, setVialText] = useState<string>(prefilledVial);
  const [waterText, setWaterText] = useState<string>(prefilledWater);
  const [doseText, setDoseText] = useState<string>("");
  const [doseUnit, setDoseUnit] = useState<MassUnit>(prefilledUnit ?? "mcg");
  const [targetUnitsText, setTargetUnitsText] = useState<string>("");
  const [capacity, setCapacity] = useState<SyringeCapacity>(prefilledCapacity ?? 100);
  const [showMath, setShowMath] = useState<boolean>(false);

  useEffect(() => {
    const name = stringParam(params.compoundName);
    const unit = unitFromConvention(stringParam(params.massUnitConvention));
    const vial = stringParam(params.vialMg);
    const water = stringParam(params.diluentMl);
    const nextCapacity =
      capacityFromParam(stringParam(params.syringeCapacity)) ??
      capacityFromParam(stringParam(params.capacity));
    if (name.length > 0) setCompoundLabel(name);
    if (unit !== null) setDoseUnit(unit);
    if (vial.length > 0) setVialText(vial);
    if (water.length > 0) setWaterText(water);
    if (nextCapacity !== null) setCapacity(nextCapacity);
  }, [
    params.compoundName,
    params.massUnitConvention,
    params.vialMg,
    params.diluentMl,
    params.syringeCapacity,
    params.capacity,
  ]);

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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <AppText variant="overline" tone="faint">
              PepRep · U-100 instrument
            </AppText>
            <AppText variant="title">Reconstitution</AppText>
            {compoundLabel.length > 0 && (
              <AppText variant="label" tone="secondary" testID="calc-compound-name">
                {compoundLabel}
              </AppText>
            )}
          </View>

          <View style={styles.modeBlock}>
            <SegmentedControl<CalcMode>
              options={[
                { value: "draw", label: "How much do I draw?" },
                { value: "water", label: "How much water do I add?" },
              ]}
              value={mode}
              onChange={setMode}
              testID="calc-mode"
            />
            <AppText variant="caption" tone="secondary" style={styles.modeHint}>
              {mode === "draw"
                ? "You've mixed your vial. Enter the water you added and your dose — see the units to draw."
                : "Before you mix. Pick the dose and the draw size you want — see how much water to add."}
            </AppText>
          </View>

          <Card elevated style={styles.formCard}>
            <Field
              label="Peptide in vial"
              value={vialText}
              onChangeText={setVialText}
              suffix="mg"
              placeholder="5"
              testID="input-vial"
            />
            {mode === "draw" ? (
              <Field
                label="Bacteriostatic water added"
                value={waterText}
                onChangeText={setWaterText}
                suffix="mL"
                placeholder="2"
                testID="input-water"
              />
            ) : (
              <Field
                label="Units you want one dose to be"
                value={targetUnitsText}
                onChangeText={setTargetUnitsText}
                suffix="units"
                placeholder="10"
                testID="input-target-units"
              />
            )}
            <Field
              label="Your dose"
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
                  />
                </View>
              }
            />
            {mode === "draw" && (
              <View style={styles.syringeRow}>
                <AppText variant="overline" tone="faint">
                  Syringe barrel
                </AppText>
                <SegmentedControl<SyringeCapacity>
                  options={SYRINGES.map((spec) => ({
                    value: spec.capacityUnits,
                    label: spec.label,
                  }))}
                  value={capacity}
                  onChange={setCapacity}
                  mono
                  testID="syringe-capacity"
                />
              </View>
            )}
          </Card>

          {activeResult === null && (
            <Card elevated style={styles.resultCard}>
              <View style={styles.overlineBlock}>
                <AppText variant="overline" tone="faint">
                  {mode === "draw" ? "Exact draw" : "Water to add"}
                </AppText>
                <View style={styles.redTick} />
              </View>
              <AppText variant="body" tone="secondary">
                {mode === "draw"
                  ? "Enter the vial amount, water volume and your dose. The draw appears here."
                  : "Enter the vial amount, your dose and the draw size you want. The water volume appears here."}
              </AppText>
            </Card>
          )}

          {activeResult !== null && !activeResult.ok && (
            <Card elevated style={styles.resultCard}>
              <View style={styles.overlineBlock}>
                <AppText variant="overline" tone="faint">
                  Check inputs
                </AppText>
                <View style={styles.redTick} />
              </View>
              {activeResult.errors.map((error) => (
                <AppText key={error} variant="label" tone="secondary">
                  {error}
                </AppText>
              ))}
            </Card>
          )}

          {mode === "draw" && drawResult !== null && drawResult.ok && (
            <View style={styles.resultGroup}>
              <Card dark elevated style={styles.resultCard} testID="draw-result">
                <View style={styles.overlineBlock}>
                  <AppText variant="overline" tone="onDarkSecondary">
                    Exact draw
                  </AppText>
                  <View style={styles.redTick} />
                </View>
                <View style={styles.bigNumberRow}>
                  <AnimatedReadout value={drawResult.units} decimals={1} testID="draw-units-readout" />
                  <AppText
                    variant="heading"
                    tone="onDarkSecondary"
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
                  <AppText variant="caption" tone="faint" mono>
                    {fmt(drawResult.concentrationMcgPerMl)} mcg/mL
                  </AppText>
                </View>
                <View style={styles.statCard}>
                  <AppText variant="overline" tone="faint">
                    Volume per dose
                  </AppText>
                  <AppText variant="heading" mono weight="semibold">
                    {fmt(drawResult.volumeMl, 3)} mL
                  </AppText>
                  <AppText variant="caption" tone="faint" mono>
                    one injection
                  </AppText>
                </View>
                <View style={styles.statCard}>
                  <AppText variant="overline" tone="faint">
                    Doses in this vial
                  </AppText>
                  <AppText variant="heading" mono weight="semibold">
                    {String(drawResult.dosesPerVial)}
                  </AppText>
                  <AppText variant="caption" tone="faint" mono>
                    at {fmt(drawResult.doseMcg)} mcg each
                  </AppText>
                </View>
              </View>
            </View>
          )}

          {mode === "water" && waterResult !== null && waterResult.ok && targetUnits !== null && (
            <View style={styles.resultGroup}>
              <Card dark elevated style={styles.resultCard} testID="water-result">
                <View style={styles.overlineBlock}>
                  <AppText variant="overline" tone="onDarkSecondary">
                    Water to add
                  </AppText>
                  <View style={styles.redTick} />
                </View>
                <View style={styles.bigNumberRow}>
                  <AnimatedReadout value={waterResult.diluentMl} decimals={2} testID="water-ml-readout" />
                  <AppText
                    variant="heading"
                    tone="onDarkSecondary"
                    mono
                    weight="medium"
                    style={styles.unitSuffix}
                  >
                    mL
                  </AppText>
                </View>
                <AppText variant="label" tone="onDarkSecondary" mono>
                  bacteriostatic water · one-time mix
                </AppText>

                <Hairline dark />

                <AppText variant="caption" tone="onDarkSecondary">
                  Draw this water volume produces
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
                  <AppText variant="caption" tone="faint" mono>
                    {fmt(waterResult.concentrationMcgPerMl)} mcg/mL
                  </AppText>
                </View>
                <View style={styles.statCard}>
                  <AppText variant="overline" tone="faint">
                    Doses in this vial
                  </AppText>
                  <AppText variant="heading" mono weight="semibold">
                    {String(waterResult.dosesPerVial)}
                  </AppText>
                  <AppText variant="caption" tone="faint" mono>
                    full doses
                  </AppText>
                </View>
              </View>
            </View>
          )}

          {hasOkResult && activeResult.ok && <Warnings warnings={activeResult.warnings} />}

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
                <Animated.View entering={FadeInDown.duration(280).springify().damping(18)} style={styles.mathBody}>
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
                  tone="accent"
                  onPress={saveAsVial}
                  icon={<TestTubes size={17} color={colors.onAccent} />}
                  testID="save-as-vial"
                />
                <AppText variant="caption" tone="faint" style={styles.actionHint}>
                  Keeps this mix for reuse — opens vial setup with these numbers.
                </AppText>
              </View>
              <View style={styles.actionBlock}>
                <Button
                  label="Log this dose"
                  tone="ghost"
                  onPress={logThisDose}
                  icon={<NotebookPen size={17} color={colors.ink} />}
                  testID="log-this-dose"
                />
                <AppText variant="caption" tone="faint" style={styles.actionHint}>
                  One-off record in History — does not create a vial.
                </AppText>
              </View>
            </View>
          )}

          <AppText variant="caption" tone="faint" style={styles.disclaimer}>
            {DISCLAIMER}
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
