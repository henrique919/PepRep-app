import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

interface ToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  durationMs?: number;
}

export default function Toast({
  message,
  actionLabel,
  onAction,
  onDismiss,
  durationMs = 4000,
}: ToastProps) {
  const { colors } = useTheme();

  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onDismiss, message]);

  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      exiting={FadeOutDown.duration(160)}
      style={[styles.wrap, { backgroundColor: colors.solid }]}
    >
      <AppText variant="label" weight="medium" tone="onSolid" style={styles.message}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable
          onPress={() => {
            onAction();
            onDismiss();
          }}
          hitSlop={8}
        >
          <AppText variant="label" weight="bold" style={{ color: colors.accent }}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : (
        <View />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    zIndex: 50,
  },
  message: {
    flex: 1,
  },
});
