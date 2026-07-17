import React from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { colors, hairlineWidth, radius, spacing } from "@/src/theme/tokens";

interface CardProps {
  children: React.ReactNode;
  /** Dark "instrument panel" variant used for the result readout. */
  dark?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export default function Card({ children, dark = false, padded = true, style, testID }: CardProps) {
  return (
    <View
      testID={testID}
      style={[styles.base, dark ? styles.dark : styles.light, padded && styles.padded, style]}
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
  light: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
  },
  dark: {
    backgroundColor: colors.panel,
    borderColor: colors.panel,
  },
  padded: {
    padding: spacing.lg,
  },
});
