import React from "react";
import { StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

type CalloutTone = "warn" | "info" | "error";

interface CalloutProps {
  tone?: CalloutTone;
  title?: string;
  children: string;
}

export default function Callout({ tone = "info", title, children }: CalloutProps) {
  const { colors } = useTheme();
  const bg =
    tone === "warn" ? colors.warnBg : tone === "error" ? colors.dangerBg : colors.infoBg;
  const ink =
    tone === "warn" ? colors.warnInk : tone === "error" ? colors.dangerInk : colors.infoInk;
  const border = tone === "warn" ? colors.warnBorder : "transparent";

  return (
    <View style={[styles.box, { backgroundColor: bg, borderColor: border }]}>
      {title ? (
        <AppText variant="label" weight="semibold" style={{ color: ink }}>
          {title}
        </AppText>
      ) : null}
      <AppText variant="caption" style={{ color: ink }}>
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
});
