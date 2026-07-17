import { format } from "date-fns";
import { useRouter } from "expo-router";
import { CalendarDays, Settings2 } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import EmptyState from "@/src/components/ui/EmptyState";
import Screen from "@/src/components/ui/Screen";
import { colors, radius, spacing } from "@/src/theme/tokens";

export default function TodayScreen() {
  const router = useRouter();
  const now = new Date();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <AppText variant="overline" tone="faint">
              {format(now, "EEEE")}
            </AppText>
            <AppText variant="title">{format(now, "d MMMM yyyy")}</AppText>
          </View>
          <Pressable
            onPress={() => router.push("/settings")}
            hitSlop={8}
            style={styles.gearButton}
            testID="open-settings"
          >
            <Settings2 size={20} color={colors.ink} />
          </Pressable>
        </View>

        <EmptyState
          icon={<CalendarDays size={28} color={colors.inkFaint} />}
          title="No plans yet"
          caption="Nothing is scheduled for today. When you create a plan, its doses will appear here."
          action={
            <Button label="Open the calculator" tone="primary" onPress={() => router.push("/")} />
          }
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  headerText: {
    gap: spacing.xs,
  },
  gearButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
