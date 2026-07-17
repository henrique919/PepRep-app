import React from "react";
import { StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import Hairline from "@/src/components/ui/Hairline";
import type { MathStep } from "@/src/engine";
import { colors, radius, spacing } from "@/src/theme/tokens";

interface MathStepsProps {
  steps: MathStep[];
}

/** Renders the engine's worked arithmetic, step by step. Display only. */
export default function MathSteps({ steps }: MathStepsProps) {
  return (
    <View style={styles.wrap}>
      {steps.map((step, index) => (
        <View key={step.label}>
          {index > 0 && <Hairline />}
          <View style={styles.step}>
            <View style={styles.indexBadge}>
              <AppText variant="caption" mono weight="semibold" tone="accent">
                {String(index + 1)}
              </AppText>
            </View>
            <View style={styles.stepBody}>
              <AppText variant="overline" tone="faint">
                {step.label}
              </AppText>
              <AppText variant="label" mono tone="secondary">
                {step.expression}
              </AppText>
              <AppText variant="body" mono weight="semibold">
                = {step.result}
              </AppText>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 0,
  },
  step: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  indexBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepBody: {
    flex: 1,
    gap: 3,
  },
});
