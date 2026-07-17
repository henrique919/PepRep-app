import { Link, Stack } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { colors, spacing } from "@/src/theme/tokens";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found", headerShown: true }} />
      <View style={styles.container}>
        <AppText variant="heading">This screen does not exist.</AppText>
        <Link href="/">
          <AppText variant="label" weight="semibold" tone="accent">
            Back to the calculator
          </AppText>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.bg,
  },
});
