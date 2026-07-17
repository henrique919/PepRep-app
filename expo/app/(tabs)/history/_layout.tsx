import { Stack } from "expo-router";

import { colors } from "@/src/theme/tokens";

export default function HistoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="[date]" />
      <Stack.Screen name="event/[id]" />
    </Stack>
  );
}
