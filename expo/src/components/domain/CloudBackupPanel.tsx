import * as Linking from "expo-linking";
import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import {
  createSessionFromUrl,
  deleteCloudAccount,
  deleteBackup,
  downloadBackup,
  getSignedInEmail,
  listManifests,
  signInWithOtp,
  signOut,
  uploadEncryptedBackup,
  verifyEmailOtp,
  type BackupManifestRow,
} from "@/src/cloudBackup/api";
import { isCloudBackupConfigured } from "@/src/cloudBackup/config";
import {
  buildBackupPayload,
  createEncryptedBackup,
  decryptAndValidateBackup,
  serializeBackupFile,
} from "@/src/backup/codec";
import { BACKUP_FORMAT_VERSION } from "@/src/backup/types";
import { SCHEMA_VERSION } from "@/src/db/schemaVersion";
import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import Field from "@/src/components/ui/Field";
import Hairline from "@/src/components/ui/Hairline";
import { useDosesStore } from "@/src/store/doses";
import { useLedgerStore } from "@/src/store/ledger";
import { usePlansStore } from "@/src/store/plans";
import { useRemindersStore } from "@/src/store/reminders";
import { useVialsStore } from "@/src/store/vials";
import { spacing } from "@/src/theme/tokens";

type Props = {
  onStatus: (message: string) => void;
  onRestoreCiphertext: (raw: string, password: string) => Promise<void>;
};

/**
 * Optional encrypted cloud backup UI. Render only when `isCloudBackupConfigured()`.
 * Never claims automatic sync. Uploads only ciphertext from the local backup codec.
 */
