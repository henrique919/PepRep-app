import { format } from "date-fns";
import { useRouter } from "expo-router";
import { CalendarDays, Settings2 } from "lucide-react-native";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useShallow } from "zustand/react/shallow";

import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import EmptyState from "@/src/components/ui/EmptyState";
import Screen from "@/src/components/ui/Screen";
import { occurrenceKey } from "@/src/db/occurrence";
import type { DoseEvent, Plan, ScheduleVersion } from "@/src/db/types";
import { fmt } from "@/src/engine";
import { dayKey, dueOnDay, versionActiveOn } from "@/src/engine/schedule";
import { selectEventForOccurrence, useLedgerStore } from "@/src/store/ledger";
import { selectActivePlans, usePlansStore } from "@/src/store/plans";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

interface DueOccurrence {
  plan: Plan;
  version: ScheduleVersion;
  timeLocal: string;
  key: string;
  event: DoseEvent | undefined;
}

export default function TodayScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const now = new Date();
  const today = dayKey(now.toISOString());

  const plans = usePlansStore(useShallow(selectActivePlans));
  const events = useLedgerStore((state) => state.events);
  const skipOccurrence = useLedgerStore((state) => state.skipOccurrence);
  const unlogEvent = useLedgerStore((state) => state.unlogEvent);

  const due: DueOccurrence[] = useMemo(() => {
    const ledgerState = useLedgerStore.getState();
    const rows: DueOccurrence[] = [];
    for (const plan of plans) {
      if (!dueOnDay(plan, today)) continue;
      const version = versionActiveOn(plan, today);
      if (version === undefined) continue;
      for (const timeLocal of version.timesLocal) {
        const key = occurrenceKey(today, timeLocal, plan.id);
        rows.push({
          plan,
          version,
          timeLocal,
          key,
          event: selectEventForOccurrence(ledgerState, key),
        });
      }
    }
    return rows.sort((a, b) => a.timeLocal.localeCompare(b.timeLocal));
  }, [plans, today, events]);

  const openLog = (row: DueOccurrence) => {
    router.push({
      pathname: "/log-plan",
      params: {
        planId: row.plan.id,
        scheduleVersionId: row.version.id,
        occurrenceKey: row.key,
        compoundName: row.plan.compoundName,
        planName: row.version.name,
        doseValue: String(row.version.doseValue),
        doseUnit: row.version.doseUnit,
        timeLocal: row.timeLocal,
        vialId: row.version.vialId ?? "",
      },
    });
  };

  const handleSkip = (row: DueOccurrence) => {
    skipOccurrence({
      planId: row.plan.id,
      scheduleVersionId: row.version.id,
      occurrenceKey: row.key,
      compoundName: row.plan.compoundName,
      doseValue: row.version.doseValue,
      doseUnit: row.version.doseUnit,
    }).catch((error) => console.error("[today] Failed to skip", error));
  };

  const handleUnlog = (eventId: string) => {
    unlogEvent(eventId).catch((error) => console.error("[today] Failed to un-log", error));
  };

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
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push("/plans")}
              hitSlop={8}
              style={styles.gearButton}
              testID="open-plans"
            >
              <AppText variant="caption" weight="semibold">
                Plans
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => router.push("/settings")}
              hitSlop={8}
              style={styles.gearButton}
              testID="open-settings"
            >
              <Settings2 size={20} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        {plans.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={28} color={colors.inkFaint} />}
            title="No plans yet"
            caption="Nothing is scheduled for today. When you create a plan, its doses will appear here."
            action={
              <Button
                label="Create a plan"
                tone="primary"
                onPress={() => router.push("/plans/new")}
              />
            }
          />
        ) : due.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={28} color={colors.inkFaint} />}
            title="Nothing due today"
            caption="Your plans do not include today’s weekday. Open Plans to review the schedule."
            action={
              <Button label="Open plans" tone="primary" onPress={() => router.push("/plans")} />
            }
          />
        ) : (
          due.map((row) => {
            const event = row.event;
            const isCompleted = event?.status === "completed" && event.voidedAt === undefined;
            const isSkipped = event?.status === "skipped" && event.voidedAt === undefined;

            return (
              <Card key={row.key} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardText}>
                    <AppText variant="overline" mono tone="faint">
                      {row.timeLocal}
                    </AppText>
                    <AppText variant="heading" numberOfLines={1}>
                      {row.plan.compoundName}
                    </AppText>
                    <AppText variant="label" tone="secondary">
                      {row.version.name}
                    </AppText>
                    <AppText variant="label" mono weight="semibold">
                      {fmt(row.version.doseValue)} {row.version.doseUnit}
                    </AppText>
                  </View>
                  {isCompleted && (
                    <View style={styles.statusPill}>
                      <AppText variant="caption" weight="semibold" tone="secondary">
                        Logged
                      </AppText>
                    </View>
                  )}
                  {isSkipped && (
                    <View style={styles.statusPill}>
                      <AppText variant="caption" weight="semibold" tone="faint">
                        Skipped
                      </AppText>
                    </View>
                  )}
                </View>

                {isCompleted && event !== undefined ? (
                  <Button
                    label="Un-log"
                    tone="ghost"
                    compact
                    onPress={() => handleUnlog(event.id)}
                    testID={`unlog-${row.key}`}
                  />
                ) : isSkipped ? (
                  <AppText variant="caption" tone="faint">
                    Marked skipped for today
                  </AppText>
                ) : (
                  <View style={styles.actions}>
                    <Button
                      label="Log"
                      tone="accent"
                      compact
                      onPress={() => openLog(row)}
                      testID={`log-${row.key}`}
                    />
                    <Button
                      label="Skip"
                      tone="ghost"
                      compact
                      onPress={() => handleSkip(row)}
                      testID={`skip-${row.key}`}
                    />
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}



function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
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
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  gearButton: {
    minWidth: 44,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    gap: spacing.md,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
    borderWidth: hairlineWidth,
    borderColor: colors.hairline,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
}
