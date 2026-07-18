import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  ArrowLeft,
  BellRing,
  ChevronRight,
  FileDown,
  FileJson,
  Info,
  KeyRound,
  Plus,
  Trash2,
  X,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";

import { ASK_V1_ENABLED } from "@/src/ask/feature";
import {
  buildBackupPayload,
  createEncryptedBackup,
  decryptAndValidateBackup,
  encryptedBackupFileName,
  serializeBackupFile,
} from "@/src/backup/codec";
import { applyBackupPayload } from "@/src/backup/restore";
import type { BackupValidationOk } from "@/src/backup/types";
import { isCloudBackupConfigured } from "@/src/cloudBackup/config";
import CloudBackupPanel from "@/src/components/domain/CloudBackupPanel";
import AppText from "@/src/components/ui/AppText";
import AskConsentCard from "@/src/components/ui/AskConsentCard";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import Field from "@/src/components/ui/Field";
import Hairline from "@/src/components/ui/Hairline";
import Screen from "@/src/components/ui/Screen";
import { clearAllData } from "@/src/db/adapter";
import { SITE_LABELS } from "@/src/db/models";
import { fmt } from "@/src/engine";
import { parseNumeric } from "@/src/engine/parse";
import { formatNextOccurrence, formatTimeOfDay } from "@/src/engine/schedule";
import { EXPORT_PLAINTEXT_WARNING, exportFileName } from "@/src/export/filenames";
import { useDosesStore } from "@/src/store/doses";
import { useLedgerStore } from "@/src/store/ledger";
import { usePlansStore } from "@/src/store/plans";
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
  const hydrateVials = useVialsStore((state) => state.hydrate);
  const hydrateDoses = useDosesStore((state) => state.hydrate);
  const reminders = useRemindersStore((state) => state.reminders);
  const hydrateReminders = useRemindersStore((state) => state.hydrate);
  const events = useLedgerStore((state) => state.events);
  const txns = useLedgerStore((state) => state.txns);
  const hydrateLedger = useLedgerStore((state) => state.hydrate);
  const plans = usePlansStore((state) => state.plans);
  const hydratePlans = usePlansStore((state) => state.hydrate);
  const askEnabled = useSettingsStore((state) => state.askEnabled);
  const setAskEnabled = useSettingsStore((state) => state.setAskEnabled);
  const acceptAskConsent = useSettingsStore((state) => state.acceptAskConsent);
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
  const [showAskConsent, setShowAskConsent] = useState<boolean>(false);
  const [askConsentBusy, setAskConsentBusy] = useState<boolean>(false);
  const [pendingExport, setPendingExport] = useState<"csv" | "json" | null>(null);
  const [backupPassword, setBackupPassword] = useState<string>("");
  const [backupPasswordConfirm, setBackupPasswordConfirm] = useState<string>("");
  const [backupBusy, setBackupBusy] = useState<boolean>(false);
  const [restorePassword, setRestorePassword] = useState<string>("");
  const [restorePreview, setRestorePreview] = useState<BackupValidationOk | null>(null);
  const [restoreArmed, setRestoreArmed] = useState<boolean>(false);
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
    const directory = FileSystem.cacheDirectory;
    if (directory === null || directory.length === 0) {
      throw new Error("No writable cache directory on this device.");
    }
    const uri = `${directory}${fileName}`;
    await FileSystem.writeAsStringAsync(uri, contents, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      setStatusMessage(`Saved to app storage as ${fileName}.`);
      return;
    }
    try {
      await Sharing.shareAsync(uri, { mimeType, dialogTitle: fileName });
      setStatusMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Dismissing the iOS share sheet is not a failure.
      if (/cancel|dismiss|abort/i.test(message)) {
        setStatusMessage(`Backup file ready (${fileName}). Share was dismissed.`);
        return;
      }
      throw error;
    }
  };

  const runExportCsv = () => {
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
    const fileName = exportFileName("doses-csv", stamp);
    shareFile(fileName, [header, ...rows].join("\n"), "text/csv").catch((error) =>
      console.error("[settings] CSV export failed", error),
    );
  };

  const runExportJson = () => {
    const payload = JSON.stringify({ exportedAtIso: nowIso, vials, doses }, null, 2);
    const stamp = nowIso.slice(0, 10);
    const fileName = exportFileName("data-json", stamp);
    shareFile(fileName, payload, "application/json").catch((error) =>
      console.error("[settings] JSON export failed", error),
    );
  };

  const confirmPendingExport = () => {
    const kind = pendingExport;
    setPendingExport(null);
    if (kind === "csv") runExportCsv();
    else if (kind === "json") runExportJson();
  };

  const canCreateBackup =
    backupPassword.length >= 8 && backupPassword === backupPasswordConfirm && !backupBusy;

  const createEncryptedBackupFile = () => {
    if (!canCreateBackup || isWeb) return;
    setBackupBusy(true);
    try {
      const payload = buildBackupPayload({
        vials,
        doses,
        doseEvents: events,
        inventoryTxns: txns,
        plans,
        reminders,
        exportedAtIso: nowIso,
      });
      const file = createEncryptedBackup(payload, backupPassword);
      const fileName = encryptedBackupFileName(nowIso.slice(0, 10));
      shareFile(fileName, serializeBackupFile(file), "application/json")
        .then(() => {
          setStatusMessage((current) =>
            current === null || current.length === 0
              ? "Encrypted backup ready to save to Files / Drive."
              : current,
          );
          setBackupPassword("");
          setBackupPasswordConfirm("");
        })
        .catch((error) => {
          console.error("[settings] Encrypted backup failed", error);
          setStatusMessage(
            error instanceof Error
              ? `Encrypted backup failed: ${error.message}`
              : "Could not create encrypted backup.",
          );
        })
        .finally(() => setBackupBusy(false));
    } catch (error) {
      console.error("[settings] Encrypted backup failed", error);
      setStatusMessage(
        error instanceof Error
          ? `Encrypted backup failed: ${error.message}`
          : "Could not create encrypted backup.",
      );
      setBackupBusy(false);
    }
  };

  const pickRestoreFile = () => {
    if (isWeb || restorePassword.length === 0) return;
    DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    })
      .then(async (result) => {
        if (result.canceled || result.assets.length === 0) return;
        const asset = result.assets[0];
        if (asset === undefined) return;
        const raw = await FileSystem.readAsStringAsync(asset.uri);
        const validated = decryptAndValidateBackup(raw, restorePassword);
        if (!validated.ok) {
          setRestorePreview(null);
          setRestoreArmed(false);
          setStatusMessage(validated.message);
          return;
        }
        setRestorePreview(validated);
        setRestoreArmed(false);
        setStatusMessage(null);
      })
      .catch((error) => {
        console.error("[settings] Restore pick failed", error);
        setStatusMessage("Could not open that backup file.");
      });
  };

  const confirmRestore = () => {
    if (restorePreview === null) return;
    if (!restoreArmed) {
      setRestoreArmed(true);
      return;
    }
    setBackupBusy(true);
    applyBackupPayload(restorePreview.plaintext)
      .then(() =>
        Promise.all([
          hydrateVials(),
          hydrateDoses(),
          hydrateLedger(),
          hydratePlans(),
          hydrateReminders(),
        ]),
      )
      .then(() => {
        setStatusMessage("Backup restored onto this device.");
        setRestorePreview(null);
        setRestoreArmed(false);
        setRestorePassword("");
      })
      .catch((error) => {
        console.error("[settings] Restore apply failed", error);
        setStatusMessage("Restore failed — existing data was not cleared mid-write.");
      })
      .finally(() => setBackupBusy(false));
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
          accessibilityRole="button"
          accessibilityLabel="Go back"
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
                      accessibilityLabel={`${reminder.label} reminder`}
                      accessibilityState={{ checked: reminder.enabled }}
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
                      accessibilityRole="button"
                      accessibilityLabel={`Remove reminder ${reminder.label}`}
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
                              accessibilityRole="button"
                              accessibilityState={{ selected: active }}
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
                <Pressable
                  onPress={() => setShowEditor(true)}
                  style={styles.addRow}
                  testID="add-reminder"
                  accessibilityRole="button"
                >
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
            <Pressable
              onPress={() => setPendingExport("csv")}
              style={styles.actionRow}
              testID="export-csv"
              accessibilityRole="button"
            >
              <FileDown size={18} color={colors.ink} />
              <View style={styles.actionBody}>
                <AppText variant="body" weight="medium">
                  Export dose log (CSV)
                </AppText>
                <AppText variant="caption" tone="faint">
                  {doses.length} {doses.length === 1 ? "entry" : "entries"} · unencrypted
                </AppText>
              </View>
              <ChevronRight size={16} color={colors.inkFaint} />
            </Pressable>
            <Hairline />
            <Pressable
              onPress={() => setPendingExport("json")}
              style={styles.actionRow}
              testID="export-json"
              accessibilityRole="button"
            >
              <FileJson size={18} color={colors.ink} />
              <View style={styles.actionBody}>
                <AppText variant="body" weight="medium">
                  Export everything (JSON)
                </AppText>
                <AppText variant="caption" tone="faint">
                  Vials and dose log · unencrypted
                </AppText>
              </View>
              <ChevronRight size={16} color={colors.inkFaint} />
            </Pressable>
            <Hairline />
            <Pressable
              onPress={handleErasePress}
              style={styles.actionRow}
              testID="erase-data"
              accessibilityRole="button"
            >
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
          {pendingExport !== null ? (
            <Card style={styles.exportWarnCard} testID="export-warning">
              <AppText variant="heading">Before you export</AppText>
              <AppText variant="label" tone="secondary">
                {EXPORT_PLAINTEXT_WARNING}
              </AppText>
              <AppText variant="caption" tone="faint">
                Filename will be{" "}
                {exportFileName(
                  pendingExport === "csv" ? "doses-csv" : "data-json",
                  nowIso.slice(0, 10),
                )}{" "}
                (no personal labels in the name). Prefer an encrypted backup below for off-device
                copies.
              </AppText>
              <Button
                label="I understand — export"
                tone="primary"
                onPress={confirmPendingExport}
                testID="export-confirm"
              />
              <Button
                label="Cancel"
                tone="ghost"
                onPress={() => setPendingExport(null)}
                testID="export-cancel"
              />
            </Card>
          ) : null}
          <Card style={styles.exportWarnCard} testID="encrypted-backup-card">
            <AppText variant="heading">Encrypted backup (local file)</AppText>
            <AppText variant="label" tone="secondary">
              Password-protect a full copy, then save it to Files, iCloud Drive, or similar. No
              email or account — only a password you choose. This path does not upload to PepRep.
              You will need the password to restore.
            </AppText>
            {isWeb ? (
              <AppText variant="caption" tone="faint">
                Encrypted backup and restore are available in the mobile app.
              </AppText>
            ) : (
              <>
                <Field
                  label="Backup password"
                  value={backupPassword}
                  onChangeText={setBackupPassword}
                  mono={false}
                  keyboardType="default"
                  secureTextEntry
                  placeholder="At least 8 characters"
                  testID="backup-password"
                />
                <Field
                  label="Confirm password"
                  value={backupPasswordConfirm}
                  onChangeText={setBackupPasswordConfirm}
                  mono={false}
                  keyboardType="default"
                  secureTextEntry
                  placeholder="Repeat password"
                  testID="backup-password-confirm"
                />
                <Button
                  label={backupBusy ? "Working…" : "Create encrypted backup"}
                  tone="primary"
                  onPress={createEncryptedBackupFile}
                  disabled={!canCreateBackup}
                  icon={<KeyRound size={16} color={colors.onSolid} />}
                  testID="create-encrypted-backup"
                />
                <Hairline />
                <AppText variant="overline" tone="faint">
                  Restore
                </AppText>
                <Field
                  label="Restore password"
                  value={restorePassword}
                  onChangeText={setRestorePassword}
                  mono={false}
                  keyboardType="default"
                  secureTextEntry
                  placeholder="Password for the backup file"
                  testID="restore-password"
                />
                <Button
                  label="Choose backup file…"
                  tone="ghost"
                  onPress={pickRestoreFile}
                  disabled={restorePassword.length === 0 || backupBusy}
                  testID="pick-backup-file"
                />
                {restorePreview !== null ? (
                  <View style={styles.restorePreview} testID="restore-preview">
                    <AppText variant="label" tone="secondary">
                      Preview · {restorePreview.file.manifest.createdAtIso.slice(0, 10)} ·{" "}
                      {restorePreview.file.manifest.counts.vials} vials ·{" "}
                      {restorePreview.file.manifest.counts.events} events ·{" "}
                      {restorePreview.file.manifest.counts.plans} plans
                    </AppText>
                    <AppText variant="caption" tone="danger">
                      Restore replaces all PepRep data on this device. This cannot be undone.
                    </AppText>
                    <Button
                      label={
                        restoreArmed
                          ? "Tap again to replace everything"
                          : "Restore this backup"
                      }
                      tone="danger"
                      onPress={confirmRestore}
                      disabled={backupBusy}
                      testID="confirm-restore"
                    />
                    <Button
                      label="Cancel restore"
                      tone="ghost"
                      onPress={() => {
                        setRestorePreview(null);
                        setRestoreArmed(false);
                      }}
                    />
                  </View>
                ) : null}
              </>
            )}
          </Card>
          {!isWeb && isCloudBackupConfigured() ? (
            <CloudBackupPanel
              onStatus={setStatusMessage}
              onRestoreCiphertext={async (raw, password) => {
                const validated = decryptAndValidateBackup(raw, password);
                if (!validated.ok) {
                  setStatusMessage(validated.message);
                  return;
                }
                await applyBackupPayload(validated.plaintext);
                await Promise.all([
                  hydrateVials(),
                  hydrateDoses(),
                  hydrateLedger(),
                  hydratePlans(),
                  hydrateReminders(),
                ]);
              }}
            />
          ) : null}
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
                {ASK_V1_ENABLED
                  ? "Your vials, doses, schedule and history stay on this device by default. There is no analytics. Optional Ask sends question text to a cloud provider. Optional encrypted cloud backup (if enabled in this build) uploads only a password-encrypted file you choose — never the passphrase."
                  : isCloudBackupConfigured()
                    ? "Your vials, doses, schedule and history stay on this device by default. There is no analytics and no Ask in this build. Optional encrypted cloud backup uploads only a password-encrypted file you choose — the passphrase never leaves this device."
                    : "Your vials, doses, schedule and history stay on this device. There is no account and no analytics. Optional cloud Ask is not included in this build. Local encrypted backups are files you choose to share."}
              </AppText>
            </View>
            {ASK_V1_ENABLED ? (
              <>
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
                      if (next) {
                        setShowAskConsent(true);
                        return;
                      }
                      setShowAskConsent(false);
                      setAskEnabled(false).catch((error) =>
                        console.error("[settings] Toggle Ask failed", error),
                      );
                    }}
                    trackColor={{ true: colors.accent, false: colors.surfaceSunken }}
                    thumbColor={colors.surface}
                    accessibilityLabel="Ask"
                    accessibilityState={{ checked: askEnabled }}
                    testID="toggle-ask"
                  />
                </View>
                {showAskConsent && !askEnabled ? (
                  <View style={styles.privacyCopy}>
                    <AskConsentCard
                      busy={askConsentBusy}
                      onDecline={() => setShowAskConsent(false)}
                      onAccept={() => {
                        setAskConsentBusy(true);
                        acceptAskConsent()
                          .then(() => setShowAskConsent(false))
                          .catch((error) =>
                            console.error("[settings] Ask consent failed", error),
                          )
                          .finally(() => setAskConsentBusy(false));
                      }}
                    />
                  </View>
                ) : null}
              </>
            ) : null}
          </Card>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Card padded={false}>
            <Pressable
              onPress={() => router.push("/about")}
              style={styles.actionRow}
              testID="open-about"
              accessibilityRole="button"
            >
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
          PepRep 1.0.0 · No account · No analytics
            {ASK_V1_ENABLED ? " · Ask is optional" : ""}
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
  exportWarnCard: {
    gap: spacing.md,
  },
  restorePreview: {
    gap: spacing.sm,
  },
  status: {
    paddingHorizontal: spacing.xs,
  },
  footer: {
    textAlign: "center",
  },
});
}