export default function CloudBackupPanel({ onStatus, onRestoreCiphertext }: Props) {
  const vials = useVialsStore((state) => state.vials);
  const doses = useDosesStore((state) => state.doses);
  const events = useLedgerStore((state) => state.events);
  const txns = useLedgerStore((state) => state.txns);
  const plans = usePlansStore((state) => state.plans);
  const reminders = useRemindersStore((state) => state.reminders);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [manifests, setManifests] = useState<BackupManifestRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<BackupManifestRow | null>(null);
  const [restorePassword, setRestorePassword] = useState("");
  const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null);
  const [accountDeleteArmed, setAccountDeleteArmed] = useState(false);

  const refresh = useCallback(async () => {
    if (!isCloudBackupConfigured()) return;
    try {
      const signedIn = await getSignedInEmail();
      setSignedInEmail(signedIn);
      if (signedIn !== null) {
        setManifests(await listManifests());
      } else {
        setManifests([]);
      }
    } catch (error) {
      console.error("[cloudBackup] refresh failed", error);
    }
  }, []);

  useEffect(() => {
    // refresh() only sets state after its internal awaits resolve, so this
    // isn't a synchronous effect-body setState — standard fetch-on-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isCloudBackupConfigured()) return;

    const handleUrl = (url: string | null) => {
      if (url === null || !url.includes("auth/callback")) return;
      setBusy(true);
      void createSessionFromUrl(url)
        .then(async (result) => {
          if (!result.ok) {
            onStatus(result.message);
            return;
          }
          setOtpSent(false);
          await refresh();
          onStatus("Signed in for optional cloud backup.");
        })
        .finally(() => setBusy(false));
    };

    void Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener("url", (event) => handleUrl(event.url));
    return () => subscription.remove();
  }, [onStatus, refresh]);

  if (!isCloudBackupConfigured()) return null;

  const sendOtp = async () => {
    setBusy(true);
    try {
      const result = await signInWithOtp(email.trim());
      if (!result.ok) {
        onStatus(result.message);
        return;
      }
      setOtpSent(true);
      onStatus("Check your email and open the sign-in link on this phone.");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setBusy(true);
    try {
      const result = await verifyEmailOtp(email.trim(), otp.trim());
      if (!result.ok) {
        onStatus(result.message);
        return;
      }
      setOtp("");
      setOtpSent(false);
      await refresh();
      onStatus("Signed in for optional cloud backup.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
      setSignedInEmail(null);
      setManifests([]);
      onStatus("Signed out of cloud backup.");
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Sign out failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!accountDeleteArmed) {
      setAccountDeleteArmed(true);
      onStatus("Tap Delete cloud account again to permanently remove the account and all cloud backups.");
      return;
    }
    setBusy(true);
    try {
      await deleteCloudAccount();
      setAccountDeleteArmed(false);
      setSignedInEmail(null);
      setManifests([]);
      setOtpSent(false);
      onStatus("Cloud account and cloud backups deleted. Local PepRep records remain on this device.");
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Account deletion failed.");
    } finally {
      setBusy(false);
    }
  };

  const upload = async () => {
    if (password.length < 8) {
      onStatus("Backup password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const payload = buildBackupPayload({
        vials,
        doses,
        doseEvents: events,
        inventoryTxns: txns,
        plans,
        reminders,
        exportedAtIso: new Date().toISOString(),
      });
      const file = createEncryptedBackup(payload, password);
      const raw = serializeBackupFile(file);
      await uploadEncryptedBackup({
        rawCiphertextJson: raw,
        checksumSha256: file.manifest.checksumSha256,
        byteSize: new TextEncoder().encode(raw).length,
        formatVersion: BACKUP_FORMAT_VERSION,
        schemaVersion: SCHEMA_VERSION,
        appVersion: file.manifest.appVersion,
      });
      setPassword("");
      await refresh();
      onStatus("Encrypted backup uploaded. PepRep does not receive your password.");
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const restoreFromCloud = async () => {
    if (restoreTarget === null || restorePassword.length === 0) return;
    setBusy(true);
    try {
      const raw = await downloadBackup(restoreTarget);
      const validated = decryptAndValidateBackup(raw, restorePassword);
      if (!validated.ok) {
        onStatus(validated.message);
        return;
      }
      await onRestoreCiphertext(raw, restorePassword);
      setRestoreTarget(null);
      setRestorePassword("");
      onStatus("Cloud backup restored onto this device.");
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Restore failed.");
    } finally {
      setBusy(false);
    }
  };

  const removeBackup = async (manifest: BackupManifestRow) => {
    if (deleteArmedId !== manifest.id) {
      setDeleteArmedId(manifest.id);
      return;
    }
    setBusy(true);
    try {
      await deleteBackup(manifest);
      setDeleteArmedId(null);
      await refresh();
      onStatus("Cloud backup deleted.");
    } catch (error) {
      onStatus(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={{ gap: spacing.md }} testID="cloud-backup-card">
      <AppText variant="heading">Encrypted cloud backup</AppText>
      <AppText variant="label" tone="secondary">
        Optional account for uploading a password-encrypted backup file. The passphrase never
        leaves this device. This is not automatic sync. Local encrypted backup (above) does not
        use email.
      </AppText>

      {signedInEmail === null ? (
        <View style={{ gap: spacing.sm }}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            mono={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            testID="cloud-backup-email"
          />
          {!otpSent ? (
            <Button
              label={busy ? "Sending…" : "Email me a sign-in link"}
              tone="primary"
              onPress={sendOtp}
              disabled={busy || email.trim().length === 0}
              testID="cloud-backup-send-otp"
            />
          ) : (
            <>
              <AppText variant="caption" tone="secondary">
                Open the link from the email on this phone so PepRep can finish sign-in. Ignore a
                blank browser page if it appears after the app opens. If the email shows a 6-digit
                code instead, enter it below.
              </AppText>
              <Field
                label="One-time code (optional)"
                value={otp}
                onChangeText={setOtp}
                mono
                keyboardType="number-pad"
                placeholder="123456"
                testID="cloud-backup-otp"
              />
              <Button
                label={busy ? "Verifying…" : "Verify code"}
                tone="primary"
                onPress={verifyOtp}
                disabled={busy || otp.trim().length === 0}
                testID="cloud-backup-verify-otp"
              />
              <Button
                label="Send again"
                tone="ghost"
                onPress={sendOtp}
                disabled={busy}
              />
            </>
          )}
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="caption" tone="faint">
            Signed in as {signedInEmail}
          </AppText>
          <Button label="Sign out" tone="ghost" compact onPress={handleSignOut} disabled={busy} />
          <Hairline />
          <Field
            label="Backup password (stays on this device)"
            value={password}
            onChangeText={setPassword}
            mono={false}
            keyboardType="default"
            secureTextEntry
            placeholder="At least 8 characters"
            testID="cloud-backup-password"
          />
          <Button
            label={busy ? "Uploading…" : "Upload encrypted backup"}
            tone="primary"
            onPress={upload}
            disabled={busy || password.length < 8}
            testID="cloud-backup-upload"
          />
          <Hairline />
          <AppText variant="overline" tone="faint">
            Your cloud backups
          </AppText>
          {manifests.length === 0 ? (
            <AppText variant="caption" tone="faint">
              No cloud backups yet.
            </AppText>
          ) : (
            manifests.map((manifest) => (
              <View key={manifest.id} style={{ gap: spacing.xs }}>
                <AppText variant="label" mono>
                  {manifest.createdAtIso.slice(0, 19)} · {manifest.byteSize} B
                </AppText>
                <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
                  <Button
                    label="Restore…"
                    tone="ghost"
                    compact
                    onPress={() => {
                      setRestoreTarget(manifest);
                      setRestorePassword("");
                    }}
                    disabled={busy}
                  />
                  <Button
                    label={
                      deleteArmedId === manifest.id ? "Tap again to delete" : "Delete"
                    }
                    tone="danger"
                    compact
                    onPress={() => void removeBackup(manifest)}
                    disabled={busy}
                  />
                </View>
              </View>
            ))
          )}
          {restoreTarget !== null ? (
            <View style={{ gap: spacing.sm }} testID="cloud-backup-restore">
              <AppText variant="caption" tone="danger">
                Restore replaces all PepRep data on this device after you confirm in the next step.
              </AppText>
              <Field
                label="Password for this backup"
                value={restorePassword}
                onChangeText={setRestorePassword}
                secureTextEntry
                mono={false}
                keyboardType="default"
                placeholder="Backup password"
              />
              <Button
                label={busy ? "Working…" : "Download and restore"}
                tone="danger"
                onPress={restoreFromCloud}
                disabled={busy || restorePassword.length === 0}
              />
              <Button
                label="Cancel"
                tone="ghost"
                onPress={() => {
                  setRestoreTarget(null);
                  setRestorePassword("");
                }}
              />
            </View>
          ) : null}
          <Hairline />
          <View style={{ gap: spacing.sm }}>
            <AppText variant="overline" tone="faint">
              Cloud account controls
            </AppText>
            <AppText variant="caption" tone="secondary">
              Deleting the cloud account permanently removes its email account, backup files and
              backup manifests. Records stored locally on this device are not erased.
            </AppText>
            <Button
              label={accountDeleteArmed ? "Delete cloud account permanently" : "Delete cloud account"}
              tone="danger"
              compact
              onPress={() => void handleDeleteAccount()}
              disabled={busy}
              testID="delete-cloud-account"
            />
            {accountDeleteArmed ? (
              <Button
                label="Cancel account deletion"
                tone="ghost"
                compact
                onPress={() => setAccountDeleteArmed(false)}
                disabled={busy}
              />
            ) : null}
          </View>
        </View>
      )}
    </Card>
  );
}
