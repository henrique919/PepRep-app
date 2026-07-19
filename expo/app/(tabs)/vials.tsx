import { useRouter, type Href } from "expo-router";
import { Plus, RotateCcw, TestTubes } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import VialCard from "@/src/components/domain/VialCard";
import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import EmptyState from "@/src/components/ui/EmptyState";
import FilterChips from "@/src/components/ui/FilterChips";
import Screen from "@/src/components/ui/Screen";
import Toast from "@/src/components/ui/Toast";
import { withAccessibleTabScreen } from "@/src/components/ui/AccessibleTabScreen";
import type { Vial } from "@/src/db/models";
import { summaryFromTxns } from "@/src/db/vialBalance";
import { vialConcentration } from "@/src/engine/inventory";
import type { VialSummary, ConcentrationInfo } from "@/src/engine/inventory";
import { isLowStock } from "@/src/engine/vialWarnings";
import { selectTxnsForVial, useLedgerStore } from "@/src/store/ledger";
import { useVialsStore } from "@/src/store/vials";
import { useTheme } from "@/src/theme";
import { spacing } from "@/src/theme/tokens";

interface VialView {
  vial: Vial;
  summary: VialSummary;
  concentration: ConcentrationInfo | null;
  lastDoseMcg: number | null;
}

type VialFilter = "all" | "active" | "low";

function VialsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const allVials = useVialsStore((state) => state.vials);
  const vials = useMemo(
    () => allVials.filter((vial) => vial.archivedAtIso === null),
    [allVials],
  );
  const archivedVials = useMemo(
    () => allVials.filter((vial) => vial.archivedAtIso !== null),
    [allVials],
  );
  const updateVial = useVialsStore((state) => state.updateVial);
  const txns = useLedgerStore((state) => state.txns);
  const events = useLedgerStore((state) => state.events);

  const [armedId, setArmedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<VialFilter>("all");
  const [toast, setToast] = useState<{
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const disarmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (disarmTimer.current !== null) clearTimeout(disarmTimer.current);
    };
  }, []);

  const nowIso = new Date().toISOString();

  const views: VialView[] = useMemo(() => {
    const ledgerState = useLedgerStore.getState();
    return vials.map((vial) => {
      const vialTxns = selectTxnsForVial(ledgerState, vial.id);
      const lastEvent = events.find(
        (event) =>
          event.vialId === vial.id &&
          event.status === "completed" &&
          event.voidedAt === undefined &&
          event.doseMcg !== undefined,
      );
      const lastDoseMcg = lastEvent?.doseMcg ?? null;
      return {
        vial,
        summary: summaryFromTxns(vial.vialMg, vialTxns, lastDoseMcg ?? undefined),
        concentration: vialConcentration(vial.vialMg, vial.diluentMl),
        lastDoseMcg,
      };
    });
    // `txns` invalidates when inventory ledger changes (body reads via getState).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional store invalidation
  }, [vials, txns, events]);

  const filtered = useMemo(() => {
    if (filter === "low") {
      return views.filter((view) =>
        isLowStock(view.summary.remainingPercent, view.vial.lowStockThresholdPercent),
      );
    }
    if (filter === "active") {
      return views.filter(
        (view) => !isLowStock(view.summary.remainingPercent, view.vial.lowStockThresholdPercent),
      );
    }
    return views;
  }, [views, filter]);

  // Archive rather than delete — keeps the vial available for History rows
  // that still reference it, matching PepRep's "nothing is truly deleted" record-keeping.
  const handleArchivePress = (id: string) => {
    if (armedId === id) {
      setArmedId(null);
      const vial = allVials.find((candidate) => candidate.id === id);
      updateVial(id, { archivedAtIso: new Date().toISOString() })
        .then(() =>
          setToast({
            message: `Archived ${vial?.name ?? "vial"}`,
            actionLabel: "Undo",
            onAction: () => {
              updateVial(id, { archivedAtIso: null })
                .then(() => setToast({ message: `Restored ${vial?.name ?? "vial"}` }))
                .catch((error) => console.error("[vials] Failed to restore vial", error));
            },
          }),
        )
        .catch((error) => console.error("[vials] Failed to archive vial", error));
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
            <AppText variant="overline" tone="secondary">
              What you have on hand
            </AppText>
            <AppText variant="display">Vials</AppText>
            <AppText variant="caption" tone="secondary">
              {views.length} active
            </AppText>
          </View>
          <Button
            label="New"
            tone="primary"
            compact
            onPress={() => router.push("/vial-new")}
            icon={<Plus size={16} color={colors.onSolid} />}
            testID="open-vial-new"
          />
        </View>

        {views.length > 0 ? (
          <FilterChips<VialFilter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "low", label: "Low" },
            ]}
            testID="vial-filters"
          />
        ) : null}

        {views.length === 0 ? (
          <EmptyState
            icon={<TestTubes size={28} color={colors.inkFaint} />}
            title="No vials tracked yet"
            caption="Add a vial after you reconstitute it. Doses you log against it keep its remaining amount exact."
            action={
              <Button label="Add a vial" tone="primary" onPress={() => router.push("/vial-new")} />
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<TestTubes size={28} color={colors.inkFaint} />}
            title="Nothing in this filter"
            caption="Try All or Active — Low shows vials at or under each vial’s threshold (default 25%)."
            action={<Button label="Show all" tone="primary" onPress={() => setFilter("all")} />}
          />
        ) : (
          filtered.map((view) => (
            <Pressable
              key={view.vial.id}
              onPress={() => router.push(`/vial/${view.vial.id}` as Href)}
              accessibilityRole="button"
              accessibilityLabel={`Open vial ${view.vial.name}`}
            >
              <VialCard
                vial={view.vial}
                summary={view.summary}
                concentration={view.concentration}
                lastDoseMcg={view.lastDoseMcg}
                nowIso={nowIso}
                archiveArmed={armedId === view.vial.id}
                onArchivePress={() => handleArchivePress(view.vial.id)}
              />
            </Pressable>
          ))
        )}

        {archivedVials.length > 0 ? (
          <View style={styles.archivedSection}>
            <AppText variant="overline" tone="secondary">Archived vials</AppText>
            {archivedVials.map((vial) => (
              <View key={vial.id} style={[styles.archivedRow, { backgroundColor: colors.surface }]}>
                <View style={styles.archivedText}>
                  <AppText variant="label" weight="semibold">{vial.name}</AppText>
                  <AppText variant="caption" tone="secondary">
                    {vial.vialMg} mg · archived, retained in History
                  </AppText>
                </View>
                <Button
                  label="Restore"
                  tone="ghost"
                  compact
                  icon={<RotateCcw size={15} color={colors.ink} />}
                  onPress={() => {
                    updateVial(vial.id, { archivedAtIso: null })
                      .then(() => setToast({ message: `Restored ${vial.name}` }))
                      .catch((error) => console.error("[vials] Failed to restore vial", error));
                  }}
                  testID={`restore-vial-${vial.id}`}
                />
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
      {toast !== null ? (
        <Toast
          message={toast.message}
          actionLabel={toast.actionLabel}
          onAction={toast.onAction}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </Screen>
  );
}

export default withAccessibleTabScreen(VialsScreen, (pathname) => pathname === "/vials");

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
    flex: 1,
  },
  archivedSection: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  archivedRow: {
    minHeight: 64,
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  archivedText: {
    flex: 1,
    gap: 2,
  },
});
