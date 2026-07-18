import { generateText } from "@rork-ai/toolkit-sdk";
import { useRouter } from "expo-router";
import { ChevronLeft, MessageCircleQuestion } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import AppText from "@/src/components/ui/AppText";
import AskConsentCard from "@/src/components/ui/AskConsentCard";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import EmptyState from "@/src/components/ui/EmptyState";
import Field from "@/src/components/ui/Field";
import Screen from "@/src/components/ui/Screen";
import { askQuestion, type AskOutcome } from "@/src/ask";
import { callRorkGenerateText } from "@/src/ask/rorkTransport";
import { useSettingsStore } from "@/src/store/settings";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

const CHIPS = [
  "What is BPC-157?",
  "What does BAC water do?",
  "Why is a 30-unit syringe still 100 units/mL?",
  "What's the difference between mcg and mg?",
] as const;

function isProbablyOnline(): boolean {
  if (typeof navigator !== "undefined" && "onLine" in navigator) {
    return navigator.onLine !== false;
  }
  return true;
}

export default function AskScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const askEnabled = useSettingsStore((state) => state.askEnabled);
  const acceptAskConsent = useSettingsStore((state) => state.acceptAskConsent);

  const [question, setQuestion] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [outcome, setOutcome] = useState<AskOutcome | null>(null);
  const [showConsent, setShowConsent] = useState<boolean>(false);
  const [consentBusy, setConsentBusy] = useState<boolean>(false);

  const runAsk = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || busy) return;
    setBusy(true);
    setOutcome(null);
    setQuestion(trimmed);
    try {
      const result = await askQuestion(trimmed, {
        askEnabled,
        online: isProbablyOnline(),
        generateText: async ({ messages }) => callRorkGenerateText(generateText, messages),
      });
      setOutcome(result);
    } catch (error) {
      console.error("[ask] unexpected failure", error);
      setOutcome({ kind: "exhausted" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={styles.chrome}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backButton}
          testID="ask-back"
        >
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.chromeText}>
          <AppText variant="heading">Ask</AppText>
          <AppText variant="caption" tone="faint">
            Reference answers from PepRep&apos;s compound data
          </AppText>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText variant="caption" tone="secondary" style={styles.disclaimer}>
            Answers come from PepRep&apos;s reference set. Ask does not give dosing or medical
            advice, and never sees your vials, doses or history.
          </AppText>

          {!askEnabled ? (
            showConsent ? (
              <AskConsentCard
                busy={consentBusy}
                onDecline={() => setShowConsent(false)}
                onAccept={() => {
                  setConsentBusy(true);
                  acceptAskConsent()
                    .catch((error) => console.error("[ask] consent failed", error))
                    .finally(() => setConsentBusy(false));
                }}
              />
            ) : (
              <EmptyState
                icon={<MessageCircleQuestion size={28} color={colors.inkFaint} />}
                title="Ask is turned off"
                caption="Ask is off by default. Enabling it sends question text to Rork AI Cloud. Your vials, doses and history never leave this device."
                action={
                  <Button
                    label="Review and enable Ask"
                    tone="primary"
                    onPress={() => setShowConsent(true)}
                    testID="ask-show-consent"
                  />
                }
              />
            )
          ) : (
            <>
              <Field
                label="Your question"
                value={question}
                onChangeText={setQuestion}
                mono={false}
                keyboardType="default"
                placeholder="Ask about a compound or measurement term"
                testID="ask-input"
              />

              <View style={styles.chips}>
                {CHIPS.map((chip) => (
                  <Pressable
                    key={chip}
                    onPress={() => {
                      setQuestion(chip);
                      void runAsk(chip);
                    }}
                    style={styles.chip}
                    testID={`ask-chip-${chip.slice(0, 12)}`}
                  >
                    <AppText variant="caption" tone="secondary">
                      {chip}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <Button
                label={busy ? "Asking…" : "Ask"}
                tone="accent"
                onPress={() => void runAsk(question)}
                disabled={busy || question.trim().length === 0}
                testID="ask-submit"
              />

              {busy && (
                <View style={styles.busyRow}>
                  <ActivityIndicator color={colors.accent} />
                  <AppText variant="caption" tone="faint">
                    Asking Rork AI Cloud…
                  </AppText>
                </View>
              )}

              {outcome?.kind === "offline" && (
                <EmptyState
                  icon={<MessageCircleQuestion size={28} color={colors.inkFaint} />}
                  title="Offline"
                  caption="Ask needs a connection. Everything else in PepRep works offline."
                />
              )}

              {outcome?.kind === "exhausted" && (
                <EmptyState
                  icon={<MessageCircleQuestion size={28} color={colors.inkFaint} />}
                  title="Unavailable"
                  caption="Ask is unavailable right now. The calculator and your records are unaffected."
                />
              )}

              {outcome?.kind === "rate_limited" && (
                <EmptyState
                  icon={<MessageCircleQuestion size={28} color={colors.inkFaint} />}
                  title="Unavailable"
                  caption="Ask is unavailable right now. The calculator and your records are unaffected."
                />
              )}

              {(outcome?.kind === "answer" || outcome?.kind === "refuse") && (
                <Card style={styles.answerCard} testID="ask-answer">
                  <AppText variant="overline" tone="faint">
                    {outcome.kind === "refuse" ? "Redirect" : "Answer"}
                  </AppText>
                  <AppText variant="body" tone="secondary">
                    {outcome.text}
                  </AppText>
                </Card>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}



function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
  flex: {
    flex: 1,
  },
  chrome: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  chromeText: {
    flex: 1,
    gap: 2,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  disclaimer: {
    lineHeight: 18,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: hairlineWidth,
    borderColor: colors.hairline,
    maxWidth: "100%",
  },
  busyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  answerCard: {
    gap: spacing.sm,
  },
});
}
