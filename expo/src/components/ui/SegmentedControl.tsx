import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { colors, hairlineWidth, radius, spacing } from "@/src/theme/tokens";

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Render labels in mono (for numeric options such as syringe sizes). */
  mono?: boolean;
  testID?: string;
}

export default function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  mono = false,
  testID,
}: SegmentedControlProps<T>) {
  const select = (next: T) => {
    if (next === value) return;
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => undefined);
    }
    onChange(next);
  };

  return (
    <View style={styles.track} testID={testID}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => select(option.value)}
            style={({ pressed }) => [
              styles.segment,
              active && styles.activeSegment,
              pressed && styles.pressedSegment,
            ]}
          >
            <AppText
              variant="label"
              mono={mono}
              weight={active ? "semibold" : "medium"}
              tone={active ? "ink" : "secondary"}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
    borderWidth: hairlineWidth,
    borderColor: colors.hairline,
  },
  segment: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderWidth: hairlineWidth,
    borderColor: "transparent",
  },
  activeSegment: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
  },
  pressedSegment: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
