import React from "react";
import { StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { colors, hairlineWidth, radius, spacing } from "@/src/theme/tokens";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  caption: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, caption, action }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconRing}>{icon}</View>
      <AppText variant="heading" style={styles.center}>
        {title}
      </AppText>
      <AppText variant="label" tone="secondary" style={styles.center}>
        {caption}
      </AppText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    borderWidth: hairlineWidth,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  center: {
    textAlign: "center",
  },
});
