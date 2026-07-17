import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronDown, ChevronUp, NotebookPen, TestTubes } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

import MathSteps from "@/src/components/domain/MathSteps";
import SyringeGauge from "@/src/components/domain/SyringeGauge";
import Warnings from "@/src/components/domain/Warnings";
import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import Hairline from "@/src/components/ui/Hairline";
import Field from "@/src/components/ui/Field";
import Screen from "@/src/components/ui/Screen";
import SegmentedControl from "@/src/components/ui/SegmentedControl";
import type { DiluentOutcome, DrawOutcome, MassUnit, SyringeCapacity } from "@/src/engine";
import { calculateDiluent, calculateDraw, fmt, SYRINGES } from "@/src/engine";
import { parseNumeric } from "@/src/engine/parse";
import { colors, DISCLAIMER, hairlineWidth, radius, spacing } from "@/src/theme/tokens";

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

          <SegmentedControl<CalcMode>
            options={[
              { value: "draw", label: "Dose → draw" },
              { value: "water", label: "Draw → water" },
            ]}
            value={mode}
            onChange={setMode}
            testID="calc-mode"
          />

          <Card style={styles.formCard}>
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
            <Card style={styles.resultCard}>
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
            <Card style={styles.resultCard}>
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
              <Card style={styles.resultCard} testID="draw-result">
                <View style={styles.overlineBlock}>
                  <AppText variant="overline" tone="faint">
                    Exact draw
                  </AppText>
                  <View style={styles.redTick} />
                </View>
                <View style={styles.bigNumberRow}>
                  <AppText mono weight="semibold" style={styles.bigNumber}>
                    {fmt(drawResult.units, 1)}
                  </AppText>
                  <AppText variant="title" tone="secondary" mono>
                    units
                  </AppText>
                </View>
                <AppText variant="label" tone="secondary" mono>
                  U-100 · {fmt(drawResult.volumeMl, 3)} mL
                </AppText>

                <Hairline />

                <SyringeGauge units={drawResult.units} capacity={capacity} />
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

          {mode === "water" && waterResult !== null && waterResult.ok && (
            <View style={styles.resultGroup}>
              <Card style={styles.resultCard} testID="water-result">
                <View style={styles.overlineBlock}>
                  <AppText variant="overline" tone="faint">
                    Water to add
                  </AppText>
                  <View style={styles.redTick} />
                </View>
                <View style={styles.bigNumberRow}>
                  <AppText mono weight="semibold" style={styles.bigNumber}>
                    {fmt(waterResult.diluentMl, 2)}
                  </AppText>
                  <AppText variant="title" tone="secondary" mono>
                    mL
                  </AppText>
                </View>
                <AppText variant="label" tone="secondary" mono>
                  bacteriostatic water · one-time mix
                </AppText>
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
            <Card padded={false}>
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
                <View style={styles.mathBody}>
                  <Hairline />
                  <MathSteps steps={activeResult.steps} />
                </View>
              )}
            </Card>
          )}

          {mode === "draw" && drawResult !== null && drawResult.ok && (
            <View style={styles.actionRow}>
              <Button
                label="Log this dose"
                tone="accent"
                onPress={logThisDose}
                icon={<NotebookPen size={17} color={colors.onAccent} />}
                testID="log-this-dose"
                style={styles.actionButton}
              />
              <Button
                label="Save as vial"
                tone="primary"
                onPress={saveAsVial}
                icon={<TestTubes size={17} color={colors.onDark} />}
                testID="save-as-vial"
                style={styles.actionButton}
              />
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

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  formCard: {
    gap: spacing.lg,
  },
  unitToggle: {
    width: 118,
  },
  syringeRow: {
    gap: spacing.xs + 2,
  },
  resultGroup: {
    gap: spacing.sm,
  },
  resultCard: {
    gap: spacing.md,
  },
  overlineBlock: {
    gap: spacing.xs,
  },
  redTick: {
    width: 3,
    height: 11,
    backgroundColor: colors.accent,
  },
  bigNumberRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  bigNumber: {
    fontSize: 52,
    lineHeight: 58,
    color: colors.ink,
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
    padding: spacing.lg,
    gap: spacing.xs,
  },
  mathToggle: {
    borderWidth: 0,
  },
  mathBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  actionRow: {
    gap: spacing.sm,
  },
  actionButton: {
    alignSelf: "stretch",
  },
  disclaimer: {
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});
