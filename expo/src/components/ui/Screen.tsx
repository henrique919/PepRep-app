import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/src/theme/tokens";

interface ScreenProps {
  children: React.ReactNode;
  /** Modal screens have their own top chrome and skip the top inset. */
  topInset?: boolean;
}

export default function Screen({ children, topInset = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, topInset && { paddingTop: insets.top }]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
