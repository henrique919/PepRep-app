import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
} from "@expo-google-fonts/ibm-plex-mono";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { runMigrations } from "@/src/db/migrations";
import { useDosesStore } from "@/src/store/doses";
import { useRemindersStore } from "@/src/store/reminders";
import { useVialsStore } from "@/src/store/vials";
import { colors } from "@/src/theme/tokens";

SplashScreen.preventAutoHideAsync();

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="log-entry" options={{ presentation: "modal" }} />
      <Stack.Screen name="vial-new" options={{ presentation: "modal" }} />
      <Stack.Screen name="about" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });
  const [dataReady, setDataReady] = useState<boolean>(false);

  const hydrateVials = useVialsStore((state) => state.hydrate);
  const hydrateDoses = useDosesStore((state) => state.hydrate);
  const hydrateReminders = useRemindersStore((state) => state.hydrate);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        await runMigrations();
        await Promise.all([hydrateVials(), hydrateDoses(), hydrateReminders()]);
      } catch (error) {
        console.error("[boot] Failed to hydrate local data", error);
      } finally {
        if (!cancelled) setDataReady(true);
      }
    };
    boot();
    return () => {
      cancelled = true;
    };
  }, [hydrateVials, hydrateDoses, hydrateReminders]);

  const ready = fontsLoaded && dataReady;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <RootLayoutNav />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
