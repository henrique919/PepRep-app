import { Stack } from "expo-router";

import { withAccessibleTabScreen } from "@/src/components/ui/AccessibleTabScreen";
import { colors } from "@/src/theme/tokens";

function ReferenceLayout() {
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

export default withAccessibleTabScreen(ReferenceLayout, (pathname) => pathname.startsWith("/reference"));
