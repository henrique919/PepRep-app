import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ExternalLink } from "lucide-react-native";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import EmptyState from "@/src/components/ui/EmptyState";
import Hairline from "@/src/components/ui/Hairline";
import Screen from "@/src/components/ui/Screen";
import {
  getCompoundBySlug,
  NOT_ESTABLISHED,
  type Compound,
} from "@/src/data/compounds";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

function stringParam(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") return value[0];
  return "";
}

/** Always show the stored string — including the literal "not established". */
function factValue(value: string): string {
  return value;
}

function weightFact(molecularWeightDa: string): string {
  if (molecularWeightDa === NOT_ESTABLISHED) return molecularWeightDa;
  return `${molecularWeightDa} Da`;
}

type ScreenStyles = ReturnType<typeof createStyles>;

function FactRow({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ScreenStyles;
}) {
  return (
    <View style={styles.factRow}>
      <AppText variant="overline" tone="faint">
        {label}
      </AppText>
      <AppText variant="label" mono={label === "Molecular weight" || label === "PubChem CID"} tone="secondary">
        {value}
      </AppText>
    </View>
  );
}

function CompoundDetail({
  compound,
  styles,
  inkFaint,
}: {
  compound: Compound;
  styles: ScreenStyles;
  inkFaint: string;
}) {
  const router = useRouter();

  const openCitation = (url: string) => {
    WebBrowser.openBrowserAsync(url).catch((error) =>
      console.error("[reference] Failed to open citation", error),
    );
  };

  const calculate = () => {
    router.push({
      pathname: "/",
      params: {
        compoundName: compound.name,
        massUnitConvention: compound.massUnitConvention,
      },
    });
  };

  return (
    <>
      <View style={styles.titleBlock}>
        <AppText variant="title">{compound.name}</AppText>
        <AppText variant="label" tone="secondary">
          {factValue(compound.fullName)}
        </AppText>
        <View style={styles.badgeRow}>
          <View style={styles.chip}>
            <AppText variant="caption" tone="secondary">
              {compound.structuralClass}
            </AppText>
          </View>
          <View style={[styles.chip, compound.verified ? styles.verifiedChip : styles.unverifiedChip]}>
            <AppText
              variant="caption"
              weight="semibold"
              tone={compound.verified ? "secondary" : "danger"}
            >
              {compound.verified ? "verified" : "unverified"}
            </AppText>
          </View>
        </View>
      </View>

      <Card style={styles.identityCard}>
        <AppText variant="overline" tone="faint">
          Identity
        </AppText>
        <AppText variant="body" tone="secondary">
          {compound.identityLine}
        </AppText>
      </Card>

      <Card padded={false}>
        <FactRow styles={styles} label="Molecular weight" value={weightFact(compound.molecularWeightDa)} />
        <Hairline />
        <FactRow styles={styles} label="Formula" value={factValue(compound.molecularFormula)} />
        <Hairline />
        <FactRow styles={styles} label="PubChem CID" value={factValue(compound.pubchemCid)} />
        <Hairline />
        <FactRow styles={styles} label="Sequence length" value={factValue(compound.sequenceLength)} />
        <Hairline />
        <FactRow styles={styles} label="Half-life" value={factValue(compound.halfLife)} />
        <Hairline />
        <FactRow styles={styles} label="Mass unit convention" value={factValue(compound.massUnitConvention)} />
        <Hairline />
        <FactRow styles={styles} label="Storage" value={factValue(compound.storageNotes)} />
        <Hairline />
        <FactRow styles={styles} label="Regulatory status" value={factValue(compound.regulatoryStatus)} />
      </Card>

      <View style={styles.section}>
        <AppText variant="overline" tone="faint">
          Citations
        </AppText>
        {compound.citations.length === 0 ? (
          <Card>
            <AppText variant="label" tone="secondary">
              not established
            </AppText>
          </Card>
        ) : (
          <Card padded={false}>
            {compound.citations.map((citation, index) => (
              <View key={citation.url}>
                {index > 0 && <Hairline />}
                <Pressable
                  onPress={() => openCitation(citation.url)}
                  style={styles.citationRow}
                  testID={`citation-${index}`}
                >
                  <View style={styles.citationText}>
                    <AppText variant="label" weight="medium">
                      {citation.label}
                    </AppText>
                    <AppText variant="caption" tone="faint" numberOfLines={1}>
                      {citation.url}
                    </AppText>
                  </View>
                  <ExternalLink size={16} color={inkFaint} />
                </Pressable>
              </View>
            ))}
          </Card>
        )}
      </View>

      <Button
        label="Calculate with this compound"
        tone="accent"
        onPress={calculate}
        testID="calculate-with-compound"
      />
    </>
  );
}

export default function ReferenceDetailScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const slug = stringParam(params.slug);

  const compound = useMemo(() => getCompoundBySlug(slug), [slug]);

  return (
    <Screen>
      <View style={styles.chrome}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backButton}
          testID="reference-detail-back"
        >
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="heading" style={styles.chromeTitle} numberOfLines={1}>
          {compound?.name ?? "Compound"}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {compound === undefined ? (
          <EmptyState
            icon={<AppText variant="title">?</AppText>}
            title="Not found"
            caption="No compound matches that slug in the reference set."
            action={
              <Button label="Back to Reference" tone="primary" onPress={() => router.back()} />
            }
          />
        ) : (
          <CompoundDetail compound={compound} styles={styles} inkFaint={colors.inkFaint} />
        )}
      </ScrollView>
    </Screen>
  );
}



function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
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
  chromeTitle: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  titleBlock: {
    gap: spacing.sm,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
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
  verifiedChip: {
    backgroundColor: colors.surface,
  },
  unverifiedChip: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBg,
  },
  identityCard: {
    gap: spacing.sm,
  },
  factRow: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  citationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  citationText: {
    flex: 1,
    gap: 2,
  },
});
}
