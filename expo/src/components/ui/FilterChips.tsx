import React from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

export type FilterChipOption<T extends string> = {
  value: T;
  label: string;
};

interface FilterChipsProps<T extends string> {
  options: FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  testID?: string;
}

export default function FilterChips<T extends string>({
  options,
  value,
  onChange,
  testID,
}: FilterChipsProps<T>) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      testID={testID}
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: on }}
            aria-selected={on}
            style={[
              styles.chip,
              {
                backgroundColor: on ? colors.solid : colors.surface,
                borderColor: on ? colors.solid : colors.hairline,
                minHeight: 44,
              },
            ]}
          >
            <AppText variant="label" weight="semibold" tone={on ? "onSolid" : "secondary"}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});
