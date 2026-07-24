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
import Card from "@/src/components/ui/Card";
import Screen from "@/src/components/ui/Screen";
import { fmt } from "@/src/engine";
import { dayKey, occurrencesOnDay } from "@/src/engine/schedule";
import { usePlansStore } from "@/src/store/plans";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/**
 * Forward-looking calendar: which days the user's own plans fall on.
 * Derived live from schedule versions — the historical calendar under
 * History stays the record of what actually happened.
 */
export default function PlansCalendarScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const plans = usePlansStore((state) => state.plans);
  const todayKey = useMemo(() => dayKey(new Date().toISOString()), []);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<string>(todayKey);

  const cells = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const monthLabel = format(cursor, "MMMM yyyy");
  const selectedOccurrences = useMemo(
    () => occurrencesOnDay(plans, selectedDay),
    [plans, selectedDay],
  );

  return (
    <Screen>
      <View style={styles.chrome}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backButton}
          testID="plans-calendar-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.chromeText}>
          <AppText variant="display">Planned</AppText>
          <AppText variant="caption" tone="faint">
            Days your plans fall on — from your own schedule only
          </AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.monthRow}>
          <Pressable
            onPress={() => setCursor((current) => startOfMonth(subMonths(current, 1)))}
            style={styles.monthButton}
            testID="plans-calendar-prev"
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <ChevronLeft size={20} color={colors.ink} />
          </Pressable>
          <AppText variant="title">{monthLabel}</AppText>
          <Pressable
            onPress={() => setCursor((current) => startOfMonth(addMonths(current, 1)))}
            style={styles.monthButton}
            testID="plans-calendar-next"
            accessibilityRole="button"
            accessibilityLabel="Next month"
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
            const planned = occurrencesOnDay(plans, key);
            const isToday = key === todayKey;
            const isSelected = key === selectedDay;
            const cellLabel = [
              format(date, "MMMM d, yyyy"),
              planned.length > 0
                ? `${planned.length} planned dose${planned.length === 1 ? "" : "s"}`
                : "nothing planned",
            ].join(", ");
            return (
              <Pressable
                key={key}
                onPress={() => setSelectedDay(key)}
                style={[styles.cell, !inMonth && styles.cellMuted]}
                testID={`plans-calendar-day-${key}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                aria-selected={isSelected}
                accessibilityLabel={cellLabel}
              >
                <View
                  style={[
                    styles.dayBubble,
                    isToday && styles.dayBubbleToday,
                    isSelected && styles.dayBubbleSelected,
                  ]}
                >
                  <AppText
                    variant="label"
                    mono
                    weight={planned.length > 0 ? "semibold" : "medium"}
                    tone={isSelected ? "onSolid" : inMonth ? "ink" : "faint"}
                  >
                    {format(date, "d")}
                  </AppText>
                </View>
                <View style={styles.dots}>
                  {planned.length > 0 && <View style={[styles.dot, styles.dotPlanned]} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.dotPlanned]} />
            <AppText variant="caption" tone="faint">
              planned dose day
            </AppText>
          </View>
        </View>

        <View style={styles.daySection}>
          <AppText variant="overline" tone="secondary">
            {format(new Date(`${selectedDay}T00:00:00`), "EEEE d MMMM")}
          </AppText>
          {selectedOccurrences.length === 0 ? (
            <AppText variant="caption" tone="faint">
              Nothing planned on this day.
            </AppText>
          ) : (
            <Card padded={false}>
              {selectedOccurrences.map((occurrence, index) => (
                <View
                  key={occurrence.occurrenceKey}
                  style={[
                    styles.occurrenceRow,
                    index < selectedOccurrences.length - 1 && {
                      borderBottomWidth: hairlineWidth,
                      borderBottomColor: colors.hairline,
                    },
                  ]}
                >
                  <AppText variant="label" mono tone="secondary" style={styles.occurrenceTime}>
                    {occurrence.timeLocal}
                  </AppText>
                  <View style={styles.occurrenceText}>
                    <AppText variant="body" weight="medium" numberOfLines={1}>
                      {occurrence.compoundName}
                    </AppText>
                    <AppText variant="caption" mono tone="faint">
                      {fmt(occurrence.version.doseValue)} {occurrence.version.doseUnit}
                    </AppText>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </View>
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
      gap: 2,
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
    dayBubble: {
      width: 34,
      height: 34,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    dayBubbleToday: {
      borderWidth: 1.5,
      borderColor: colors.ink,
    },
    dayBubbleSelected: {
      backgroundColor: colors.solid,
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
    dotPlanned: {
      backgroundColor: colors.accent,
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
    daySection: {
      gap: spacing.sm,
      paddingTop: spacing.sm,
    },
    occurrenceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      minHeight: 52,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    occurrenceTime: {
      width: 52,
    },
    occurrenceText: {
      flex: 1,
      gap: 2,
    },
  });
}
