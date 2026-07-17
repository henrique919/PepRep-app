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
import { Redirect, Stack, useSegments, type Href } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { runMigrations } from "@/src/db/migrations";
import { runMissedRollover } from "@/src/db/rollover";
import { dayKey } from "@/src/engine/schedule";
import { useDosesStore } from "@/src/store/doses";
import { useLedgerStore } from "@/src/store/ledger";
import { usePlansStore } from "@/src/store/plans";
import { useRemindersStore } from "@/src/store/reminders";
import { useSettingsStore } from "@/src/store/settings";
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
  const hydrated = useSettingsStore((state) => state.hydrated);
  const onboardingComplete = useSettingsStore((state) => state.onboardingComplete);
  const segments = useSegments();
  const inOnboarding = (segments as string[])[0] === "onboarding";

  if (hydrated && !onboardingComplete && !inOnboarding) {
    return <Redirect href={"/onboarding" as Href} />;
  }
  if (hydrated && onboardingComplete && inOnboarding) {
    return <Redirect href={"/(tabs)" as Href} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="plans" />
      <Stack.Screen name="log-entry" options={{ presentation: "modal" }} />
      <Stack.Screen name="log-plan" options={{ presentation: "modal" }} />
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
  const hydratePlans = usePlansStore((state) => state.hydrate);
  const hydrateLedger = useLedgerStore((state) => state.hydrate);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        await runMigrations();
        await Promise.all([
          hydrateVials(),
          hydrateDoses(),
          hydrateReminders(),
          hydratePlans(),
          hydrateLedger(),
          hydrateSettings(),
        ]);
        const today = dayKey(new Date().toISOString());
        const { created } = await runMissedRollover({
          plans: usePlansStore.getState().plans,
          events: useLedgerStore.getState().events,
          today,
        });
        if (created.length > 0) {
          await useLedgerStore.getState().appendEvents(created);
        }
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
  }, [hydrateVials, hydrateDoses, hydrateReminders, hydratePlans, hydrateLedger, hydrateSettings]);

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
