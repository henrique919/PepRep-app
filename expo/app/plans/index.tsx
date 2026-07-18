import { useRouter } from "expo-router";
import { Archive, CalendarDays, ChevronLeft, Plus } from "lucide-react-native";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useShallow } from "zustand/react/shallow";

import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import EmptyState from "@/src/components/ui/EmptyState";
import Screen from "@/src/components/ui/Screen";
import type { Plan, ScheduleVersion } from "@/src/db/types";
import { fmt } from "@/src/engine";
import { dayKey, versionActiveOn } from "@/src/engine/schedule";
import { selectActivePlans, usePlansStore } from "@/src/store/plans";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function activeVersion(plan: Plan): ScheduleVersion | undefined {
  return versionActiveOn(plan, dayKey(new Date().toISOString()));
}

function daysLabel(days: number[]): string {
  if (days.length === 0) return "No days set";
  return days.map((day) => DAY_LABELS[day] ?? String(day)).join(" · ");
}

export default function PlansScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const plans = usePlansStore(useShallow(selectActivePlans));
  const archivePlan = usePlansStore((state) => state.archivePlan);

  const rows = useMemo(
    () =>
      plans.map((plan) => ({
        plan,
        version: activeVersion(plan),
      })),
    [plans],
  );

  return (
    <Screen>
      <View style={styles.chrome}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backButton}
          testID="plans-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.chromeText}>
          <AppText variant="heading">Plans</AppText>
        </View>
        <Button
          label="New"
          tone="accent"
          compact
          onPress={() => router.push("/plans/new")}
          icon={<Plus size={16} color={colors.onAccent} />}
          testID="open-plan-new"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {rows.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={28} color={colors.inkFaint} />}
            title="No plans yet"
            caption="Create a plan with the days and times you choose. Nothing is suggested."
            action={
              <Button
                label="Create a plan"
                tone="primary"
                onPress={() => router.push("/plans/new")}
              />
            }
          />
        ) : (
          rows.map(({ plan, version }) => (
            <Card key={plan.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardText}>
                  <AppText variant="heading" numberOfLines={1}>
                    {version?.name ?? plan.compoundName}
                  </AppText>
                  <AppText variant="label" mono tone="secondary">
                    {plan.compoundName}
                    {version !== undefined
                      ? ` · ${fmt(version.doseValue)} ${version.doseUnit}`
                      : ""}
                  </AppText>
                  {version !== undefined && (
                    <>
                      <AppText variant="caption" tone="faint">
                        {daysLabel(version.daysOfWeek)}
                      </AppText>
                      <AppText variant="caption" mono tone="faint">
                        {version.timesLocal.join(" · ") || "No times set"}
                      </AppText>
                    </>
                  )}
                </View>
                <Pressable
                  onPress={() => {
                    archivePlan(plan.id).catch((error) =>
                      console.error("[plans] Failed to archive", error),
                    );
                  }}
                  hitSlop={8}
                  style={styles.archiveButton}
                  testID={`archive-plan-${plan.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Archive plan ${plan.compoundName}`}
                >
                  <Archive size={16} color={colors.inkFaint} />
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}



function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
  chrome: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chromeText: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  archiveButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
}
