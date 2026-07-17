import { useRouter } from "expo-router";
import {
  ArrowLeft,
  BellRing,
  ChevronRight,
  FileDown,
  FileJson,
  Info,
  Plus,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import Field from "@/src/components/ui/Field";
import Hairline from "@/src/components/ui/Hairline";
import Screen from "@/src/components/ui/Screen";
import { clearAllData } from "@/src/db/adapter";
import { SITE_LABELS } from "@/src/db/models";
import { fmt } from "@/src/engine";
import { formatNextOccurrence, formatTimeOfDay } from "@/src/engine/schedule";
import { parseNumeric } from "@/src/engine/parse";
import { useDosesStore } from "@/src/store/doses";
import { useRemindersStore } from "@/src/store/reminders";
import { useSettingsStore } from "@/src/store/settings";
import { useVialsStore } from "@/src/store/vials";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

const HOURS: number[] = Array.from({ length: 24 }, (_, index) => index);
const MINUTES: number[] = [0, 15, 30, 45];

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const doses = useDosesStore((state) => state.doses);
  const vials = useVialsStore((state) => state.vials);
  const resetDoses = useDosesStore((state) => state.reset);
  const resetVials = useVialsStore((state) => state.reset);
  const reminders = useRemindersStore((state) => state.reminders);
  const askEnabled = useSettingsStore((state) => state.askEnabled);
  const setAskEnabled = useSettingsStore((state) => state.setAskEnabled);
  const addReminder = useRemindersStore((state) => state.addReminder);
  const setEnabled = useRemindersStore((state) => state.setEnabled);
  const removeReminder = useRemindersStore((state) => state.removeReminder);
  const resetReminders = useRemindersStore((state) => state.reset);

  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [label, setLabel] = useState<string>("");
  const [hourText, setHourText] = useState<string>("8");
  const [minute, setMinute] = useState<number>(0);
  const [eraseArmed, setEraseArmed] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const disarmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (disarmTimer.current !== null) clearTimeout(disarmTimer.current);
    };
  }, []);

  const nowIso = new Date().toISOString();
  const isWeb = Platform.OS === "web";

  const parsedHour = parseNumeric(hourText);
  const hourValid =
    parsedHour !== null && Number.isInteger(parsedHour) && HOURS.includes(parsedHour);
  const canAddReminder = label.trim().length > 0 && hourValid;

  const saveReminder = () => {
    if (!canAddReminder || parsedHour === null) return;
    addReminder({ label: label.trim(), hour: parsedHour, minute })
      .then(() => {
        setShowEditor(false);
        setLabel("");
        setHourText("8");
        setMinute(0);
      })
      .catch((error) => console.error("[settings] Failed to add reminder", error));
  };

  const shareFile = async (fileName: string, contents: string, mimeType: string) => {
    if (isWeb) {
      setStatusMessage("Export is available in the mobile app.");
      return;
    }
    try {
      const directory = FileSystem.cacheDirectory ?? "";
      const uri = `${directory}${fileName}`;
      await FileSystem.writeAsStringAsync(uri, contents);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType });
        setStatusMessage(null);
      } else {
        setStatusMessage(`Saved to app storage as ${fileName}.`);
      }
    } catch (error) {
      console.error("[settings] Export failed", error);
      setStatusMessage("Export failed — please try again.");
    }
  };

  const exportCsv = () => {
    const header = "date,peptide,dose_value,dose_unit,dose_mcg,units_drawn,volume_ml,site,vial,note";
    const vialName = (vialId: string | null): string => {
      if (vialId === null) return "";
      const vial = vials.find((candidate) => candidate.id === vialId);
      return vial !== undefined ? vial.name : "";
    };
    const rows = doses.map((dose) =>
      [
        dose.atIso,
        csvEscape(dose.peptideName),
        fmt(dose.doseValue, 6),
        dose.doseUnit,
        fmt(dose.doseMcg, 3),
        dose.units !== null ? fmt(dose.units, 2) : "",
        dose.volumeMl !== null ? fmt(dose.volumeMl, 4) : "",
        dose.site !== null ? SITE_LABELS[dose.site] : "",
        csvEscape(vialName(dose.vialId)),
        csvEscape(dose.note),
      ].join(","),
    );
    const stamp = nowIso.slice(0, 10);
    shareFile(`peprep-log-${stamp}.csv`, [header, ...rows].join("\n"), "text/csv").catch(
      (error) => console.error("[settings] CSV export failed", error),
    );
  };

  const exportJson = () => {
    const payload = JSON.stringify({ exportedAtIso: nowIso, vials, doses }, null, 2);
    const stamp = nowIso.slice(0, 10);
    shareFile(`peprep-data-${stamp}.json`, payload, "application/json").catch((error) =>
      console.error("[settings] JSON export failed", error),
    );
  };

  const handleErasePress = () => {
    if (!eraseArmed) {
      setEraseArmed(true);
      if (disarmTimer.current !== null) clearTimeout(disarmTimer.current);
      disarmTimer.current = setTimeout(() => setEraseArmed(false), 4000);
      return;
    }
    setEraseArmed(false);
    Promise.all([clearAllData(), resetReminders()])
      .then(() => {
        resetDoses();
        resetVials();
        setStatusMessage("All data erased from this device.");
      })
      .catch((error) => console.error("[settings] Erase failed", error));
  };

  return (
    <Screen>
      <View style={styles.chrome}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backButton}
          testID="close-settings"
        >
          <ArrowLeft size={18} color={colors.ink} />
        </Pressable>
        <AppText variant="heading">Settings</AppText>
        <View style={styles.chromeSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Reminders */}
        <View style={styles.section}>
          <AppText variant="overline" tone="faint" style={styles.sectionLabel}>
            Reminders — you define every one
          </AppText>
          <Card padded={false}>
            {isWeb && (
              <View style={styles.rowPadded}>
                <AppText variant="label" tone="secondary">
                  Reminders use local notifications and are available in the mobile app.
                </AppText>
              </View>
            )}
            {!isWeb && reminders.length === 0 && !showEditor && (
              <View style={styles.rowPadded}>
                <AppText variant="label" tone="secondary">
                  No reminders yet. PepRep never proposes a schedule — create your own if you want
                  one.
                </AppText>
              </View>
            )}
            {!isWeb &&
              reminders.map((reminder, index) => (
                <View key={reminder.id}>
                  {index > 0 && <Hairline />}
                  <View style={styles.reminderRow}>
                    <BellRing size={17} color={reminder.enabled ? colors.accent : colors.inkFaint} />
                    <View style={styles.reminderBody}>
                      <AppText variant="body" weight="medium" numberOfLines={1}>
                        {reminder.label}
                      </AppText>
                      <AppText variant="caption" mono tone="faint">
                        {formatTimeOfDay({ hour: reminder.hour, minute: reminder.minute })} daily
                        {reminder.enabled
                          ? ` · next ${formatNextOccurrence({ hour: reminder.hour, minute: reminder.minute }, nowIso)}`
                          : " · off"}
                      </AppText>
                    </View>
                    <Switch
                      value={reminder.enabled}
                      onValueChange={(next) => {
                        setEnabled(reminder.id, next).catch((error) =>
                          console.error("[settings] Toggle reminder failed", error),
                        );
                      }}
                      trackColor={{ true: colors.accent, false: colors.surfaceSunken }}
                      thumbColor={colors.surface}
                    />
                    <Pressable
                      onPress={() => {
                        removeReminder(reminder.id).catch((error) =>
                          console.error("[settings] Remove reminder failed", error),
                        );
                      }}
                      hitSlop={10}
                      style={styles.iconButton}
                      testID={`remove-reminder-${reminder.id}`}
                    >
                      <X size={15} color={colors.inkFaint} />
                    </Pressable>
                  </View>
                </View>
              ))}

            {!isWeb && showEditor && (
              <View>
                <Hairline />
                <View style={styles.editor}>
                  <Field
                    label="Reminder label"
                    value={label}
                    onChangeText={setLabel}
                    mono={false}
                    keyboardType="default"
                    placeholder="Your own wording"
                    testID="input-reminder-label"
                  />
                  <View style={styles.timeRow}>
                    <View style={styles.hourField}>
                      <Field
                        label="Hour (0–23)"
                        value={hourText}
                        onChangeText={setHourText}
                        suffix="h"
                        placeholder="8"
                        keyboardType="number-pad"
                        testID="input-reminder-hour"
                      />
                    </View>
                    <View style={styles.minuteChips}>
                      <AppText variant="overline" tone="faint">
                        Minute
                      </AppText>
                      <View style={styles.chipRow}>
                        {MINUTES.map((candidate) => {
                          const active = minute === candidate;
                          return (
                            <Pressable
                              key={candidate}
                              onPress={() => setMinute(candidate)}
                              style={[styles.minuteChip, active && styles.minuteChipActive]}
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
                  <View style={styles.editorButtons}>
                    <Button label="Cancel" tone="ghost" compact onPress={() => setShowEditor(false)} />
                    <Button
                      label="Save reminder"
                      tone="accent"
                      compact
                      onPress={saveReminder}
                      disabled={!canAddReminder}
                      testID="save-reminder"
                    />
                  </View>
                </View>
              </View>
            )}

            {!isWeb && !showEditor && (
              <View>
                {reminders.length > 0 && <Hairline />}
                <Pressable onPress={() => setShowEditor(true)} style={styles.addRow} testID="add-reminder">
                  <Plus size={16} color={colors.accent} />
                  <AppText variant="label" weight="semibold" tone="accent">
                    Add a reminder
                  </AppText>
                </Pressable>
              </View>
            )}
          </Card>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <AppText variant="overline" tone="faint" style={styles.sectionLabel}>
            Your data — local only, yours only
          </AppText>
          <Card padded={false}>
            <Pressable onPress={exportCsv} style={styles.actionRow} testID="export-csv">
              <FileDown size={18} color={colors.ink} />
              <View style={styles.actionBody}>
                <AppText variant="body" weight="medium">
                  Export dose log (CSV)
                </AppText>
                <AppText variant="caption" tone="faint">
                  {doses.length} {doses.length === 1 ? "entry" : "entries"}
                </AppText>
              </View>
              <ChevronRight size={16} color={colors.inkFaint} />
            </Pressable>
            <Hairline />
            <Pressable onPress={exportJson} style={styles.actionRow} testID="export-json">
              <FileJson size={18} color={colors.ink} />
              <View style={styles.actionBody}>
                <AppText variant="body" weight="medium">
                  Export everything (JSON)
                </AppText>
                <AppText variant="caption" tone="faint">
                  Vials and dose log, machine-readable
                </AppText>
              </View>
              <ChevronRight size={16} color={colors.inkFaint} />
            </Pressable>
            <Hairline />
            <Pressable onPress={handleErasePress} style={styles.actionRow} testID="erase-data">
              <Trash2 size={18} color={colors.dangerInk} />
              <View style={styles.actionBody}>
                <AppText variant="body" weight="medium" tone="danger">
                  {eraseArmed ? "Tap again to erase everything" : "Erase all data"}
                </AppText>
                <AppText variant="caption" tone="faint">
                  {eraseArmed ? "This cannot be undone" : "Removes every record from this device"}
                </AppText>
              </View>
            </Pressable>
          </Card>
          {statusMessage !== null && (
            <AppText variant="caption" tone="secondary" style={styles.status}>
              {statusMessage}
            </AppText>
          )}
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <AppText variant="overline" tone="faint">
            Privacy
          </AppText>
          <Card style={styles.privacyCard} padded={false}>
            <View style={styles.privacyCopy}>
              <AppText variant="label" tone="secondary">
                Your vials, doses, schedule and history never leave this device. There is no account
                and no analytics. The one exception is Ask: your question text is sent to Rork AI
                Cloud to generate an answer. Your records are never included. You can turn Ask off
                below.
              </AppText>
            </View>
            <Hairline />
            <View style={styles.askToggleRow}>
              <View style={styles.actionBody}>
                <AppText variant="body" weight="medium">
                  Ask
                </AppText>
                <AppText variant="caption" tone="faint">
                  {askEnabled
                    ? "On — question text may leave this device"
                    : "Off — no Ask network calls"}
                </AppText>
              </View>
              <Switch
                value={askEnabled}
                onValueChange={(next) => {
                  setAskEnabled(next).catch((error) =>
                    console.error("[settings] Toggle Ask failed", error),
                  );
                }}
                trackColor={{ true: colors.accent, false: colors.surfaceSunken }}
                thumbColor={colors.surface}
                testID="toggle-ask"
              />
            </View>
          </Card>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Card padded={false}>
            <Pressable onPress={() => router.push("/about")} style={styles.actionRow} testID="open-about">
              <Info size={18} color={colors.ink} />
              <View style={styles.actionBody}>
                <AppText variant="body" weight="medium">
                  About PepRep
                </AppText>
              </View>
              <ChevronRight size={16} color={colors.inkFaint} />
            </Pressable>
          </Card>
        </View>

        <AppText variant="caption" tone="faint" style={styles.footer}>
          PepRep 1.0.0 · No account · No analytics · Ask is optional
        </AppText>
      </ScrollView>
    </Screen>
  );
}



function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
  chrome: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
  },
  chromeSpacer: {
    width: 36,
    height: 36,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    paddingHorizontal: spacing.xs,
  },
  rowPadded: {
    padding: spacing.lg,
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  reminderBody: {
    flex: 1,
    gap: 2,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  editor: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  timeRow: {
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
  chipRow: {
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
  editorButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: 50,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 60,
  },
  actionBody: {
    flex: 1,
    gap: 2,
  },
  privacyCard: {
    overflow: "hidden",
  },
  privacyCopy: {
    padding: spacing.lg,
  },
  askToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  status: {
    paddingHorizontal: spacing.xs,
  },
  footer: {
    textAlign: "center",
  },
});
}
