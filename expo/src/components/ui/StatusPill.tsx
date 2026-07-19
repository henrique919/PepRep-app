import React from "react";
import { StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

export type ScheduleStatus = "due" | "logged" | "skipped" | "missed";

interface StatusPillProps {
  status: ScheduleStatus;
  label?: string;
}

const LABELS: Record<ScheduleStatus, string> = {
  due: "Due",
  logged: "Logged",
  skipped: "Skipped",
  missed: "Missed",
};

export default function StatusPill({ status, label }: StatusPillProps) {
  const { colors } = useTheme();
  const ink =
    status === "due"
      ? colors.onAccent
      : status === "logged"
        ? colors.success
        : status === "missed"
          ? colors.dangerInk
          : colors.inkSecondary;
  const bg =
    status === "due"
      ? colors.accent
      : status === "logged"
        ? colors.successBg
        : status === "missed"
          ? colors.dangerBg
          : colors.surfaceSunken;
  const dot =
    status === "due"
      ? colors.onAccent
      : status === "logged"
        ? colors.success
        : status === "missed"
          ? colors.dangerInk
          : colors.inkFaint;

  return (
    <View
      style={[styles.pill, { backgroundColor: bg }]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${label ?? LABELS[status]}`}
    >
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <AppText variant="overline" weight="semibold" style={{ color: ink, letterSpacing: 0.6 }}>
        {label ?? LABELS[status]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
