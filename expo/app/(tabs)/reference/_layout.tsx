import { Stack } from "expo-router";

import { colors } from "@/src/theme/tokens";

export default function ReferenceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="glossary" />
      <Stack.Screen name="ask" />
      <Stack.Screen name="[slug]" />
    </Stack>
  );
}
