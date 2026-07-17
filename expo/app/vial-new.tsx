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

import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import Field from "@/src/components/ui/Field";
import Screen from "@/src/components/ui/Screen";
import SegmentedControl from "@/src/components/ui/SegmentedControl";
import type { SyringeCapacity } from "@/src/engine";
import { fmt, SYRINGES } from "@/src/engine";
import { vialConcentration } from "@/src/engine/inventory";
import { parseNumeric } from "@/src/engine/parse";
import { useVialsStore } from "@/src/store/vials";
import { colors, hairlineWidth, radius, spacing } from "@/src/theme/tokens";

function stringParam(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") return value[0];
  return "";
}

function capacityFromParam(value: string): SyringeCapacity {
  if (value === "30" || value === "50" || value === "100") return Number(value) as SyringeCapacity;
  return 100;
}

export default function NewVialScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const addVial = useVialsStore((state) => state.addVial);

  const [name, setName] = useState<string>(stringParam(params.compoundName));
  const [vialText, setVialText] = useState<string>(stringParam(params.vialMg));
  const [waterText, setWaterText] = useState<string>(stringParam(params.diluentMl));
  const [capacity, setCapacity] = useState<SyringeCapacity>(
    capacityFromParam(stringParam(params.syringeCapacity)),
  );
  const [note, setNote] = useState<string>("");

  const vialMg = parseNumeric(vialText);
  const diluentMl = parseNumeric(waterText);

  const concentration = useMemo(
    () => (vialMg !== null && diluentMl !== null ? vialConcentration(vialMg, diluentMl) : null),
    [vialMg, diluentMl],
  );

  const canSave =
    name.trim().length > 0 &&
    vialMg !== null &&
    vialMg > 0 &&
    diluentMl !== null &&
    diluentMl > 0;

  const save = () => {
    if (!canSave || vialMg === null || diluentMl === null) return;
    addVial({
      name: name.trim(),
      vialMg,
      diluentMl,
      syringeCapacityUnits: capacity,
      note: note.trim(),
      reconstitutedAtIso: new Date().toISOString(),
      archivedAtIso: null,
    })
      .then(() => router.back())
      .catch((error) => console.error("[vial-new] Failed to save vial", error));
  };

  return (
    <Screen topInset={Platform.OS !== "ios"}>
      <View style={styles.chrome}>
        <AppText variant="heading">New vial</AppText>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeButton} testID="close-vial-new">
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
            <Field
              label="Label (as written on your vial)"
              value={name}
              onChangeText={setName}
              mono={false}
              keyboardType="default"
              placeholder="Your own label"
              testID="input-vial-name"
            />
            <Field
              label="Peptide in vial"
              value={vialText}
              onChangeText={setVialText}
              suffix="mg"
              placeholder="5"
              testID="input-vial-mg"
            />
            <Field
              label="Bacteriostatic water added"
              value={waterText}
              onChangeText={setWaterText}
              suffix="mL"
              placeholder="2"
              testID="input-vial-water"
            />
            <View style={styles.syringeRow}>
              <AppText variant="overline" tone="faint">
                Syringe you usually draw with
              </AppText>
              <SegmentedControl<SyringeCapacity>
                options={SYRINGES.map((spec) => ({ value: spec.capacityUnits, label: spec.label }))}
                value={capacity}
                onChange={setCapacity}
                mono
              />
            </View>
            <Field
              label="Note (optional)"
              value={note}
              onChangeText={setNote}
              mono={false}
              keyboardType="default"
              placeholder="Batch, storage, anything useful"
              testID="input-vial-note"
            />
          </Card>

          {concentration !== null && (
            <Card dark style={styles.previewCard}>
              <AppText variant="overline" tone="onDarkSecondary">
                Resulting concentration
              </AppText>
              <AppText mono weight="semibold" tone="accent" style={styles.previewNumber}>
                {fmt(concentration.mgPerMl, 3)} mg/mL
              </AppText>
              <AppText variant="label" mono tone="onDarkSecondary">
                = {fmt(concentration.mcgPerMl)} mcg/mL
              </AppText>
            </Card>
          )}

          <Button label="Save vial" tone="accent" onPress={save} disabled={!canSave} testID="save-vial" />
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
  syringeRow: {
    gap: spacing.xs + 2,
  },
  previewCard: {
    gap: spacing.xs,
  },
  previewNumber: {
    fontSize: 30,
    lineHeight: 36,
  },
});
