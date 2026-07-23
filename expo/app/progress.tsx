import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import Callout from "@/src/components/ui/Callout";
import Card from "@/src/components/ui/Card";
import Screen from "@/src/components/ui/Screen";
import { fmt } from "@/src/engine";
import { compoundTotals, last7DayAdherence } from "@/src/history/progressStats";
import { useLedgerStore } from "@/src/store/ledger";
import { useTheme } from "@/src/theme";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

export default function ProgressScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const events = useLedgerStore((state) => state.events);

  const stats = useMemo(() => {
    const active = events.filter((event) => event.voidedAt === undefined);
    const logged = active.filter((event) => event.status === "completed").length;
    const skipped = active.filter((event) => event.status === "skipped").length;
    const missed = active.filter((event) => event.status === "missed").length;
    const total = logged + skipped + missed;
    const rate = total === 0 ? 0 : Math.round((logged / total) * 100);
    return { logged, skipped, missed, total, rate };
  }, [events]);

  const nowIso = useMemo(() => new Date().toISOString(), []);
  const week = useMemo(() => last7DayAdherence(events, nowIso), [events, nowIso]);
  const totals = useMemo(() => compoundTotals(events), [events]);
  const weekMax = Math.max(1, ...week.map((day) => day.logged + day.skipped + day.missed));

  return (
    <Screen>
      <View style={styles.chrome}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="display">Progress</AppText>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Callout tone="info">
          Recorded counts only — PepRep does not evaluate or score your routine.
        </Callout>

        <Card style={[styles.hero, { backgroundColor: colors.panel }]}>
          <AppText variant="overline" tone="onDarkSecondary">
            Logged share
          </AppText>
          <AppText variant="readout" tone="onDark" mono>
            {stats.rate}%
          </AppText>
          <AppText variant="caption" tone="onDarkSecondary">
            Of {stats.total} recorded schedule outcomes
          </AppText>
        </Card>

        <View style={styles.grid}>
          {(
            [
              ["Logged", stats.logged, colors.success],
              ["Skipped", stats.skipped, colors.inkSecondary],
              ["Missed", stats.missed, colors.dangerInk],
            ] as const
          ).map(([label, value, ink]) => (
            <View
              key={label}
              style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
            >
              <AppText variant="overline" tone="secondary">
                {label}
              </AppText>
              <AppText variant="title" mono style={{ color: ink }}>
                {value}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <AppText variant="overline" tone="secondary">
            Last 7 days
          </AppText>
          <Card style={styles.weekCard}>
            <View style={styles.weekGrid}>
              {week.map((day) => {
                const dayTotal = day.logged + day.skipped + day.missed;
                const barColor =
                  day.missed > 0
                    ? colors.dangerInk
                    : day.skipped > 0
                      ? colors.inkSecondary
                      : colors.success;
                return (
                  <View key={day.dayKey} style={styles.weekDay}>
                    <View style={styles.weekBarTrack}>
                      {dayTotal > 0 ? (
                        <View
                          style={[
                            styles.weekBarFill,
                            {
                              height: `${Math.max(8, (dayTotal / weekMax) * 100)}%`,
                              backgroundColor: barColor,
                            },
                          ]}
                        />
                      ) : null}
                    </View>
                    <AppText variant="caption" tone="faint" mono>
                      {day.weekday}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </Card>
        </View>

        {totals.length > 0 && (
          <View style={styles.section}>
            <AppText variant="overline" tone="secondary">
              By compound — all time
            </AppText>
            <View
              style={[
                styles.compoundCard,
                { borderColor: colors.hairline, backgroundColor: colors.surface },
              ]}
            >
              {totals.map((total, index) => (
                <View
                  key={total.compoundName}
                  style={[
                    styles.compoundRow,
                    index < totals.length - 1 && {
                      borderBottomWidth: hairlineWidth,
                      borderBottomColor: colors.hairline,
                    },
                  ]}
                >
                  <AppText variant="body" weight="medium" style={styles.compoundName}>
                    {total.compoundName}
                  </AppText>
                  <AppText variant="label" mono tone="secondary">
                    {total.logged} logged
                    {total.totalMcg !== null ? ` · ${fmt(total.totalMcg)} mcg total` : ""}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chrome: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  hero: {
    padding: spacing.xl,
    gap: spacing.sm,
    borderRadius: radius.lg,
  },
  grid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  stat: {
    flex: 1,
    borderWidth: hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  weekCard: {
    padding: spacing.lg,
  },
  weekGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 96,
  },
  weekDay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
    gap: spacing.xs,
  },
  weekBarTrack: {
    flex: 1,
    width: 16,
    justifyContent: "flex-end",
  },
  weekBarFill: {
    width: "100%",
    borderRadius: radius.pill,
    minHeight: 4,
  },
  compoundCard: {
    borderRadius: radius.lg,
    borderWidth: hairlineWidth,
    overflow: "hidden",
  },
  compoundRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  compoundName: {
    flex: 1,
  },
});
