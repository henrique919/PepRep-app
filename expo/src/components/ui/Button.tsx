import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

type ButtonTone = "primary" | "accent" | "ghost" | "danger";

interface ButtonProps {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  disabled?: boolean;
  icon?: React.ReactNode;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export default function Button({
  label,
  onPress,
  tone = "primary",
  disabled = false,
  icon,
  compact = false,
  style,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    onPress();
  };

  // Mineral: primary = carbon fill + volt label; accent = volt fill + dark label.
  const textTone =
    tone === "accent"
      ? "onAccent"
      : tone === "primary"
        ? "onSolid"
        : tone === "danger"
          ? "danger"
          : "ink";

  const toneStyle: ViewStyle =
    tone === "primary"
      ? { backgroundColor: colors.solid, borderColor: "transparent" }
      : tone === "accent"
        ? { backgroundColor: colors.accent, borderColor: "transparent" }
        : tone === "ghost"
          ? { backgroundColor: colors.surface, borderColor: colors.hairline }
          : { backgroundColor: colors.dangerBg, borderColor: colors.dangerBg };

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.regular,
        toneStyle,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
      <AppText
        variant={compact ? "label" : "body"}
        weight="semibold"
        tone={textTone}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: hairlineWidth,
  },
  regular: {
    minHeight: 50,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  compact: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.4,
  },
});
