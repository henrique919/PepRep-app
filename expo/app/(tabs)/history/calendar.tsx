import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import Screen from "@/src/components/ui/Screen";
import { dayMarkers } from "@/src/history/display";
import { useLedgerStore } from "@/src/store/ledger";
import { colors, hairlineWidth, radius, spacing } from "@/src/theme/tokens";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export default function HistoryCalendarScreen() {
  const router = useRouter();
  const events = useLedgerStore((state) => state.events);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const cells = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const monthLabel = format(cursor, "MMMM yyyy");

  return (
    <Screen>
      <View style={styles.chrome}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backButton}
          testID="calendar-back"
        >
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="heading" style={styles.chromeTitle}>
          Calendar
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.monthRow}>
          <Pressable
            onPress={() => setCursor((current) => startOfMonth(subMonths(current, 1)))}
            style={styles.monthButton}
            testID="calendar-prev"
          >
            <ChevronLeft size={20} color={colors.ink} />
          </Pressable>
          <AppText variant="heading">{monthLabel}</AppText>
          <Pressable
            onPress={() => setCursor((current) => startOfMonth(addMonths(current, 1)))}
            style={styles.monthButton}
            testID="calendar-next"
          >
            <ChevronRight size={20} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((label) => (
            <AppText key={label} variant="caption" tone="faint" style={styles.weekday}>
              {label}
            </AppText>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((date) => {
            const key = format(date, "yyyy-MM-dd");
            const inMonth = isSameMonth(date, cursor);
            const markers = dayMarkers(events, key);
            const hasMarker = markers.completed || markers.skipped || markers.missed;
            return (
              <Pressable
                key={key}
                onPress={() => router.push(`/history/${key}`)}
                style={[styles.cell, !inMonth && styles.cellMuted]}
                testID={`calendar-day-${key}`}
              >
                <AppText
                  variant="label"
                  mono
                  weight={hasMarker ? "semibold" : "medium"}
                  tone={inMonth ? "ink" : "faint"}
                >
                  {format(date, "d")}
                </AppText>
                <View style={styles.dots}>
                  {markers.completed && <View style={[styles.dot, styles.dotCompleted]} />}
                  {markers.skipped && <View style={[styles.dot, styles.dotSkipped]} />}
                  {markers.missed && <View style={[styles.dot, styles.dotMissed]} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.dotCompleted]} />
            <AppText variant="caption" tone="faint">
              completed
            </AppText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.dotSkipped]} />
            <AppText variant="caption" tone="faint">
              skipped
            </AppText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.dotMissed]} />
            <AppText variant="caption" tone="faint">
              missed
            </AppText>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  chromeTitle: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayRow: {
    flexDirection: "row",
  },
  weekday: {
    flex: 1,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: spacing.xs,
  },
  cellMuted: {
    opacity: 0.55,
  },
  dots: {
    flexDirection: "row",
    gap: 3,
    minHeight: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
  },
  dotCompleted: {
    backgroundColor: colors.accent,
  },
  dotSkipped: {
    backgroundColor: colors.inkSecondary,
  },
  dotMissed: {
    backgroundColor: colors.dangerInk,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
