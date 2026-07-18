import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ASK_V1_ENABLED } from "@/src/ask/feature";
import { isCloudBackupConfigured } from "@/src/cloudBackup/config";
import AppText from "@/src/components/ui/AppText";
import Card from "@/src/components/ui/Card";
import Hairline from "@/src/components/ui/Hairline";
import Screen from "@/src/components/ui/Screen";
import { CURRENT_SAFETY_ACK_VERSION, useSettingsStore } from "@/src/store/settings";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { DISCLAIMER, hairlineWidth, radius, spacing } from "@/src/theme/tokens";

export default function PrivacySafetyScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const safetyAckVersion = useSettingsStore((state) => state.safetyAckVersion);
  const cloudConfigured = isCloudBackupConfigured();

  return (
    <Screen topInset={Platform.OS !== "ios"}>
      <View style={styles.chrome}>
        <AppText variant="heading">Privacy & safety</AppText>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.closeButton}
          testID="close-privacy"
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X size={18} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <AppText variant="overline" tone="faint">
            Measurement instrument
          </AppText>
          <AppText variant="title">Your plan. Your arithmetic. Your device.</AppText>
        </View>

        <Card style={styles.card}>
          <AppText variant="overline" tone="faint">
            Safety
          </AppText>
          <AppText variant="body" tone="secondary">
            {DISCLAIMER}
          </AppText>
          <AppText variant="label" tone="secondary">
            You are responsible for your own plan and for checking every result against your vial
            and syringe. PepRep only converts the numbers you provide — it never recommends a
            dose, range, or protocol.
          </AppText>
          <AppText variant="caption" tone="faint">
            Safety acknowledgement version {CURRENT_SAFETY_ACK_VERSION}
            {safetyAckVersion === CURRENT_SAFETY_ACK_VERSION
              ? " · accepted on this device"
              : " · will re-prompt if copy changes"}
          </AppText>
        </Card>

        <Card padded={false}>
          <View style={styles.factRow}>
            <AppText variant="overline" tone="faint">
              Privacy
            </AppText>
            <AppText variant="label" tone="secondary">
              {ASK_V1_ENABLED
                ? "Vials, doses, schedule and history stay on this device by default. There is no analytics. Optional Ask sends question text to a cloud provider when you turn it on."
                : "Vials, doses, schedule and history stay on this device by default. There is no analytics. Optional cloud Ask is not included in this build."}
            </AppText>
          </View>
          <Hairline />
          <View style={styles.factRow}>
            <AppText variant="overline" tone="faint">
              Backups
            </AppText>
            <AppText variant="label" tone="secondary">
              {cloudConfigured
                ? "Local encrypted backups are password-protected files you save yourself. Optional cloud backup uploads only ciphertext you choose — the passphrase never leaves this device. Neither path is automatic sync."
                : "Local encrypted backups are password-protected files you save yourself (Files, Drive, etc.). PepRep does not upload them. This is not automatic sync."}
            </AppText>
          </View>
          <Hairline />
          <View style={styles.factRow}>
            <AppText variant="overline" tone="faint">
              Export & erase
            </AppText>
            <AppText variant="label" tone="secondary">
              Plaintext CSV/JSON exports are unencrypted — share only with people and apps you
              trust. Erase all data removes every record from this device.
            </AppText>
          </View>
        </Card>

        <Pressable
          onPress={() => router.push("/settings")}
          accessibilityRole="button"
          accessibilityLabel="Open settings for export and data controls"
          style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
          testID="privacy-open-settings"
        >
          <AppText variant="label" weight="medium">
            Export / manage data in Settings
          </AppText>
          <AppText variant="caption" tone="faint">
            Reminders, backups, export, erase
          </AppText>
        </Pressable>
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
    hero: {
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    card: {
      gap: spacing.sm,
    },
    factRow: {
      padding: spacing.lg,
      gap: spacing.sm,
    },
    linkRow: {
      gap: spacing.xs,
      paddingVertical: spacing.sm,
    },
  });
}
