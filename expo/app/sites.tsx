import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import Callout from "@/src/components/ui/Callout";
import Screen from "@/src/components/ui/Screen";
import { useTheme } from "@/src/theme";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

const SITES = [
  { id: "abd-l", label: "Abdomen · left", hint: "Rotate within zone" },
  { id: "abd-r", label: "Abdomen · right", hint: "Rotate within zone" },
  { id: "thigh-l", label: "Thigh · left", hint: "Outer mid-thigh" },
  { id: "thigh-r", label: "Thigh · right", hint: "Outer mid-thigh" },
  { id: "arm-l", label: "Upper arm · left", hint: "If your protocol uses it" },
  { id: "arm-r", label: "Upper arm · right", hint: "If your protocol uses it" },
] as const;

export default function SitesScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.chrome}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="display">Sites</AppText>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppText variant="body" tone="secondary">
          Track rotation zones when you log. PepRep records the site you pick — it does not
          recommend where to inject.
        </AppText>
        <Callout tone="info" title="Educational">
          Leave at least one unused patch between sessions in the same zone when you can.
        </Callout>
        {SITES.map((site) => (
          <View
            key={site.id}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
          >
            <View style={[styles.dot, { backgroundColor: colors.accent }]} />
            <View style={styles.rowText}>
              <AppText variant="heading" weight="semibold">
                {site.label}
              </AppText>
              <AppText variant="caption" tone="secondary">
                {site.hint}
              </AppText>
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chrome: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 64,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
