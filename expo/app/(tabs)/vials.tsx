import { useRouter } from "expo-router";
import { Plus, TestTubes } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useShallow } from "zustand/react/shallow";

import VialCard from "@/src/components/domain/VialCard";
import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import EmptyState from "@/src/components/ui/EmptyState";
import Screen from "@/src/components/ui/Screen";
import type { Vial } from "@/src/db/models";
import { summaryFromTxns } from "@/src/db/vialBalance";
import { vialConcentration } from "@/src/engine/inventory";
import type { VialSummary, ConcentrationInfo } from "@/src/engine/inventory";
import { selectTxnsForVial, useLedgerStore } from "@/src/store/ledger";
import { selectActiveVials, useVialsStore } from "@/src/store/vials";
import { colors, spacing } from "@/src/theme/tokens";

interface VialView {
  vial: Vial;
  summary: VialSummary;
  concentration: ConcentrationInfo | null;
  lastDoseMcg: number | null;
}

export default function VialsScreen() {
  const router = useRouter();
  const vials = useVialsStore(useShallow(selectActiveVials));
  const removeVial = useVialsStore((state) => state.removeVial);
  const txns = useLedgerStore((state) => state.txns);
  const events = useLedgerStore((state) => state.events);

  const [armedId, setArmedId] = useState<string | null>(null);
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
        summary: summaryFromTxns(
          vial.vialMg,
          vialTxns,
          lastDoseMcg ?? undefined,
        ),
        concentration: vialConcentration(vial.vialMg, vial.diluentMl),
        lastDoseMcg,
      };
    });
  }, [vials, txns, events]);

  const handleDeletePress = (id: string) => {
    if (armedId === id) {
      setArmedId(null);
      removeVial(id).catch((error) => console.error("[vials] Failed to delete vial", error));
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
              What you have on hand
            </AppText>
            <AppText variant="title">Vials</AppText>
          </View>
          <Button
            label="New"
            tone="accent"
            compact
            onPress={() => router.push("/vial-new")}
            icon={<Plus size={16} color={colors.onAccent} />}
            testID="open-vial-new"
          />
        </View>

        {views.length === 0 ? (
          <EmptyState
            icon={<TestTubes size={28} color={colors.inkFaint} />}
            title="No vials tracked yet"
            caption="Add a vial after you reconstitute it. Doses you log against it keep its remaining amount exact."
            action={
              <Button label="Add a vial" tone="primary" onPress={() => router.push("/vial-new")} />
            }
          />
        ) : (
          views.map((view) => (
            <VialCard
              key={view.vial.id}
              vial={view.vial}
              summary={view.summary}
              concentration={view.concentration}
              lastDoseMcg={view.lastDoseMcg}
              nowIso={nowIso}
              deleteArmed={armedId === view.vial.id}
              onDeletePress={() => handleDeletePress(view.vial.id)}
            />
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
});
