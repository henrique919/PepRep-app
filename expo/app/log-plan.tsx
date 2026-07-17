import { useLocalSearchParams, useRouter } from "expo-router";
import { X } from "lucide-react-native";
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
import { formatDateTime } from "@/src/engine/schedule";
import { parseNumeric } from "@/src/engine/parse";
import { useLedgerStore } from "@/src/store/ledger";
import { selectActiveVials, useVialsStore } from "@/src/store/vials";
import { colors, hairlineWidth, radius, spacing } from "@/src/theme/tokens";

function stringParam(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") return value[0];
  return "";
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Combine a dayKey + HH:mm into an ISO timestamp in local time. */
function occurredAtFromLocal(day: string, timeLocal: string): string {
  const [hours, minutes] = timeLocal.split(":").map((part) => Number(part));
  const date = new Date(`${day}T00:00:00`);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export default function LogPlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const logOccurrence = useLedgerStore((state) => state.logOccurrence);
  const vials = useVialsStore(useShallow(selectActiveVials));

  const planId = stringParam(params.planId);
  const scheduleVersionId = stringParam(params.scheduleVersionId);
  const occurrenceKeyParam = stringParam(params.occurrenceKey);
  const compoundName = stringParam(params.compoundName);
  const planName = stringParam(params.planName);
  const prefillUnit: MassUnit = stringParam(params.doseUnit) === "mg" ? "mg" : "mcg";
  const prefillVialId = stringParam(params.vialId);
  const dayFromKey = occurrenceKeyParam.split("|")[0] ?? "";

  const [doseText, setDoseText] = useState<string>(stringParam(params.doseValue));
  const [doseUnit, setDoseUnit] = useState<MassUnit>(prefillUnit);
  const [timeLocal, setTimeLocal] = useState<string>(stringParam(params.timeLocal));
  const [vialId, setVialId] = useState<string | undefined>(
    prefillVialId.length > 0 ? prefillVialId : undefined,
  );
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const nowIso = useMemo(() => new Date().toISOString(), []);
  const doseValue = parseNumeric(doseText);
  const timeOk = TIME_PATTERN.test(timeLocal.trim());
  const canSave =
    planId.length > 0 &&
    scheduleVersionId.length > 0 &&
    occurrenceKeyParam.length > 0 &&
    compoundName.length > 0 &&
    doseValue !== null &&
    doseValue > 0 &&
    timeOk &&
    !saving;

  const save = () => {
    if (!canSave || doseValue === null) return;
    const vial = vialId !== undefined ? vials.find((candidate) => candidate.id === vialId) : undefined;
    setSaving(true);
    logOccurrence({
      planId,
      scheduleVersionId,
      occurrenceKey: occurrenceKeyParam,
      compoundName,
      doseValue,
      doseUnit,
      vialId,
      vial,
      note,
      occurredAt: dayFromKey.length > 0 ? occurredAtFromLocal(dayFromKey, timeLocal.trim()) : undefined,
    })
      .then(() => router.back())
      .catch((error) => {
        console.error("[log-plan] Failed to log", error);
        setSaving(false);
      });
  };

  return (
    <Screen topInset={Platform.OS !== "ios"}>
      <View style={styles.chrome}>
        <View style={styles.chromeText}>
          <AppText variant="heading">Log dose</AppText>
          <AppText variant="caption" mono tone="faint">
            {planName.length > 0 ? planName : compoundName} · {formatDateTime(nowIso)}
          </AppText>
        </View>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.closeButton}
          testID="close-log-plan"
        >
          <X size={18} color={colors.ink} />
        </Pressable>
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
            <AppText variant="label" tone="secondary">
              {compoundName}
            </AppText>
            <Field
              label="Dose"
              value={doseText}
              onChangeText={setDoseText}
              suffix={doseUnit}
              placeholder=""
              testID="input-log-plan-dose"
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
            <Field
              label="Time (HH:mm)"
              value={timeLocal}
              onChangeText={setTimeLocal}
              placeholder="08:00"
              testID="input-log-plan-time"
            />
            <Field
              label="Note (optional)"
              value={note}
              onChangeText={setNote}
              mono={false}
              keyboardType="default"
              placeholder="Anything worth remembering"
              testID="input-log-plan-note"
            />
          </Card>

          {vials.length > 0 && (
            <View style={styles.section}>
              <AppText variant="overline" tone="faint">
                Vial — one dose debits one vial only
              </AppText>
              <View style={styles.chipsRow}>
                {vials.map((vial) => {
                  const active = vialId === vial.id;
                  return (
                    <Pressable
                      key={vial.id}
                      onPress={() => setVialId(active ? undefined : vial.id)}
                      style={[styles.chip, active && styles.chipActive]}
                      testID={`log-plan-vial-${vial.id}`}
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
            label="Confirm log"
            tone="accent"
            onPress={save}
            disabled={!canSave}
            testID="confirm-log-plan"
          />
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
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  chromeText: {
    gap: 2,
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
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
  unitToggle: {
    width: 118,
  },
});
