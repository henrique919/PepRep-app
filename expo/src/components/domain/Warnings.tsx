import { TriangleAlert } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { colors, hairlineWidth, radius, spacing } from "@/src/theme/tokens";

interface WarningsProps {
  warnings: string[];
}

/** Calm, factual verification notes from the engine. Never urgent copy. */
export default function Warnings({ warnings }: WarningsProps) {
  if (warnings.length === 0) return null;
  return (
    <View style={styles.wrap}>
      {warnings.map((warning) => (
        <View key={warning} style={styles.row}>
          <TriangleAlert size={16} color={colors.warnInk} style={styles.icon} />
          <AppText variant="label" tone="warn" style={styles.text}>
            {warning}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.warnBg,
    borderColor: colors.warnBorder,
    borderWidth: hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  icon: {
    marginTop: 2,
  },
  text: {
    flex: 1,
  },
});
