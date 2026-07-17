import { useRouter } from "expo-router";
import { NotebookText, Plus } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import DoseRow from "@/src/components/domain/DoseRow";
import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import EmptyState from "@/src/components/ui/EmptyState";
import Hairline from "@/src/components/ui/Hairline";
import Screen from "@/src/components/ui/Screen";
import type { DoseEntry } from "@/src/db/models";
import { countInLastDays, dayKey, formatDayHeading } from "@/src/engine/schedule";
import { useDosesStore } from "@/src/store/doses";
import { colors, spacing } from "@/src/theme/tokens";

interface DayGroup {
  key: string;
  heading: string;
  entries: DoseEntry[];
}

export default function HistoryScreen() {
  const router = useRouter();
  const doses = useDosesStore((state) => state.doses);
  const removeDose = useDosesStore((state) => state.removeDose);

  const [armedId, setArmedId] = useState<string | null>(null);
  const disarmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (disarmTimer.current !== null) clearTimeout(disarmTimer.current);
    };
  }, []);

  const nowIso = new Date().toISOString();

  const groups: DayGroup[] = useMemo(() => {
    const byDay = new Map<string, DoseEntry[]>();
    for (const entry of doses) {
      const key = dayKey(entry.atIso);
      const bucket = byDay.get(key);
      if (bucket !== undefined) {
        bucket.push(entry);
      } else {
        byDay.set(key, [entry]);
      }
    }
    return [...byDay.entries()].map(([key, entries]) => ({
      key,
      heading: formatDayHeading(key, nowIso),
      entries,
    }));
  }, [doses, nowIso]);

  const weekCount = useMemo(
    () => countInLastDays(doses.map((dose) => dose.atIso), nowIso, 7),
    [doses, nowIso],
  );

  const handleDeletePress = (id: string) => {
    if (armedId === id) {
      setArmedId(null);
      removeDose(id).catch((error) => console.error("[history] Failed to delete dose", error));
      return;
    }
    setArmedId(id);
    if (disarmTimer.current !== null) clearTimeout(disarmTimer.current);
    disarmTimer.current = setTimeout(() => setArmedId(null), 3000);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <AppText variant="overline" tone="faint">
              Record of what you did
            </AppText>
            <AppText variant="title">History</AppText>
          </View>
          <Button
            label="Log"
            tone="accent"
            compact
            onPress={() => router.push("/log-entry")}
            icon={<Plus size={16} color={colors.onAccent} />}
            testID="open-log-entry"
          />
        </View>

        {doses.length > 0 && (
          <Card style={styles.statsCard}>
            <View style={styles.stat}>
              <AppText variant="display" mono weight="semibold">
                {String(weekCount)}
              </AppText>
              <AppText variant="caption" tone="secondary">
                doses in the last 7 days
              </AppText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <AppText variant="display" mono weight="semibold">
                {String(doses.length)}
              </AppText>
              <AppText variant="caption" tone="secondary">
                entries on record
              </AppText>
            </View>
          </Card>
        )}

        {doses.length === 0 ? (
          <EmptyState
            icon={<NotebookText size={28} color={colors.inkFaint} />}
            title="No doses recorded yet"
            caption="Every entry you log is kept on this device only — an auditable record of what you actually did."
            action={
              <Button label="Log a dose" tone="primary" onPress={() => router.push("/log-entry")} />
            }
          />
        ) : (
          groups.map((group) => (
            <View key={group.key} style={styles.group}>
              <AppText variant="overline" tone="faint" style={styles.groupHeading}>
                {group.heading}
              </AppText>
              <Card padded={false}>
                {group.entries.map((entry, index) => (
                  <View key={entry.id}>
                    {index > 0 && <Hairline />}
                    <DoseRow
                      entry={entry}
                      deleteArmed={armedId === entry.id}
                      onDeletePress={() => handleDeletePress(entry.id)}
                    />
                  </View>
                ))}
              </Card>
            </View>
          ))
        )}
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
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  statDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: colors.hairline,
    marginHorizontal: spacing.lg,
  },
  group: {
    gap: spacing.sm,
  },
  groupHeading: {
    paddingHorizontal: spacing.xs,
  },
});
