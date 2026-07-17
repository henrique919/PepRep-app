import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { colors, hairlineWidth, radius, spacing } from "@/src/theme/tokens";

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
  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    onPress();
  };

  const textTone = tone === "accent" || tone === "primary" ? "onAccent" : tone === "danger" ? "danger" : "ink";

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.regular,
        styles[tone],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
      <AppText
        variant={compact ? "label" : "body"}
        weight="semibold"
        tone={tone === "primary" ? "onDark" : textTone}
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
    borderColor: "transparent",
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
  primary: {
    backgroundColor: colors.ink,
  },
  accent: {
    backgroundColor: colors.accent,
  },
  ghost: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
  },
  danger: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBg,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.4,
  },
});
