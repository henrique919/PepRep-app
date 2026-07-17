import React from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { colors, hairlineWidth, radius, shadows, spacing } from "@/src/theme/tokens";

interface CardProps {
  children: React.ReactNode;
  /** Dark "instrument panel" variant used for the result readout. */
  dark?: boolean;
  /** Soft elevation on warm paper — use sparingly for hierarchy. */
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
  return (
    <View
      testID={testID}
      style={[
        styles.base,
        dark ? styles.dark : styles.light,
        elevated && (dark ? styles.elevatedDark : styles.elevatedLight),
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
  },
  light: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
  },
  dark: {
    backgroundColor: colors.panel,
    borderColor: colors.hairlineDark,
  },
  elevatedLight: {
    ...shadows.card,
  },
  elevatedDark: {
    ...shadows.result,
    backgroundColor: colors.panelRaised,
    borderColor: colors.hairlineDark,
  },
  padded: {
    padding: spacing.xl,
  },
});
