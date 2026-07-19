import { Tabs } from "expo-router";
import {
  CalendarDays,
  ClipboardList,
  EllipsisVertical,
  History,
  TestTubes,
} from "lucide-react-native";
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
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.hairline,
          borderTopWidth: hairlineWidth,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.uiSemiBold,
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarIcon: ({ color }) => <CalendarDays size={22} color={color} strokeWidth={1.6} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Calc",
          tabBarIcon: ({ color }) => <ClipboardList size={22} color={color} strokeWidth={1.6} />,
        }}
      />
      <Tabs.Screen
        name="vials"
        options={{
          title: "Vials",
          tabBarIcon: ({ color }) => <TestTubes size={22} color={color} strokeWidth={1.6} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <History size={22} color={color} strokeWidth={1.6} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => <EllipsisVertical size={22} color={color} strokeWidth={1.6} />,
        }}
      />
      <Tabs.Screen
        name="reference"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
