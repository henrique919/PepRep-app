import { Stack, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import { useTheme } from "@/src/theme";
import { spacing } from "@/src/theme/tokens";

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: "Not found", headerShown: true }} />
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <AppText variant="heading">This screen does not exist.</AppText>
        <Button
          label="Back to the calculator"
          tone="primary"
          onPress={() => router.replace("/")}
          testID="not-found-back"
        />
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
  },
});
