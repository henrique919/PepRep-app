import { useRouter } from "expo-router";
import { BookMarked, MessageCircleQuestion, Search } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import Card from "@/src/components/ui/Card";
import EmptyState from "@/src/components/ui/EmptyState";
import Field from "@/src/components/ui/Field";
import Screen from "@/src/components/ui/Screen";
import { NOT_ESTABLISHED, searchCompounds } from "@/src/data/compounds";
import { colors, hairlineWidth, radius, spacing } from "@/src/theme/tokens";

/** Renders MW literally when unsourced — never a dash, never hidden. */
function weightLabel(molecularWeightDa: string): string {
  return molecularWeightDa === NOT_ESTABLISHED ? molecularWeightDa : `${molecularWeightDa} Da`;
}

export default function ReferenceScreen() {
  const router = useRouter();
  const [query, setQuery] = useState<string>("");

  const compounds = useMemo(() => searchCompounds(query), [query]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.header}>
            <AppText variant="overline" tone="faint">
              Identity data only — never dosing
            </AppText>
            <AppText variant="title">Reference</AppText>
          </View>
          <Pressable
            onPress={() => router.push("/reference/glossary")}
            hitSlop={8}
            style={styles.glossaryButton}
            testID="open-glossary"
          >
            <BookMarked size={18} color={colors.ink} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push("/reference/ask")}
          style={styles.askRow}
          testID="open-ask"
        >
          <View style={styles.askIcon}>
            <MessageCircleQuestion size={22} color={colors.onAccent} />
          </View>
          <View style={styles.askText}>
            <AppText variant="heading">Ask</AppText>
            <AppText variant="caption" tone="secondary">
              Reference answers from PepRep&apos;s compound data
            </AppText>
          </View>
        </Pressable>

        <Field
          label="Search"
          value={query}
          onChangeText={setQuery}
          mono={false}
          keyboardType="default"
          placeholder="Name, class, identity…"
          testID="reference-search"
          accessory={<Search size={16} color={colors.inkFaint} />}
        />

        {compounds.length === 0 ? (
          <EmptyState
            icon={<Search size={28} color={colors.inkFaint} />}
            title="No matches"
            caption="Try another name, full name, structural class, or identity phrase."
          />
        ) : (
          compounds.map((compound) => (
            <Pressable
              key={compound.id}
              onPress={() => router.push(`/reference/${compound.slug}`)}
              testID={`compound-card-${compound.slug}`}
            >
              <Card style={styles.card}>
                <View style={styles.cardTop}>
                  <AppText variant="heading" numberOfLines={1} style={styles.cardName}>
                    {compound.name}
                  </AppText>
                  <View style={styles.chip}>
                    <AppText variant="caption" tone="secondary" numberOfLines={1}>
                      {compound.structuralClass}
                    </AppText>
                  </View>
                </View>
                <View style={styles.metaRow}>
                  <AppText variant="caption" mono tone="faint">
                    {weightLabel(compound.molecularWeightDa)}
                  </AppText>
                  <AppText variant="caption" tone="faint" numberOfLines={1}>
                    {compound.sequenceLength}
                  </AppText>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  header: {
    gap: spacing.xs,
    flex: 1,
  },
  glossaryButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: hairlineWidth,
    borderColor: colors.hairline,
  },
  askRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.panel,
  },
  askIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  askText: {
    flex: 1,
    gap: 2,
  },
  card: {
    gap: spacing.sm,
  },
  cardTop: {
    gap: spacing.sm,
  },
  cardName: {
    flexShrink: 1,
  },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSunken,
    borderWidth: hairlineWidth,
    borderColor: colors.hairline,
    maxWidth: "100%",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
});
