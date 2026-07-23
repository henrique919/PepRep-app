import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Pencil, TestTubes } from "lucide-react-native";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import EmptyState from "@/src/components/ui/EmptyState";
import Screen from "@/src/components/ui/Screen";
import { summaryFromTxns } from "@/src/db/vialBalance";
import { fmt } from "@/src/engine";
import { vialConcentration } from "@/src/engine/inventory";
import { daysSince } from "@/src/engine/schedule";
import { selectTxnsForVial, useLedgerStore } from "@/src/store/ledger";
import { useVialsStore } from "@/src/store/vials";
import { useTheme } from "@/src/theme";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

export default function VialDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vial = useVialsStore((state) => state.vials.find((item) => item.id === id));
  const events = useLedgerStore((state) => state.events);
  const txns = useLedgerStore((state) => state.txns);

  const view = useMemo(() => {
    if (!vial) return null;
    const ledgerState = useLedgerStore.getState();
    const vialTxns = selectTxnsForVial(ledgerState, vial.id);
    const lastEvent = events.find(
      (event) =>
        event.vialId === vial.id &&
        event.status === "completed" &&
        event.voidedAt === undefined &&
        event.doseMcg !== undefined,
    );
    const summary = summaryFromTxns(vial.vialMg, vialTxns, lastEvent?.doseMcg);
    const concentration = vialConcentration(vial.vialMg, vial.diluentMl);
    return { summary, concentration, lastDoseMcg: lastEvent?.doseMcg ?? null };
    // `txns` invalidates when inventory ledger changes (body reads via getState).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional store invalidation
  }, [vial, events, txns]);

  if (!vial || !view) {
    return (
      <Screen>
        <EmptyState
          icon={<TestTubes size={28} color={colors.inkFaint} />}
          title="Vial not found"
          caption="It may have been removed."
          action={<Button label="Back to vials" onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  const nowIso = new Date().toISOString();
  const age = daysSince(vial.reconstitutedAtIso, nowIso);
  const remainingPct =
    vial.vialMg > 0 ? Math.max(0, Math.min(100, (view.summary.remainingMg / vial.vialMg) * 100)) : 0;

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
        <AppText variant="display" numberOfLines={1} style={styles.title}>
          {vial.name}
        </AppText>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={[styles.hero, { backgroundColor: colors.panel }]}>
          <AppText variant="overline" tone="onDarkSecondary">
            Remaining
          </AppText>
          <AppText variant="readout" tone="onDark" mono>
            {fmt(view.summary.remainingMg, 2)}
          </AppText>
          <AppText variant="caption" tone="onDarkSecondary">
            mg of {fmt(vial.vialMg)} mg · {age === 0 ? "today" : `${age}d since recon`}
          </AppText>
          <View style={[styles.barTrack, { backgroundColor: colors.panelRaised }]}>
            <View
              style={[
                styles.barFill,
                { width: `${remainingPct}%`, backgroundColor: colors.accent },
              ]}
            />
          </View>
        </Card>

        <View style={[styles.meta, { borderColor: colors.hairline, backgroundColor: colors.surface }]}>
          <MetaRow label="Water" value={`${fmt(vial.diluentMl)} mL`} />
          {view.concentration ? (
            <MetaRow
              label="Concentration"
              value={`${fmt(view.concentration.mgPerMl, 3)} mg/mL`}
            />
          ) : null}
          {view.lastDoseMcg !== null ? (
            <MetaRow label="Last logged dose" value={`${fmt(view.lastDoseMcg)} mcg`} />
          ) : null}
        </View>

        <Button
          label="Calculate with this vial"
          tone="primary"
          onPress={() =>
            router.push({
              pathname: "/(tabs)",
              params: {
                vialId: vial.id,
                compoundName: vial.name,
                vialMg: String(vial.vialMg),
                diluentMl: String(vial.diluentMl),
                syringeCapacity: String(vial.syringeCapacityUnits),
              },
            })
          }
          testID="calculate-with-vial"
        />
        <Button
          label="Edit vial details"
          tone="ghost"
          icon={<Pencil size={17} color={colors.ink} />}
          onPress={() =>
            router.push({
              pathname: "/vial-edit",
              params: { vialId: vial.id },
            })
          }
          testID="edit-vial"
        />
        <Button
          label="Log a dose from this vial"
          tone="ghost"
          onPress={() =>
            router.push({
              pathname: "/log-entry",
              params: {
                vialId: vial.id,
                compoundName: vial.name,
              },
            })
          }
          testID="log-from-vial"
        />
      </ScrollView>
    </Screen>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <AppText variant="caption" tone="secondary">
        {label}
      </AppText>
      <AppText variant="label" weight="semibold" mono>
        {value}
      </AppText>
    </View>
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
  title: {
    flex: 1,
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
  barTrack: {
    height: 8,
    borderRadius: radius.pill,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  barFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  meta: {
    borderWidth: hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
