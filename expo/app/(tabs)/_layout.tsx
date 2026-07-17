import { Tabs } from "expo-router";
import { BookOpenText, CalendarDays, History, Syringe, TestTubes } from "lucide-react-native";
import React from "react";

import { useTheme } from "@/src/theme";
import { fonts, hairlineWidth } from "@/src/theme/tokens";

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      initialRouteName="today"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.hairline,
          borderTopWidth: hairlineWidth,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.uiMedium,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarIcon: ({ color }) => <CalendarDays size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Calculate",
          tabBarIcon: ({ color }) => <Syringe size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reference"
        options={{
          title: "Reference",
          tabBarIcon: ({ color }) => <BookOpenText size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vials"
        options={{
          title: "Vials",
          tabBarIcon: ({ color }) => <TestTubes size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <History size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
