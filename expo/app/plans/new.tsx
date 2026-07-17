import { useRouter } from "expo-router";
import { ChevronLeft, Plus, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";

import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import Field from "@/src/components/ui/Field";
import Screen from "@/src/components/ui/Screen";
import SegmentedControl from "@/src/components/ui/SegmentedControl";
import type { MassUnit } from "@/src/engine";
import { fmt } from "@/src/engine";
import { parseNumeric } from "@/src/engine/parse";
import { formatTimeOfDay } from "@/src/engine/schedule";
import { usePlansStore } from "@/src/store/plans";
import { selectActiveVials, useVialsStore } from "@/src/store/vials";
import { colors, hairlineWidth, radius, spacing } from "@/src/theme/tokens";

const DAY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const HOURS: number[] = Array.from({ length: 24 }, (_, index) => index);
const MINUTES: number[] = [0, 15, 30, 45];

export default function NewPlanScreen() {
  const router = useRouter();
  const addPlan = usePlansStore((state) => state.addPlan);
  const vials = useVialsStore(useShallow(selectActiveVials));

  const [compoundName, setCompoundName] = useState<string>("");
  const [planName, setPlanName] = useState<string>("");
  const [doseText, setDoseText] = useState<string>("");
  const [doseUnit, setDoseUnit] = useState<MassUnit>("mcg");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [timesLocal, setTimesLocal] = useState<string[]>([]);
  const [hourText, setHourText] = useState<string>("8");
  const [minute, setMinute] = useState<number>(0);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [vialId, setVialId] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState<boolean>(false);

  const doseValue = parseNumeric(doseText);
  const parsedHour = parseNumeric(hourText);
  const hourValid =
    parsedHour !== null && Number.isInteger(parsedHour) && HOURS.includes(parsedHour);

  const canSave = useMemo(() => {
    return (
      compoundName.trim().length > 0 &&
      doseValue !== null &&
      doseValue > 0 &&
      daysOfWeek.length > 0 &&
      timesLocal.length > 0
    );
  }, [compoundName, doseValue, daysOfWeek.length, timesLocal.length]);

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((value) => value !== day) : [...prev, day].sort((a, b) => a - b),
    );
  };

  const addTime = () => {
    if (!hourValid || parsedHour === null) {
      setTimeError("Enter an hour from 0 to 23.");
      return;
    }
    const normalised = formatTimeOfDay({ hour: parsedHour, minute });
    if (timesLocal.includes(normalised)) {
      setTimeError("That time is already added.");
      return;
    }
    setTimesLocal((prev) => [...prev, normalised].sort());
    setTimeError(null);
  };

  const removeTime = (time: string) => {
    setTimesLocal((prev) => prev.filter((value) => value !== time));
  };

  const save = () => {
    if (!canSave || doseValue === null || saving) return;
    setSaving(true);
    addPlan({
      compoundName: compoundName.trim(),
      name: planName.trim().length > 0 ? planName.trim() : undefined,
      doseValue,
      doseUnit,
      daysOfWeek,
      timesLocal,
      vialId,
    })
      .then(() => router.back())
      .catch((error) => {
        console.error("[plans/new] Failed to create plan", error);
        setSaving(false);
      });
  };

  return (
    <Screen topInset={Platform.OS !== "ios"}>
      <View style={styles.chrome}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backButton}
          testID="plan-new-back"
        >
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.chromeText}>
          <AppText variant="heading">New plan</AppText>
          <AppText variant="caption" tone="faint">
            Every value is yours — nothing is suggested
          </AppText>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.formCard}>
            <Field
              label="Compound name"
              value={compoundName}
              onChangeText={setCompoundName}
              mono={false}
              keyboardType="default"
              placeholder="As you call it"
              testID="input-plan-compound"
            />
            <Field
              label="Plan name (optional)"
              value={planName}
              onChangeText={setPlanName}
              mono={false}
              keyboardType="default"
              placeholder="Defaults to compound name"
              testID="input-plan-name"
            />
            <Field
              label="Dose"
              value={doseText}
              onChangeText={setDoseText}
              suffix={doseUnit}
              placeholder=""
              testID="input-plan-dose"
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
          </Card>

          <View style={styles.section}>
            <AppText variant="overline" tone="faint">
              Days of week
            </AppText>
            <View style={styles.chipsRow}>
              {DAY_OPTIONS.map((day) => {
                const active = daysOfWeek.includes(day.value);
                return (
                  <Pressable
                    key={day.value}
                    onPress={() => toggleDay(day.value)}
                    style={[styles.chip, active && styles.chipActive]}
                    testID={`day-chip-${day.value}`}
                  >
                    <AppText
                      variant="label"
                      weight={active ? "semibold" : "medium"}
                      tone={active ? "onAccent" : "secondary"}
                    >
                      {day.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="overline" tone="faint">
              Time(s)
            </AppText>
            <View style={styles.pickerRow}>
              <View style={styles.hourField}>
                <Field
                  label="Hour (0–23)"
                  value={hourText}
                  onChangeText={(text) => {
                    setHourText(text);
                    if (timeError) setTimeError(null);
                  }}
                  suffix="h"
                  placeholder="8"
                  keyboardType="number-pad"
                  testID="input-plan-time-hour"
                />
              </View>
              <View style={styles.minuteChips}>
                <AppText variant="overline" tone="faint">
                  Minute
                </AppText>
                <View style={styles.minuteChipRow}>
                  {MINUTES.map((candidate) => {
                    const active = minute === candidate;
                    return (
                      <Pressable
                        key={candidate}
                        onPress={() => {
                          setMinute(candidate);
                          if (timeError) setTimeError(null);
                        }}
                        style={[styles.minuteChip, active && styles.minuteChipActive]}
                        testID={`plan-minute-${candidate}`}
                      >
                        <AppText
                          variant="label"
                          mono
                          weight={active ? "semibold" : "regular"}
                          tone={active ? "onAccent" : "secondary"}
                        >
                          {String(candidate).padStart(2, "0")}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
            <Button
              label="Add time"
              tone="ghost"
              compact
              onPress={addTime}
              icon={<Plus size={16} color={colors.ink} />}
              testID="add-plan-time"
            />
            {timeError !== null && (
              <AppText variant="caption" tone="danger" testID="plan-time-error">
                {timeError}
              </AppText>
            )}
            {timesLocal.length > 0 && (
              <View style={styles.chipsRow}>
                {timesLocal.map((time) => (
                  <Pressable
                    key={time}
                    onPress={() => removeTime(time)}
                    style={styles.chip}
                    testID={`time-chip-${time}`}
                  >
                    <AppText variant="label" mono weight="medium" tone="secondary">
                      {time}
                    </AppText>
                    <X size={14} color={colors.inkFaint} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {vials.length > 0 && (
            <View style={styles.section}>
              <AppText variant="overline" tone="faint">
                Default vial (optional)
              </AppText>
              <View style={styles.chipsRow}>
                {vials.map((vial) => {
                  const active = vialId === vial.id;
                  return (
                    <Pressable
                      key={vial.id}
                      onPress={() => setVialId(active ? undefined : vial.id)}
                      style={[styles.chip, active && styles.chipActive]}
                      testID={`plan-vial-chip-${vial.id}`}
                    >
                      <AppText
                        variant="label"
                        weight={active ? "semibold" : "medium"}
                        tone={active ? "onAccent" : "secondary"}
                      >
                        {vial.name}
                      </AppText>
                      <AppText variant="caption" mono tone={active ? "onAccent" : "faint"}>
                        {fmt(vial.vialMg)} mg
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <Button
            label="Create plan"
            tone="accent"
            onPress={save}
            disabled={!canSave || saving}
            testID="save-plan"
          />
          {!canSave && (
            <AppText variant="caption" tone="faint" style={styles.hint}>
              Enter a compound, dose, at least one day, and at least one time.
            </AppText>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  chrome: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chromeText: {
    flex: 1,
    gap: 2,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  formCard: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: hairlineWidth,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  timeField: {
    flex: 1,
  },
  pickerRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  hourField: {
    flex: 1,
  },
  minuteChips: {
    flex: 1.4,
    gap: spacing.xs + 2,
  },
  minuteChipRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  minuteChip: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: hairlineWidth,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  minuteChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  unitToggle: {
    width: 118,
  },
  hint: {
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});
