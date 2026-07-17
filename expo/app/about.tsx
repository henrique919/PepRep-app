import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import BoldTallyMark from "@/src/components/ui/BoldTallyMark";
import Card from "@/src/components/ui/Card";
import Hairline from "@/src/components/ui/Hairline";
import Screen from "@/src/components/ui/Screen";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { DISCLAIMER, hairlineWidth, radius, spacing } from "@/src/theme/tokens";

export default function AboutScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  return (
    <Screen topInset={Platform.OS !== "ios"}>
      <View style={styles.chrome}>
        <AppText variant="heading">About</AppText>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeButton} testID="close-about">
          <X size={18} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <BoldTallyMark size={48} />
          <AppText variant="overline" tone="faint">
            PepRep 1.0.0
          </AppText>
          <AppText variant="title">A measurement instrument,{"\n"}not an advisor.</AppText>
        </View>

        <Card style={styles.card}>
          <AppText variant="body" tone="secondary">
            PepRep computes injection draws exactly, shows every step of its working, and keeps an
            auditable record of what you actually did. You enter 100% of your own plan — PepRep
            only does the arithmetic and the record-keeping.
          </AppText>
        </Card>

        <Card padded={false}>
          <View style={styles.factRow}>
            <AppText variant="overline" tone="faint">
              What it does
            </AppText>
            <AppText variant="label" tone="secondary">
              Reconstitution math on U-100 syringes · worked steps for every result · a dose log
              and vial inventory you control · optional reminders you define yourself · export of
              your own records
            </AppText>
          </View>
          <Hairline />
          <View style={styles.factRow}>
            <AppText variant="overline" tone="faint">
              What it never does
            </AppText>
            <AppText variant="label" tone="secondary">
              No dose suggestions, ranges or protocols · no accounts or sign-in · no network calls,
              analytics or telemetry — everything stays on this device
            </AppText>
          </View>
          <Hairline />
          <View style={styles.factRow}>
            <AppText variant="overline" tone="faint">
              One constant worth knowing
            </AppText>
            <AppText variant="label" mono tone="secondary">
              A U-100 syringe is always 100 units per mL. Barrel size (0.3 / 0.5 / 1.0 mL) changes
              only how much it holds — never the scale.
            </AppText>
          </View>
        </Card>

        <AppText variant="caption" tone="faint" style={styles.disclaimer}>
          {DISCLAIMER}
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
  disclaimer: {
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});
}
