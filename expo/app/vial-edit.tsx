import { useLocalSearchParams, useRouter } from "expo-router";
import { TestTubes, X } from "lucide-react-native";
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
import EmptyState from "@/src/components/ui/EmptyState";
import Field from "@/src/components/ui/Field";
import Screen from "@/src/components/ui/Screen";
import SegmentedControl from "@/src/components/ui/SegmentedControl";
import type { SyringeCapacity } from "@/src/engine";
import { parseNumeric } from "@/src/engine/parse";
import { SYRINGES } from "@/src/engine";
import { useVialsStore } from "@/src/store/vials";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

function stringParam(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) return value[0] ?? "";
  return "";
}

export default function EditVialScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const vialId = stringParam(params.vialId);
  const vial = useVialsStore((state) => state.vials.find((item) => item.id === vialId));
  const updateVial = useVialsStore((state) => state.updateVial);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState(vial?.name ?? "");
  const [lot, setLot] = useState(vial?.lot ?? "");
  const [expiresText, setExpiresText] = useState(vial?.expiresAtIso?.slice(0, 10) ?? "");
  const [lowStockText, setLowStockText] = useState(
    vial?.lowStockThresholdPercent == null ? "" : String(vial.lowStockThresholdPercent),
  );
  const [capacity, setCapacity] = useState<SyringeCapacity>(vial?.syringeCapacityUnits ?? 50);
  const [note, setNote] = useState(vial?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  if (vial === undefined) {
    return (
      <Screen>
        <EmptyState
          icon={<TestTubes size={28} color={colors.inkFaint} />}
          title="Vial not found"
          caption="It may have been removed."
          action={<Button label="Back" onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  const save = () => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      setError("Enter a label for this vial.");
      return;
    }

    const trimmedExpiry = expiresText.trim();
    let expiresAtIso: string | null = null;
    if (trimmedExpiry.length > 0) {
      const parsed = Date.parse(
        /^\d{4}-\d{2}-\d{2}$/.test(trimmedExpiry)
          ? `${trimmedExpiry}T12:00:00.000Z`
          : trimmedExpiry,
      );
      if (!Number.isFinite(parsed)) {
        setError("Enter the expiry or BUD as yyyy-MM-dd.");
        return;
      }
      expiresAtIso = new Date(parsed).toISOString();
    }

    const lowStock = lowStockText.trim().length === 0 ? null : parseNumeric(lowStockText);
    if (lowStock !== null && (lowStock < 0 || lowStock > 100)) {
      setError("Low-stock percentage must be between 0 and 100.");
      return;
    }

    setError(undefined);
    setSaving(true);
    updateVial(vial.id, {
      name: trimmedName,
      lot: lot.trim(),
      expiresAtIso,
      lowStockThresholdPercent: lowStock,
      syringeCapacityUnits: capacity,
      note: note.trim(),
    })
      .then(() => router.back())
      .catch((cause) => {
        console.error("[vial-edit] Failed to update vial", cause);
        setError("Could not save the changes. Try again.");
        setSaving(false);
      });
  };

  return (
    <Screen>
      <View style={styles.chrome}>
        <AppText variant="heading">Edit vial details</AppText>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X size={18} color={colors.ink} />
        </Pressable>
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.formCard}>
            <Field
              label="Label"
              value={name}
              onChangeText={setName}
              mono={false}
              keyboardType="default"
              error={error?.includes("label") ? error : undefined}
              testID="edit-vial-name"
            />
            <Field
              label="Lot / batch (optional)"
              value={lot}
              onChangeText={setLot}
              mono={false}
              keyboardType="default"
              testID="edit-vial-lot"
            />
            <Field
              label="Expiry / BUD (optional)"
              value={expiresText}
              onChangeText={setExpiresText}
              mono
              keyboardType="default"
              placeholder="yyyy-MM-dd"
              testID="edit-vial-expires"
            />
            <Field
              label="Low-stock at % remaining (optional)"
              value={lowStockText}
              onChangeText={setLowStockText}
              suffix="%"
              placeholder="25"
              testID="edit-vial-low-stock"
            />
            <View style={styles.capacityBlock}>
              <AppText variant="overline" tone="secondary">
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
              testID="edit-vial-note"
            />
          </Card>
          {error !== undefined && !error.includes("label") ? (
            <AppText variant="caption" tone="danger" accessibilityRole="alert">
              {error}
            </AppText>
          ) : null}
          <AppText variant="caption" tone="faint">
            Vial amount and water are locked because changing them would rewrite the inventory ledger. Archive this vial and create a corrected one if those values are wrong.
          </AppText>
          <Button
            label={saving ? "Saving…" : "Save changes"}
            tone="accent"
            onPress={save}
            disabled={saving}
            testID="save-vial-edits"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    flex: { flex: 1 },
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
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSunken,
      alignItems: "center",
      justifyContent: "center",
    },
    content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
    formCard: { gap: spacing.lg },
    capacityBlock: { gap: spacing.sm },
  });
}
