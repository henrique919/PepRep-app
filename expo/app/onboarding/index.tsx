import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import BoldTallyMark from "@/src/components/ui/BoldTallyMark";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import Field from "@/src/components/ui/Field";
import Screen from "@/src/components/ui/Screen";
import SegmentedControl from "@/src/components/ui/SegmentedControl";
import type { SyringeCapacity } from "@/src/engine";
import { fmt, SYRINGES } from "@/src/engine";
import { vialConcentration } from "@/src/engine/inventory";
import { vialToCalculatorParams } from "@/src/engine/vialCalcParams";
import { parseOnboardingVialDraft } from "@/src/onboarding/vialDraft";
import {
  CURRENT_SAFETY_ACK_VERSION,
  useSettingsStore,
} from "@/src/store/settings";
import { useVialsStore } from "@/src/store/vials";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { DISCLAIMER, hairlineWidth, radius, spacing } from "@/src/theme/tokens";

type Step = "intro" | "safety" | "vial";

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const completeOnboarding = useSettingsStore((state) => state.completeOnboarding);
  const onboardingComplete = useSettingsStore((state) => state.onboardingComplete);
  const safetyAckVersion = useSettingsStore((state) => state.safetyAckVersion);
  const addVial = useVialsStore((state) => state.addVial);
  /** Returning users when safety copy version bumps — ack only, skip vial setup. */
  const reackOnly =
    onboardingComplete && safetyAckVersion !== CURRENT_SAFETY_ACK_VERSION;

  const [step, setStep] = useState<Step>(reackOnly ? "safety" : "intro");
  const [acked, setAcked] = useState<boolean>(false);
  const [finishing, setFinishing] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [vialText, setVialText] = useState<string>("");
  const [waterText, setWaterText] = useState<string>("");
  const [capacity, setCapacity] = useState<SyringeCapacity>(50);
  const [formError, setFormError] = useState<string | null>(null);

  const parsed = useMemo(
    () => parseOnboardingVialDraft({ name, vialText, waterText, capacity }),
    [name, vialText, waterText, capacity],
  );

  const concentration =
    parsed.ok ? vialConcentration(parsed.vial.vialMg, parsed.vial.diluentMl) : null;

  const finish = () => {
    if (finishing) return;
    const draft = parseOnboardingVialDraft({ name, vialText, waterText, capacity });
    if (!draft.ok) {
      setFormError(draft.errors[0] ?? "Enter your vial details to continue.");
      return;
    }
    setFormError(null);
    setFinishing(true);
    const reconstitutedAtIso = new Date().toISOString();
    addVial({
      ...draft.vial,
      reconstitutedAtIso,
      archivedAtIso: null,
      expiresAtIso: null,
      lot: "",
      lowStockThresholdPercent: null,
    })
      .then(() => completeOnboarding(CURRENT_SAFETY_ACK_VERSION))
      .then(() =>
        // Carry the vial the user just saved into the calculator so the first
        // screen they land on already reflects it instead of starting blank.
        router.replace({
          pathname: "/",
          params: vialToCalculatorParams(draft.vial),
        }),
      )
      .catch((error) => {
        console.error("[onboarding] Failed to complete", error);
        setFinishing(false);
        setFormError("Could not save your vial. Try again.");
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
            {reackOnly ? "PepRep · updated acknowledgement" : "PepRep · first run"}
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
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acked }}
              accessibilityLabel="I understand — PepRep does not recommend doses."
              testID="onboarding-ack"
            >
              <View style={[styles.checkbox, acked && styles.checkboxActive]} />
              <AppText variant="label" weight="medium" style={styles.ackText}>
                I understand — PepRep does not recommend doses.
              </AppText>
            </Pressable>
            <Button
              label={reackOnly ? "Continue to PepRep" : "Continue"}
              tone="primary"
              onPress={() => {
                if (!acked) return;
                if (reackOnly) {
                  completeOnboarding(CURRENT_SAFETY_ACK_VERSION)
                    .then(() => router.replace("/(tabs)"))
                    .catch((error) =>
                      console.error("[onboarding] Failed to persist safety ack", error),
                    );
                  return;
                }
                setStep("vial");
              }}
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

        {step === "vial" && (
          <View style={styles.block} testID="onboarding-vial">
            <AppText variant="display">Save your first vial</AppText>
            <AppText variant="body" tone="secondary">
              Enter the vial you already reconstituted. PepRep stores these exact numbers — it
              does not suggest a setup.
            </AppText>
            <Field
              label="Label"
              value={name}
              onChangeText={setName}
              mono={false}
              keyboardType="default"
              placeholder="Your name for this vial"
              testID="onboarding-vial-name"
            />
            <Field
              label="Vial contents"
              value={vialText}
              onChangeText={setVialText}
              suffix="mg"
              placeholder="0"
              testID="onboarding-vial-mg"
            />
            <Field
              label="Water added"
              value={waterText}
              onChangeText={setWaterText}
              suffix="mL"
              placeholder="0"
              testID="onboarding-vial-water"
            />
            <View style={styles.capacityBlock}>
              <AppText variant="overline" tone="secondary">
                Syringe barrel (volume only)
              </AppText>
              <SegmentedControl
                options={SYRINGES.map((s) => ({
                  value: s.capacityUnits,
                  label: `${s.capacityUnits} U`,
                }))}
                value={capacity}
                onChange={setCapacity}
                mono
                testID="onboarding-capacity"
              />
            </View>
            {concentration !== null && (
              <Card style={styles.card}>
                <AppText variant="overline" tone="faint">
                  From your numbers
                </AppText>
                <AppText variant="label" mono tone="secondary">
                  {fmt(concentration.mcgPerMl)} mcg/mL · {fmt(concentration.mgPerMl, 3)} mg/mL
                </AppText>
              </Card>
            )}
            {formError !== null && (
              <AppText variant="caption" tone="danger" accessibilityRole="alert">
                {formError}
              </AppText>
            )}
            <Button
              label={finishing ? "Saving…" : "Save vial and enter PepRep"}
              tone="primary"
              onPress={finish}
              disabled={finishing || !parsed.ok}
              testID="onboarding-finish"
            />
          </View>
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
    capacityBlock: {
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
      minHeight: 44,
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
  });
}
