import React from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { useTheme } from "@/src/theme";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

interface CardProps {
  children: React.ReactNode;
  /** Dark "instrument panel" variant used for the result readout. */
  dark?: boolean;
  /** Soft elevation — hierarchy only; same surfaces in both schemes. */
  elevated?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export default function Card({
  children,
  dark = false,
  elevated = false,
  padded = true,
  style,
  testID,
}: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        styles.base,
        dark
          ? {
              backgroundColor: elevated ? colors.panelRaised : colors.panel,
              borderColor: colors.hairlineDark,
            }
          : { backgroundColor: colors.surface, borderColor: colors.hairline },
        elevated &&
          !dark && {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 1,
          },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: hairlineWidth,
    overflow: "hidden",
  },
  padded: {
    padding: spacing.lg,
  },
});
