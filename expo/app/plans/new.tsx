import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Plus, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import { countPlanReminderSlots, planReminderCopy } from "@/src/engine/planReminders";
import { parseNumeric } from "@/src/engine/parse";
import { dayKey, versionActiveOn } from "@/src/engine/schedule";
import { usePlansStore } from "@/src/store/plans";
import { selectActiveVials, useVialsStore } from "@/src/store/vials";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

const DAY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function stringParam(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) return value[0] ?? "";
  return "";
}

export default function NewPlanScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const addPlan = usePlansStore((state) => state.addPlan);
  const appendVersion = usePlansStore((state) => state.appendVersion);
  const plans = usePlansStore((state) => state.plans);
  const vials = useVialsStore(useShallow(selectActiveVials));

  const editPlanId = stringParam(params.planId);
  const editingPlan = plans.find((plan) => plan.id === editPlanId);
  const editingVersion =
    editingPlan !== undefined
      ? versionActiveOn(editingPlan, dayKey(new Date().toISOString())) ??
        editingPlan.versions[editingPlan.versions.length - 1]
      : undefined;
  const isEditing = editingPlan !== undefined && editingVersion !== undefined;

  const [compoundName, setCompoundName] = useState<string>(editingPlan?.compoundName ?? "");
  const [planName, setPlanName] = useState<string>(editingVersion?.name ?? "");
  const [doseText, setDoseText] = useState<string>(
    editingVersion !== undefined ? String(editingVersion.doseValue) : "",
  );
  const [doseUnit, setDoseUnit] = useState<MassUnit>(editingVersion?.doseUnit ?? "mcg");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(editingVersion?.daysOfWeek ?? []);
  const [timesLocal, setTimesLocal] = useState<string[]>(editingVersion?.timesLocal ?? []);
  const [timeDraft, setTimeDraft] = useState<string>("");
  const [vialId, setVialId] = useState<string | undefined>(editingVersion?.vialId);
  const [remindMe, setRemindMe] = useState<boolean>(
    editingPlan?.reminderConfig?.enabled === true ||
      (editingPlan?.reminderNotificationIds?.length ?? 0) > 0,
  );
  const [privacyMode, setPrivacyMode] = useState<boolean>(
    editingPlan?.reminderConfig?.privacyMode !== false,
  );
  const [saving, setSaving] = useState<boolean>(false);

  const doseValue = parseNumeric(doseText);
  const reminderSlots = countPlanReminderSlots(daysOfWeek, timesLocal);
  const previewCopy = planReminderCopy({
    privacyMode,
    compoundName: compoundName.trim().length > 0 ? compoundName : "your plan",
    timeLocal: timesLocal[0] ?? "08:00",
  });
  const isWeb = Platform.OS === "web";

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
    const trimmed = timeDraft.trim();
    if (!TIME_PATTERN.test(trimmed)) return;
    if (timesLocal.includes(trimmed)) {
      setTimeDraft("");
      return;
    }
    setTimesLocal((prev) => [...prev, trimmed].sort());
    setTimeDraft("");
  };

  const removeTime = (time: string) => {
    setTimesLocal((prev) => prev.filter((value) => value !== time));
  };

  const save = () => {
    if (!canSave || doseValue === null || saving) return;
    setSaving(true);
    const input = {
      compoundName: compoundName.trim(),
      name: planName.trim().length > 0 ? planName.trim() : undefined,
      doseValue,
      doseUnit,
      daysOfWeek,
      timesLocal,
      vialId,
      remindMe: remindMe && !isWeb,
      privacyMode,
    };
    const operation = isEditing
      ? appendVersion(editingPlan.id, {
          ...input,
          effectiveFrom: dayKey(new Date().toISOString()),
        })
      : addPlan(input);
    operation
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
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.chromeText}>
          <AppText variant="display">{isEditing ? "Edit plan" : "Schedule"}</AppText>
          <AppText variant="caption" tone="faint">
            {isEditing
              ? "Changes apply to future occurrences only"
              : "Every value is yours — nothing is suggested"}
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
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <AppText
                      variant="label"
                      weight={active ? "semibold" : "medium"}
                      tone={active ? "onSolid" : "secondary"}
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
              Time(s) — HH:mm
            </AppText>
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Field
                  label="Add a time"
                  value={timeDraft}
                  onChangeText={setTimeDraft}
                  placeholder="08:00"
                  testID="input-plan-time"
                />
              </View>
              <Button
                label="Add"
                tone="ghost"
                compact
                onPress={addTime}
                icon={<Plus size={16} color={colors.ink} />}
                testID="add-plan-time"
              />
            </View>
            {timesLocal.length > 0 && (
              <View style={styles.chipsRow}>
                {timesLocal.map((time) => (
                  <Pressable
                    key={time}
                    onPress={() => removeTime(time)}
                    style={styles.chip}
                    testID={`time-chip-${time}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove time ${time}`}
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
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <AppText
                        variant="label"
                        weight={active ? "semibold" : "medium"}
                        tone={active ? "onSolid" : "secondary"}
                      >
                        {vial.name}
                      </AppText>
                      <AppText variant="caption" mono tone={active ? "onSolid" : "faint"}>
                        {fmt(vial.vialMg)} mg
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <Card style={styles.formCard}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <AppText variant="body" weight="medium">
                  Remind me
                </AppText>
                <AppText variant="caption" tone="faint">
                  {isWeb
                    ? "Local notifications are available in the mobile app."
                    : reminderSlots > 0
                      ? `${reminderSlots} weekly alert${reminderSlots === 1 ? "" : "s"} (one per day×time)`
                      : "Add days and times to schedule alerts"}
                </AppText>
              </View>
              <Switch
                value={remindMe && !isWeb}
                disabled={isWeb}
                onValueChange={setRemindMe}
                trackColor={{ true: colors.accent, false: colors.surfaceSunken }}
                thumbColor={colors.surface}
                accessibilityLabel="Remind me"
                accessibilityState={{ checked: remindMe && !isWeb, disabled: isWeb }}
                testID="toggle-plan-remind"
              />
            </View>
            {remindMe && !isWeb ? (
              <>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleText}>
                    <AppText variant="body" weight="medium">
                      Private notifications
                    </AppText>
                    <AppText variant="caption" tone="faint">
                      Hide compound name on the lock screen
                    </AppText>
                  </View>
                  <Switch
                    value={privacyMode}
                    onValueChange={setPrivacyMode}
                    trackColor={{ true: colors.accent, false: colors.surfaceSunken }}
                    thumbColor={colors.surface}
                    accessibilityLabel="Private notifications"
                    accessibilityState={{ checked: privacyMode }}
                    testID="toggle-plan-privacy"
                  />
                </View>
                <AppText variant="caption" tone="secondary" testID="plan-reminder-preview">
                  Preview: “{previewCopy.title}” — {previewCopy.body}
                </AppText>
              </>
            ) : null}
          </Card>

          <Button
            label={saving ? "Saving…" : isEditing ? "Save changes" : "Create plan"}
            tone="primary"
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



function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
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
    backgroundColor: colors.solid,
    borderColor: colors.solid,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  timeField: {
    flex: 1,
  },
  unitToggle: {
    width: 118,
  },
  hint: {
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  toggleText: {
    flex: 1,
    gap: 2,
  },
});
}
