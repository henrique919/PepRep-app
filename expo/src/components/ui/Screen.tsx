import React from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme";
import { spacing } from "@/src/theme/tokens";

interface ScreenProps {
  children: React.ReactNode;
  /** Modal screens have their own top chrome and skip the top inset. */
  topInset?: boolean;
}

const TABLET_MIN = 820;
const CONTENT_MAX = 720;

// The safe-area line alone leaves screen titles touching the status bar
// clock on notched iPhones; a little breathing room keeps them clear.
const NATIVE_TOP_BREATHING_ROOM = Platform.OS === "web" ? 0 : spacing.sm;

export default function Screen({ children, topInset = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_MIN;

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.bg },
        topInset && { paddingTop: insets.top + NATIVE_TOP_BREATHING_ROOM },
      ]}
    >
      <View style={[styles.inner, isTablet && styles.innerTablet]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    flex: 1,
    width: "100%",
  },
  innerTablet: {
    maxWidth: CONTENT_MAX,
    alignSelf: "center",
    width: "100%",
  },
});
