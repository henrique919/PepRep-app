import { Stack } from "expo-router";
import React from "react";

import { colors } from "@/src/theme/tokens";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: "fade",
      }}
    />
  );
}
