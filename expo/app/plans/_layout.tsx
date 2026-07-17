import { Stack } from "expo-router";

import { colors } from "@/src/theme/tokens";

export default function PlansLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
    </Stack>
  );
}
