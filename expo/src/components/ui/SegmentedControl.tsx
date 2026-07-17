import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

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
  const { colors } = useTheme();

  const select = (next: T) => {
    if (next === value) return;
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => undefined);
    }
    onChange(next);
  };

  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceSunken }]} testID={testID}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => select(option.value)}
            style={[
              styles.segment,
              active && {
                backgroundColor: colors.surface,
                borderColor: colors.hairline,
              },
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
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.sm + 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderWidth: hairlineWidth,
    borderColor: "transparent",
  },
});
