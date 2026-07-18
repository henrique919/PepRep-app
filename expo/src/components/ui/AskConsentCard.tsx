import React from "react";
import { StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import { useTheme } from "@/src/theme";
import { spacing } from "@/src/theme/tokens";

interface AskConsentCardProps {
  onAccept: () => void;
  onDecline?: () => void;
  busy?: boolean;
}

/**
 * Just-in-time Ask consent — names provider, purpose, what is / isn't sent.
 * Ask must stay off until the user accepts.
 */
export default function AskConsentCard({
  onAccept,
  onDecline,
  busy = false,
}: AskConsentCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card} testID="ask-consent-card">
      <AppText variant="heading">Before Ask turns on</AppText>
      <AppText variant="label" tone="secondary">
        Ask sends the text of your question to Rork AI Cloud so PepRep can return a
        retrieval-grounded reference answer from its compound data.
      </AppText>
      <View style={styles.bullets}>
        <AppText variant="label" tone="secondary">
          · Sent: the question text you type
        </AppText>
        <AppText variant="label" tone="secondary">
          · Not sent: vials, doses, plans, history, or other records on this device
        </AppText>
        <AppText variant="label" tone="secondary">
          · Purpose: identity / glossary reference answers only — never dosing advice
        </AppText>
        <AppText variant="label" tone="secondary">
          · Retention: handled by the Rork AI Cloud provider under their policy; PepRep does
          not keep a cloud copy of your question
        </AppText>
      </View>
      <AppText variant="caption" tone="faint">
        You can turn Ask off any time in Settings → Privacy. The calculator and your records
        stay local either way.
      </AppText>
      <Button
        label={busy ? "Enabling…" : "I understand — enable Ask"}
        tone="primary"
        onPress={onAccept}
        disabled={busy}
        testID="ask-consent-accept"
      />
      {onDecline ? (
        <Button
          label="Keep Ask off"
          tone="ghost"
          onPress={onDecline}
          disabled={busy}
          testID="ask-consent-decline"
        />
      ) : null}
      <AppText variant="caption" tone="faint" style={{ color: colors.inkFaint }}>
        Provider: Rork AI Cloud
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  bullets: {
    gap: spacing.xs,
  },
});
