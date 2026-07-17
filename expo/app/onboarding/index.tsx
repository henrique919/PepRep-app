import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";

import SyringeGauge from "@/src/components/domain/SyringeGauge";
import AppText from "@/src/components/ui/AppText";
import BoldTallyMark from "@/src/components/ui/BoldTallyMark";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import Screen from "@/src/components/ui/Screen";
import { calculateDraw, fmt } from "@/src/engine";
import {
  CURRENT_SAFETY_ACK_VERSION,
  useSettingsStore,
} from "@/src/store/settings";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { DISCLAIMER, hairlineWidth, radius, spacing } from "@/src/theme/tokens";

type Step = "intro" | "safety" | "draw";

/** Fixed demo inputs — a clean 10-unit draw on a U-100 barrel. */
const DEMO = {
  vialMg: 5,
  diluentMl: 2,
  doseValue: 250,
  doseUnit: "mcg" as const,
  syringeCapacityUnits: 100 as const,
};

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const completeOnboarding = useSettingsStore((state) => state.completeOnboarding);
  const [step, setStep] = useState<Step>("intro");
  const [acked, setAcked] = useState<boolean>(false);
  const [finishing, setFinishing] = useState<boolean>(false);

  const draw = useMemo(
    () =>
      calculateDraw({
        vialMg: DEMO.vialMg,
        diluentMl: DEMO.diluentMl,
        doseValue: DEMO.doseValue,
        doseUnit: DEMO.doseUnit,
        syringeCapacityUnits: DEMO.syringeCapacityUnits,
      }),
    [],
  );

  const finish = () => {
    if (finishing || !draw.ok) return;
    setFinishing(true);
    completeOnboarding(CURRENT_SAFETY_ACK_VERSION)
      .then(() => router.replace("/(tabs)"))
      .catch((error) => {
        console.error("[onboarding] Failed to complete", error);
        setFinishing(false);
      });
  };

  return (
    <Screen topInset={Platform.OS !== "ios"}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <BoldTallyMark size={36} />
          <AppText variant="overline" tone="secondary">
            PepRep · first run
          </AppText>
        </View>

        {step === "intro" && (
          <View style={styles.block} testID="onboarding-intro">
            <AppText variant="display">A measurement instrument,{"\n"}not an advisor.</AppText>
            <AppText variant="body" tone="secondary">
              You enter every number. PepRep does the reconstitution arithmetic, shows the
              working, and keeps an auditable record of what you actually did.
            </AppText>
            <Card style={styles.card}>
              <AppText variant="overline" tone="faint">
                What it never does
              </AppText>
              <AppText variant="label" tone="secondary">
                No dose suggestions, ranges, protocols, cycles, stacks, or efficacy claims —
                ever.
              </AppText>
            </Card>
            <Button
              label="Continue"
              tone="primary"
              onPress={() => setStep("safety")}
              testID="onboarding-continue-intro"
            />
          </View>
        )}

        {step === "safety" && (
          <View style={styles.block} testID="onboarding-safety">
            <AppText variant="display">One acknowledgement</AppText>
            <AppText variant="body" tone="secondary">
              {DISCLAIMER}
            </AppText>
            <Card style={styles.card}>
              <AppText variant="label" tone="secondary">
                You are responsible for your own plan and for checking every result against your
                vial and syringe. PepRep only converts the numbers you provide.
              </AppText>
            </Card>
            <Pressable
              onPress={() => setAcked((prev) => !prev)}
              style={[styles.ackRow, acked && styles.ackRowActive]}
              testID="onboarding-ack"
            >
              <View style={[styles.checkbox, acked && styles.checkboxActive]} />
              <AppText variant="label" weight="medium" style={styles.ackText}>
                I understand — PepRep does not recommend doses.
              </AppText>
            </Pressable>
            <Button
              label="Continue"
              tone="primary"
              onPress={() => setStep("draw")}
              disabled={!acked}
              testID="onboarding-continue-safety"
            />
            {!acked && (
              <AppText variant="caption" tone="faint" style={styles.hint}>
                Tick the acknowledgement to continue.
              </AppText>
            )}
          </View>
        )}

        {step === "draw" && draw.ok && (
          <View style={styles.block} testID="onboarding-draw">
            <AppText variant="display">Your first draw</AppText>
            <AppText variant="body" tone="secondary">
              Example only — replace these with your own vial numbers later. Same math the
              calculator uses.
            </AppText>
            <Card style={styles.inputsCard}>
              <Row label="Vial" value={`${fmt(DEMO.vialMg)} mg`} />
              <Row label="Water added" value={`${fmt(DEMO.diluentMl)} mL`} />
              <Row label="Dose" value={`${fmt(DEMO.doseValue)} mcg`} />
            </Card>
            <View style={styles.resultPanel}>
              <AppText variant="overline" tone="onDarkSecondary">
                Draw
              </AppText>
              <AppText
                variant="display"
                mono
                weight="bold"
                tone="onDark"
                style={styles.readout}
                testID="onboarding-units"
              >
                {fmt(draw.units)}
              </AppText>
              <AppText variant="label" mono tone="onDarkSecondary">
                units · {fmt(draw.volumeMl, 3)} mL
              </AppText>
              <SyringeGauge units={draw.units} capacity={DEMO.syringeCapacityUnits} />
            </View>
            <Button
              label="Enter PepRep"
              tone="primary"
              onPress={finish}
              disabled={finishing}
              testID="onboarding-finish"
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <AppText variant="caption" tone="faint">
        {label}
      </AppText>
      <AppText variant="label" mono weight="medium">
        {value}
      </AppText>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    content: {
      padding: spacing.lg,
      gap: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    block: {
      gap: spacing.lg,
    },
    card: {
      gap: spacing.sm,
    },
    ackRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: hairlineWidth,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    ackRowActive: {
      borderColor: colors.ink,
      backgroundColor: colors.accentSoft,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: radius.sm,
      borderWidth: hairlineWidth,
      borderColor: colors.inkFaint,
      backgroundColor: colors.surface,
    },
    checkboxActive: {
      backgroundColor: colors.accent,
      borderColor: colors.ink,
    },
    ackText: {
      flex: 1,
    },
    hint: {
      textAlign: "center",
    },
    inputsCard: {
      gap: spacing.md,
    },
    resultPanel: {
      backgroundColor: colors.panel,
      borderRadius: radius.xl,
      padding: spacing.xl,
      gap: spacing.md,
      alignItems: "center",
    },
    readout: {
      fontSize: 56,
      lineHeight: 60,
      letterSpacing: -1.6,
    },
  });
}
