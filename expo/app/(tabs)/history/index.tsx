import { useRouter } from "expo-router";
import { CalendarDays, NotebookText, Plus } from "lucide-react-native";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import EmptyState from "@/src/components/ui/EmptyState";
import Hairline from "@/src/components/ui/Hairline";
import Screen from "@/src/components/ui/Screen";
import type { DoseEvent } from "@/src/db/types";
import { fmt } from "@/src/engine";
import { compareIsoDesc, formatClock, formatDayHeading } from "@/src/engine/schedule";
import { eventDayKey, siteLabel, statusLabel } from "@/src/history/display";
import { useLedgerStore } from "@/src/store/ledger";
import { useVialsStore } from "@/src/store/vials";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

interface DayGroup {
  key: string;
  heading: string;
  events: DoseEvent[];
}

export default function HistoryTimelineScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const events = useLedgerStore((state) => state.events);
  const vials = useVialsStore((state) => state.vials);

  const nowIso = new Date().toISOString();

  const sorted = useMemo(
    () => [...events].sort((a, b) => compareIsoDesc(a.occurredAt, b.occurredAt)),
    [events],
  );

  const groups: DayGroup[] = useMemo(() => {
    const byDay = new Map<string, DoseEvent[]>();
    for (const event of sorted) {
      const key = eventDayKey(event);
      const bucket = byDay.get(key);
      if (bucket !== undefined) bucket.push(event);
      else byDay.set(key, [event]);
    }
    return [...byDay.entries()].map(([key, dayEvents]) => ({
      key,
      heading: formatDayHeading(key, nowIso),
      events: dayEvents,
    }));
  }, [sorted, nowIso]);

  const vialName = (vialId: string | undefined): string | null => {
    if (vialId === undefined) return null;
    return vials.find((vial) => vial.id === vialId)?.name ?? vialId;
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <AppText variant="overline" tone="faint">
              DoseEvents · newest first
            </AppText>
            <AppText variant="display">History</AppText>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push("/history/calendar")}
              hitSlop={8}
              style={styles.iconButton}
              testID="open-history-calendar"
            >
              <CalendarDays size={18} color={colors.ink} />
            </Pressable>
            <Button
              label="Log"
              tone="accent"
              compact
              onPress={() => router.push("/log-entry")}
              icon={<Plus size={16} color={colors.onAccent} />}
              testID="open-log-entry"
            />
          </View>
        </View>

        {sorted.length === 0 ? (
          <EmptyState
            icon={<NotebookText size={28} color={colors.inkFaint} />}
            title="No events yet"
            caption="Logged, skipped, and missed doses appear here. Events are never deleted from storage."
            action={
              <Button label="Log a dose" tone="primary" onPress={() => router.push("/log-entry")} />
            }
          />
        ) : (
          groups.map((group) => (
            <View key={group.key} style={styles.group}>
              <Pressable onPress={() => router.push(`/history/${group.key}`)}>
                <AppText variant="overline" tone="faint" style={styles.groupHeading}>
                  {group.heading}
                </AppText>
              </Pressable>
              <Card padded={false}>
                {group.events.map((event, index) => {
                  const site = siteLabel(event.siteId);
                  const vial = vialName(event.vialId);
                  const voided = event.voidedAt !== undefined;
                  return (
                    <View key={event.id}>
                      {index > 0 && <Hairline />}
                      <Pressable
                        onPress={() => router.push(`/history/event/${event.id}`)}
                        style={[styles.row, voided && styles.rowVoided]}
                        testID={`history-event-${event.id}`}
                      >
                        <AppText variant="label" mono tone="faint" style={styles.time}>
                          {formatClock(event.occurredAt)}
                        </AppText>
                        <View style={styles.body}>
                          <View style={styles.titleRow}>
                            <AppText variant="body" weight="semibold" numberOfLines={1} style={styles.flex}>
                              {event.compoundName}
                            </AppText>
                            {voided ? (
                              <View style={styles.voidBadge}>
                                <AppText variant="caption" weight="semibold" tone="danger">
                                  voided
                                </AppText>
                              </View>
                            ) : (
                              <AppText variant="caption" tone="faint">
                                {statusLabel(event.status)}
                              </AppText>
                            )}
                          </View>
                          <View style={styles.metaRow}>
                            <AppText variant="label" mono tone="secondary">
                              {fmt(event.doseValue)} {event.doseUnit}
                            </AppText>
                            {site !== null && (
                              <AppText variant="caption" tone="faint">
                                · {site}
                              </AppText>
                            )}
                            {vial !== null && (
                              <AppText variant="caption" tone="faint">
                                · {vial}
                              </AppText>
                            )}
                          </View>
                        </View>
                      </Pressable>
                    </View>
                  );
                })}
              </Card>
            </View>
          ))
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
    gap: spacing.sm,
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
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: hairlineWidth,
    borderColor: colors.hairline,
  },
  group: {
    gap: spacing.sm,
  },
  groupHeading: {
    paddingHorizontal: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowVoided: {
    opacity: 0.72,
  },
  time: {
    marginTop: 3,
    width: 44,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs,
  },
  voidBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerBg,
  },
});
}
