import React from "react";
import { StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

type CalloutTone = "warn" | "info" | "error";

interface CalloutProps {
  tone?: CalloutTone;
  title?: string;
  /** One-line, no title — for once the warning is informational rather than actionable. */
  compact?: boolean;
  children: string;
}

export default function Callout({ tone = "info", title, compact = false, children }: CalloutProps) {
  const { colors } = useTheme();
  const bg =
    tone === "warn" ? colors.warnBg : tone === "error" ? colors.dangerBg : colors.infoBg;
  const ink =
    tone === "warn" ? colors.warnInk : tone === "error" ? colors.dangerInk : colors.infoInk;
  const border = tone === "warn" ? colors.warnBorder : "transparent";

  return (
    <View style={[styles.box, compact && styles.boxCompact, { backgroundColor: bg, borderColor: border }]}>
      {title && !compact ? (
        <AppText variant="label" weight="semibold" style={{ color: ink }}>
          {title}
        </AppText>
      ) : null}
      <AppText
        variant="caption"
        style={{ color: ink }}
        numberOfLines={compact ? 1 : undefined}
      >
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.md,
    borderWidth: hairlineWidth,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  boxCompact: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 0,
  },
});
