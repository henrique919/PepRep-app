import { Stack } from "expo-router";

import { withAccessibleTabScreen } from "@/src/components/ui/AccessibleTabScreen";
import { colors } from "@/src/theme/tokens";

function HistoryLayout() {
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

export default withAccessibleTabScreen(HistoryLayout, (pathname) => pathname.startsWith("/history"));
