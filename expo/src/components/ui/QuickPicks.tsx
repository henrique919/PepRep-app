import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme";
import { spacing } from "@/src/theme/tokens";

export type QuickPickOption = {
  label: string;
  sublabel?: string;
  value: string;
};

interface QuickPicksProps {
  options: QuickPickOption[];
  selected?: string;
  onSelect: (value: string) => void;
  /** Stretch chips evenly (syringe capacity row). */
  equal?: boolean;
  testID?: string;
}

export default function QuickPicks({
  options,
  selected,
  onSelect,
  equal = false,
  testID,
}: QuickPicksProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row} testID={testID}>
      {options.map((option) => {
        const on = selected === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="button"
            accessibilityLabel={
              option.sublabel ? `${option.label}, ${option.sublabel}` : option.label
            }
            accessibilityState={{ selected: on }}
            style={[
              styles.chip,
              equal && styles.chipEqual,
              {
                backgroundColor: on ? colors.solid : colors.surface,
                borderColor: on ? colors.solid : colors.hairline,
              },
            ]}
          >
            <AppText
              variant="label"
              mono
              weight="medium"
              tone={on ? "onSolid" : "ink"}
            >
              {option.label}
            </AppText>
            {option.sublabel ? (
              <AppText
                variant="overline"
                mono
                style={{ color: on ? colors.accent : colors.inkFaint }}
              >
                {option.sublabel}
              </AppText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  chipEqual: {
    flex: 1,
    minWidth: 0,
  },
});
