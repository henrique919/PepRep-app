import { X } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import Card from "@/src/components/ui/Card";
import Hairline from "@/src/components/ui/Hairline";
import type { Vial } from "@/src/db/models";
import { fmt } from "@/src/engine";
import type { VialSummary } from "@/src/engine/inventory";
import type { ConcentrationInfo } from "@/src/engine/inventory";
import { daysSince } from "@/src/engine/schedule";
import { isExpiredOrDue, isLowStock } from "@/src/engine/vialWarnings";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

interface VialCardProps {
  vial: Vial;
  summary: VialSummary;
  concentration: ConcentrationInfo | null;
  /** The user's own most recent dose from this vial, in mcg (display only). */
  lastDoseMcg: number | null;
  nowIso: string;
  deleteArmed: boolean;
  onDeletePress: () => void;
}

export default function VialCard({
  vial,
  summary,
  concentration,
  lastDoseMcg,
  nowIso,
  deleteArmed,
  onDeletePress,
}: VialCardProps) {
  const { colors } = useTheme();
  const age = daysSince(vial.reconstitutedAtIso, nowIso);
  const ageLabel = age === 0 ? "reconstituted today" : age === 1 ? "1 day ago" : `${age} days ago`;
  const expired = isExpiredOrDue(vial.expiresAtIso, nowIso);
  const low = isLowStock(summary.remainingPercent, vial.lowStockThresholdPercent);

  return (
    <Card padded={false}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="heading" numberOfLines={1}>
            {vial.name}
          </AppText>
          <AppText variant="label" mono tone="secondary">
            {fmt(vial.vialMg)} mg + {fmt(vial.diluentMl)} mL water
          </AppText>
          {vial.lot.length > 0 ? (
            <AppText variant="caption" mono tone="faint">
              Lot {vial.lot}
            </AppText>
          ) : null}
        </View>
        <Pressable
          onPress={onDeletePress}
          hitSlop={10}
          style={[styles.deleteButton, deleteArmed && { backgroundColor: colors.dangerBg }]}
          testID={`delete-vial-${vial.id}`}
        >
          {deleteArmed ? (
            <AppText variant="caption" weight="semibold" tone="danger">
              Delete?
            </AppText>
          ) : (
            <X size={15} color={colors.inkFaint} />
          )}
        </Pressable>
      </View>

      <Hairline />

      <View style={styles.bodySection}>
        {concentration !== null && (
          <View style={styles.statRow}>
            <AppText variant="overline" tone="faint">
              Concentration
            </AppText>
            <AppText variant="label" mono weight="semibold">
              {fmt(concentration.mgPerMl, 3)} mg/mL
            </AppText>
          </View>
        )}

        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSunken }]}>
          <View style={[styles.progressFill, { width: `${summary.remainingPercent}%`, backgroundColor: colors.accent }]} />
        </View>

        <View style={styles.statRow}>
          <AppText variant="label" mono tone="secondary">
            {fmt(summary.remainingMg, 2)} mg left · {fmt(summary.remainingPercent, 0)}%
          </AppText>
          <AppText variant="caption" tone="faint">
            {summary.dosesLogged} {summary.dosesLogged === 1 ? "dose" : "doses"} logged
          </AppText>
        </View>

        {summary.fullDosesLeft !== null && lastDoseMcg !== null && (
          <AppText variant="caption" tone="faint">
            ≈ {summary.fullDosesLeft} full draws left at your last logged dose ({fmt(lastDoseMcg)}{" "}
            mcg)
          </AppText>
        )}

        <AppText variant="caption" tone="faint">
          {ageLabel}
          {vial.note.length > 0 ? ` · ${vial.note}` : ""}
        </AppText>

        {expired ? (
          <AppText variant="caption" weight="semibold" tone="danger" testID={`vial-expired-${vial.id}`}>
            Past the expiry / BUD date you recorded
          </AppText>
        ) : null}
        {low ? (
          <AppText variant="caption" weight="semibold" tone="warn" testID={`vial-low-${vial.id}`}>
            At or below your low-stock threshold ({fmt(summary.remainingPercent, 0)}% left)
          </AppText>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  bodySection: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    borderRadius: radius.pill,
  },
  deleteButton: {
    minWidth: 30,
    minHeight: 30,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
});
