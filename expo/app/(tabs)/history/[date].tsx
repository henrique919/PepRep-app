import { format, parseISO } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import Card from "@/src/components/ui/Card";
import Hairline from "@/src/components/ui/Hairline";
import Screen from "@/src/components/ui/Screen";
import { fmt } from "@/src/engine";
import {
  compareIsoDesc,
  formatClock,
  occurrencesOnDay,
} from "@/src/engine/schedule";
import { eventsOnDay, siteLabel, statusLabel } from "@/src/history/display";
import { useLedgerStore } from "@/src/store/ledger";
import { usePlansStore } from "@/src/store/plans";
import { useVialsStore } from "@/src/store/vials";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

function stringParam(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") return value[0];
  return "";
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export default function HistoryDayScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const date = stringParam(params.date);

  const events = useLedgerStore((state) => state.events);
  const plans = usePlansStore((state) => state.plans);
  const vials = useVialsStore((state) => state.vials);

  const valid = DATE_KEY.test(date);

  const dayEvents = useMemo(() => {
    if (!valid) return [];
    return eventsOnDay(events, date).sort((a, b) => compareIsoDesc(a.occurredAt, b.occurredAt));
  }, [events, date, valid]);

  /** Schedule slots from the version active ON THIS DATE — not the newest. */
  const scheduled = useMemo(() => {
    if (!valid) return [];
    return occurrencesOnDay(plans, date);
  }, [plans, date, valid]);

  const heading = valid ? format(parseISO(date), "EEEE d MMMM yyyy") : "Day";

  const vialName = (vialId: string | undefined): string | null => {
    if (vialId === undefined) return null;
    return vials.find((vial) => vial.id === vialId)?.name ?? vialId;
  };

  return (
    <Screen>
      <View style={styles.chrome}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backButton}
          testID="history-day-back"
        >
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.chromeText}>
          <AppText variant="heading" numberOfLines={1}>
            {heading}
          </AppText>
          <AppText variant="caption" mono tone="faint">
            {valid ? date : "Invalid date"}
          </AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <AppText variant="overline" tone="faint">
            Events that day
          </AppText>
          {dayEvents.length === 0 ? (
            <Card>
              <AppText variant="label" tone="secondary">
                No DoseEvents on this day.
              </AppText>
            </Card>
          ) : (
            <Card padded={false}>
              {dayEvents.map((event, index) => {
                const site = siteLabel(event.siteId);
                const vial = vialName(event.vialId);
                const voided = event.voidedAt !== undefined;
                return (
                  <View key={event.id}>
                    {index > 0 && <Hairline />}
                    <Pressable
                      onPress={() => router.push(`/history/event/${event.id}`)}
                      style={styles.row}
                      testID={`day-event-${event.id}`}
                    >
                      <AppText variant="label" mono tone="faint" style={styles.time}>
                        {formatClock(event.occurredAt)}
                      </AppText>
                      <View style={styles.body}>
                        <AppText variant="body" weight="semibold">
                          {event.compoundName}
                        </AppText>
                        <AppText variant="label" mono tone="secondary">
                          {fmt(event.doseValue)} {event.doseUnit}
                          {voided ? " · voided" : ` · ${statusLabel(event.status)}`}
                          {site !== null ? ` · ${site}` : ""}
                          {vial !== null ? ` · ${vial}` : ""}
                        </AppText>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <AppText variant="overline" tone="faint">
            Scheduled that day (version active then)
          </AppText>
          {scheduled.length === 0 ? (
            <Card>
              <AppText variant="label" tone="secondary">
                No plan occurrences were due on this date.
              </AppText>
            </Card>
          ) : (
            <Card padded={false}>
              {scheduled.map((occurrence, index) => (
                <View key={occurrence.occurrenceKey}>
                  {index > 0 && <Hairline />}
                  <View style={styles.row}>
                    <AppText variant="label" mono tone="faint" style={styles.time}>
                      {occurrence.timeLocal}
                    </AppText>
                    <View style={styles.body}>
                      <AppText variant="body" weight="semibold">
                        {occurrence.compoundName}
                      </AppText>
                      <AppText variant="label" mono tone="secondary">
                        {fmt(occurrence.version.doseValue)} {occurrence.version.doseUnit}
                        {" · "}
                        {occurrence.version.name}
                      </AppText>
                    </View>
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
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  time: {
    marginTop: 3,
    width: 44,
  },
  body: {
    flex: 1,
    gap: 2,
  },
});
}
