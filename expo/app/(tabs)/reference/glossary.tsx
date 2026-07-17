import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import Card from "@/src/components/ui/Card";
import Hairline from "@/src/components/ui/Hairline";
import Screen from "@/src/components/ui/Screen";
import { GLOSSARY_ENTRIES } from "@/src/data/glossary";
import { colors, hairlineWidth, radius, spacing } from "@/src/theme/tokens";

export default function GlossaryScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.chrome}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backButton}
          testID="glossary-back"
        >
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.chromeText}>
          <AppText variant="heading">Glossary</AppText>
          <AppText variant="caption" tone="faint">
            Measurement terms only
          </AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card padded={false}>
          {GLOSSARY_ENTRIES.map((entry, index) => (
            <View key={entry.term}>
              {index > 0 && <Hairline />}
              <View style={styles.entry}>
                <AppText variant="overline" tone="faint">
                  {entry.term}
                </AppText>
                <AppText variant="label" tone="secondary">
                  {entry.body}
                </AppText>
              </View>
            </View>
          ))}
        </Card>

        <AppText variant="caption" mono tone="faint" style={styles.footnote}>
          Constant: U-100 is always 100 units/mL. Never “U-30” or “U-50” — those are barrel
          volumes, not syringe scales.
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  entry: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  footnote: {
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
});
