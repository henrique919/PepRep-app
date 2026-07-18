import { X } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import type { DoseEntry } from "@/src/db/models";
import { SITE_LABELS } from "@/src/db/models";
import { fmt } from "@/src/engine";
import { formatClock } from "@/src/engine/schedule";
import { useTheme } from "@/src/theme";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

interface DoseRowProps {
  entry: DoseEntry;
  /** Two-tap delete: first tap arms, second confirms. */
  deleteArmed: boolean;
  onDeletePress: () => void;
}

export default function DoseRow({ entry, deleteArmed, onDeletePress }: DoseRowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <AppText variant="label" mono tone="faint" style={styles.time}>
        {formatClock(entry.atIso)}
      </AppText>

      <View style={styles.body}>
        <AppText variant="body" weight="semibold" numberOfLines={1}>
          {entry.peptideName.length > 0 ? entry.peptideName : "Unnamed"}
        </AppText>
        <View style={styles.metaRow}>
          <AppText variant="label" mono tone="secondary">
            {fmt(entry.doseValue)} {entry.doseUnit}
          </AppText>
          {entry.units !== null && (
            <AppText variant="label" mono tone="secondary">
              · {fmt(entry.units, 1)} u
            </AppText>
          )}
          {entry.site !== null && (
            <AppText variant="caption" tone="faint">
              · {SITE_LABELS[entry.site]}
            </AppText>
          )}
        </View>
        {entry.note.length > 0 && (
          <AppText variant="caption" tone="faint" numberOfLines={2}>
            {entry.note}
          </AppText>
        )}
      </View>

      <Pressable
        onPress={onDeletePress}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={deleteArmed ? "Confirm delete dose" : "Delete dose"}
        style={[
          styles.deleteButton,
          deleteArmed && { backgroundColor: colors.dangerBg, borderColor: colors.dangerBg },
        ]}
        testID={`delete-dose-${entry.id}`}
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
  );
}

const styles = StyleSheet.create({
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
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs,
  },
  deleteButton: {
    minWidth: 30,
    minHeight: 30,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: hairlineWidth,
    borderColor: "transparent",
    paddingHorizontal: spacing.xs,
  },
});
