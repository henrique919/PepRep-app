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

import SitePicker from "@/src/components/domain/SitePicker";
import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import Field from "@/src/components/ui/Field";
import Screen from "@/src/components/ui/Screen";
import SegmentedControl from "@/src/components/ui/SegmentedControl";
import { createId, type InjectionSite } from "@/src/db/models";
import { snapshotsRepository } from "@/src/db/repositories";
import { snapshotFromDraw } from "@/src/db/snapshot";
import type { MassUnit, SyringeCapacity } from "@/src/engine";
import { calculateDraw, fmt, mgToMcg } from "@/src/engine";
import { formatDateTime } from "@/src/engine/schedule";
import { parseNumeric } from "@/src/engine/parse";
import { useDosesStore } from "@/src/store/doses";
import { selectActiveVials, useVialsStore } from "@/src/store/vials";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

function capacityFromParam(value: string): SyringeCapacity {
  if (value === "30" || value === "50" || value === "100") return Number(value) as SyringeCapacity;
  return 100;
}

function stringParam(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") return value[0];
  return "";
}

export default function LogEntryScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const addDose = useDosesStore((state) => state.addDose);
  const doses = useDosesStore((state) => state.doses);
  const vials = useVialsStore(useShallow(selectActiveVials));

  const prefillUnit: MassUnit = stringParam(params.doseUnit) === "mg" ? "mg" : "mcg";
  const prefillVialMg = parseNumeric(stringParam(params.vialMg));
  const prefillDiluentMl = parseNumeric(stringParam(params.diluentMl));
  const prefillCapacity = capacityFromParam(stringParam(params.syringeCapacity));

  const [peptideName, setPeptideName] = useState<string>(stringParam(params.compoundName));
  const [vialId, setVialId] = useState<string | null>(null);
  const [doseText, setDoseText] = useState<string>(stringParam(params.doseValue));
  const [doseUnit, setDoseUnit] = useState<MassUnit>(prefillUnit);
  const [unitsText, setUnitsText] = useState<string>(stringParam(params.units));
  const [site, setSite] = useState<InjectionSite | null>(null);
  const [note, setNote] = useState<string>("");

  const nowIso = useMemo(() => new Date().toISOString(), []);

  const recentSites = useMemo(
    () => doses.filter((dose) => dose.site !== null).map((dose) => dose.site as InjectionSite),
    [doses],
  );

  const doseValue = parseNumeric(doseText);
  const units = parseNumeric(unitsText);
  const volumeMl = parseNumeric(stringParam(params.volumeMl));
  const canSave = doseValue !== null && doseValue > 0 && (peptideName.trim().length > 0 || vialId !== null);

  const selectVial = (id: string) => {
    if (vialId === id) {
      setVialId(null);
      return;
    }
    setVialId(id);
    const vial = vials.find((candidate) => candidate.id === id);
    if (vial !== undefined && peptideName.trim().length === 0) {
      setPeptideName(vial.name);
    }
  };

  const save = () => {
    if (doseValue === null || doseValue <= 0) return;
    const name = peptideName.trim();
    const atIso = new Date().toISOString();

    const persist = async () => {
      let snapshotId: string | undefined;
      if (prefillVialMg !== null && prefillDiluentMl !== null) {
        const drawInput = {
          vialMg: prefillVialMg,
          diluentMl: prefillDiluentMl,
          doseValue,
          doseUnit,
          syringeCapacityUnits: prefillCapacity,
        };
        const draw = calculateDraw(drawInput);
        if (draw.ok) {
          const snapshot = snapshotFromDraw(drawInput, draw, createId(), atIso);
          await snapshotsRepository.append(snapshot);
          snapshotId = snapshot.id;
        }
      }

      await addDose({
        vialId,
        peptideName: name,
        doseValue,
        doseUnit,
        doseMcg: doseUnit === "mg" ? mgToMcg(doseValue) : doseValue,
        units,
        volumeMl,
        site,
        note: note.trim(),
        atIso,
        snapshotId,
      });
    };

    persist()
      .then(() => router.back())
      .catch((error) => console.error("[log-entry] Failed to save dose", error));
  };

  return (
    <Screen topInset={Platform.OS !== "ios"}>
      <View style={styles.chrome}>
        <View style={styles.chromeText}>
          <AppText variant="heading">Log a dose</AppText>
          <AppText variant="caption" mono tone="faint">
            {formatDateTime(nowIso)}
          </AppText>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeButton} testID="close-log-entry">
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
          {vials.length > 0 && (
            <View style={styles.section}>
              <AppText variant="overline" tone="faint">
                From vial (optional — keeps its inventory exact)
              </AppText>
              <View style={styles.chipsRow}>
                {vials.map((vial) => {
                  const active = vialId === vial.id;
                  return (
                    <Pressable
                      key={vial.id}
                      onPress={() => selectVial(vial.id)}
                      style={[styles.chip, active && styles.chipActive]}
                      testID={`vial-chip-${vial.id}`}
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

          <Card style={styles.formCard}>
            <Field
              label="Peptide (your own label)"
              value={peptideName}
              onChangeText={setPeptideName}
              mono={false}
              keyboardType="default"
              placeholder="As written on your vial"
              testID="input-peptide-name"
            />
            <Field
              label="Dose you took"
              value={doseText}
              onChangeText={setDoseText}
              suffix={doseUnit}
              placeholder={doseUnit === "mcg" ? "250" : "0.25"}
              testID="input-log-dose"
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
              label="Units drawn (optional)"
              value={unitsText}
              onChangeText={setUnitsText}
              suffix="units"
              placeholder="10"
              testID="input-log-units"
            />
            <Field
              label="Note (optional)"
              value={note}
              onChangeText={setNote}
              mono={false}
              keyboardType="default"
              placeholder="Anything worth remembering"
              testID="input-log-note"
            />
          </Card>

          <Card style={styles.siteCard}>
            <AppText variant="overline" tone="faint">
              Injection site (optional)
            </AppText>
            <SitePicker value={site} onChange={setSite} recentSites={recentSites} />
          </Card>

          <Button label="Save entry" tone="accent" onPress={save} disabled={!canSave} testID="save-dose" />
          {!canSave && (
            <AppText variant="caption" tone="faint" style={styles.hint}>
              A dose amount and either a peptide label or a vial are needed to keep the record
              meaningful.
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
  chromeText: {
    gap: 2,
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
  formCard: {
    gap: spacing.lg,
  },
  siteCard: {
    gap: spacing.md,
  },
  unitToggle: {
    width: 118,
  },
  hint: {
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});
}
