import { TriangleAlert } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

interface WarningsProps {
  warnings: string[];
  critical?: boolean;
}

/** Factual verification notes from the engine, promoted when an action is blocked. */
export default function Warnings({ warnings, critical = false }: WarningsProps) {
  const { colors } = useTheme();
  if (warnings.length === 0) return null;
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: critical ? colors.dangerBg : colors.warnBg,
          borderColor: critical ? colors.dangerInk : colors.warnBorder,
        },
      ]}
      accessibilityRole={critical ? "alert" : undefined}
      accessibilityLiveRegion={critical ? "assertive" : "polite"}
      testID={critical ? "blocking-calculation-warning" : "calculation-warning"}
    >
      <AppText variant="overline" tone={critical ? "danger" : "warn"}>
        {critical ? "Correction required" : "Check before continuing"}
      </AppText>
      {warnings.map((warning) => (
        <View key={warning} style={styles.row}>
          <TriangleAlert
            size={18}
            color={critical ? colors.dangerInk : colors.warnInk}
            style={styles.icon}
          />
          <AppText variant="label" tone={critical ? "danger" : "warn"} style={styles.text}>
            {warning}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
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
