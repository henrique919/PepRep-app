import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import Card from "@/src/components/ui/Card";
import Hairline from "@/src/components/ui/Hairline";
import Screen from "@/src/components/ui/Screen";
import { COMPOUNDS, NOT_ESTABLISHED } from "@/src/data/compounds";
import { spacing } from "@/src/theme/tokens";

/** Renders the value literally when unsourced — never hidden, never a dash. */
function weightLabel(molecularWeightDa: string): string {
  return molecularWeightDa === NOT_ESTABLISHED ? molecularWeightDa : `${molecularWeightDa} Da`;
}

export default function ReferenceScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppText variant="overline" tone="faint">
            Identity data only — never dosing
          </AppText>
          <AppText variant="title">Reference</AppText>
        </View>

        <Card padded={false}>
          {COMPOUNDS.map((compound, index) => (
            <View key={compound.id}>
              {index > 0 && <Hairline />}
              <View style={styles.row}>
                <View style={styles.rowBody}>
                  <AppText variant="body" weight="medium" numberOfLines={1}>
                    {compound.name}
                  </AppText>
                  <AppText variant="caption" tone="secondary" numberOfLines={1}>
                    {compound.structuralClass}
                  </AppText>
                </View>
                <AppText variant="caption" mono tone="faint">
                  {weightLabel(compound.molecularWeightDa)}
                </AppText>
              </View>
            </View>
          ))}
        </Card>
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
  header: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 60,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
});
