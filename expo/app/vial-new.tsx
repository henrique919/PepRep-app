import { useLocalSearchParams, useRouter } from "expo-router";
import { X } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
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
import { createId } from "@/src/db/models";
import { snapshotsRepository } from "@/src/db/repositories";
import { snapshotFromDraw } from "@/src/db/snapshot";
import type { MassUnit, SyringeCapacity } from "@/src/engine";
import { calculateDraw, fmt, SYRINGES } from "@/src/engine";
import { vialConcentration } from "@/src/engine/inventory";
import { parseNumeric } from "@/src/engine/parse";
import { useVialsStore } from "@/src/store/vials";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

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
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
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
  const [lot, setLot] = useState<string>("");
  const [expiresText, setExpiresText] = useState<string>("");
  const [lowStockText, setLowStockText] = useState<string>("");

  useEffect(() => {
    const compound = stringParam(params.compoundName);
    const vialMgParam = stringParam(params.vialMg);
    const diluentParam = stringParam(params.diluentMl);
    const capacityParam = stringParam(params.syringeCapacity);
    if (compound.length > 0) setName(compound);
    if (vialMgParam.length > 0) setVialText(vialMgParam);
    if (diluentParam.length > 0) setWaterText(diluentParam);
    if (capacityParam.length > 0) setCapacity(capacityFromParam(capacityParam));
  }, [params.compoundName, params.vialMg, params.diluentMl, params.syringeCapacity]);

  const vialMg = parseNumeric(vialText);
  const diluentMl = parseNumeric(waterText);
  const doseValue = parseNumeric(stringParam(params.doseValue));
  const doseUnit: MassUnit = stringParam(params.doseUnit) === "mg" ? "mg" : "mcg";

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
    const reconstitutedAtIso = new Date().toISOString();

    const persist = async () => {
      let snapshotId: string | undefined;
      if (doseValue !== null && doseValue > 0) {
        const drawInput = {
          vialMg,
          diluentMl,
          doseValue,
          doseUnit,
          syringeCapacityUnits: capacity,
        };
        const draw = calculateDraw(drawInput);
        if (draw.ok) {
          const snapshot = snapshotFromDraw(drawInput, draw, createId(), reconstitutedAtIso);
          await snapshotsRepository.append(snapshot);
          snapshotId = snapshot.id;
        }
      }

      const expiresTrimmed = expiresText.trim();
      let expiresAtIso: string | null = null;
      if (expiresTrimmed.length > 0) {
        // Accept yyyy-MM-dd; store noon UTC so the calendar day is stable.
        const parsedExpiry = Date.parse(
          /^\d{4}-\d{2}-\d{2}$/.test(expiresTrimmed)
            ? `${expiresTrimmed}T12:00:00.000Z`
            : expiresTrimmed,
        );
        if (Number.isFinite(parsedExpiry)) {
          expiresAtIso = new Date(parsedExpiry).toISOString();
        }
      }
      const lowStockParsed = parseNumeric(lowStockText);
      const lowStockThresholdPercent =
        lowStockParsed !== null && lowStockParsed >= 0 && lowStockParsed <= 100
          ? lowStockParsed
          : null;

      await addVial({
        name: name.trim(),
        vialMg,
        diluentMl,
        syringeCapacityUnits: capacity,
        note: note.trim(),
        reconstitutedAtIso,
        archivedAtIso: null,
        expiresAtIso,
        lot: lot.trim(),
        lowStockThresholdPercent,
        snapshotId,
      });
    };

    persist()
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
              placeholder="0"
              testID="input-vial-mg"
            />
            <Field
              label="Bacteriostatic water added"
              value={waterText}
              onChangeText={setWaterText}
              suffix="mL"
              placeholder="0"
              testID="input-vial-water"
            />
            <Field
              label="Lot / batch (optional)"
              value={lot}
              onChangeText={setLot}
              mono={false}
              keyboardType="default"
              placeholder="As printed on the vial"
              testID="input-vial-lot"
            />
            <Field
              label="Expiry / BUD (optional)"
              value={expiresText}
              onChangeText={setExpiresText}
              mono
              keyboardType="default"
              placeholder="yyyy-MM-dd"
              hint="your date"
              testID="input-vial-expires"
            />
            <Field
              label="Low-stock at % remaining (optional)"
              value={lowStockText}
              onChangeText={setLowStockText}
              suffix="%"
              placeholder="25"
              hint="default 25"
              testID="input-vial-low-stock"
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
                testID="vial-syringe-capacity"
              />
            </View>
            <Field
              label="Note (optional)"
              value={note}
              onChangeText={setNote}
              mono={false}
              keyboardType="default"
              placeholder="Lot, source, anything you want to remember"
              testID="input-vial-note"
            />
          </Card>

          {concentration !== null && (
            <Card>
              <AppText variant="overline" tone="faint">
                Concentration
              </AppText>
              <AppText variant="title" mono>
                {fmt(concentration.mgPerMl, 3)} mg/mL
              </AppText>
              <AppText variant="caption" tone="faint">
                Derived from the amounts above — not editable.
              </AppText>
            </Card>
          )}

          <Button
            label="Save vial"
            tone="accent"
            onPress={save}
            disabled={!canSave}
            testID="save-vial"
          />
          {!canSave && (
            <AppText variant="caption" tone="faint">
              Enter a label, vial amount, and water volume to save.
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
  });
}
