import { useRouter, type Href } from "expo-router";
import {
  BookOpenText,
  ChevronRight,
  CircleHelp,
  Download,
  Info,
  MapPin,
  MessageCircleQuestion,
  Settings2,
  Shield,
  Trash2,
  TrendingUp,
} from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import BoldTallyMark from "@/src/components/ui/BoldTallyMark";
import Screen from "@/src/components/ui/Screen";
import { ASK_V1_ENABLED } from "@/src/ask/feature";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

type MenuRow = {
  label: string;
  icon: React.ReactNode;
  href?: Href;
  onPress?: () => void;
  badge?: string;
  destructive?: boolean;
  trailing?: "chevron" | "switch";
  switchValue?: boolean;
  onSwitch?: (value: boolean) => void;
};

function MenuSection({
  title,
  rows,
  colors,
}: {
  title: string;
  rows: MenuRow[];
  colors: ColorTokens;
}) {
  return (
    <View style={styles.section}>
      <AppText variant="label" weight="semibold" tone="secondary" style={styles.sectionTitle}>
        {title}
      </AppText>
      <View style={[styles.sectionCard, { borderColor: colors.hairline, backgroundColor: colors.surface }]}>
        {rows.map((row, index) => (
          <Pressable
            key={row.label}
            disabled={row.trailing === "switch"}
            onPress={row.onPress}
            accessibilityRole="button"
            accessibilityLabel={row.label}
            accessibilityState={{ disabled: row.trailing === "switch" }}
            style={({ pressed }) => [
              styles.row,
              index < rows.length - 1 && {
                borderBottomWidth: hairlineWidth,
                borderBottomColor: colors.hairline,
              },
              pressed && row.trailing !== "switch" && { opacity: 0.7 },
            ]}
          >
            <View style={styles.rowIcon}>{row.icon}</View>
            <AppText
              variant="body"
              weight="medium"
              style={[styles.rowLabel, row.destructive ? { color: colors.dangerInk } : null]}
            >
              {row.label}
            </AppText>
            {row.badge ? (
              <View style={[styles.badge, { backgroundColor: colors.surfaceSunken }]}>
                <AppText variant="overline" tone="secondary">
                  {row.badge}
                </AppText>
              </View>
            ) : null}
            {row.trailing === "switch" ? (
              <Switch
                value={row.switchValue}
                onValueChange={row.onSwitch}
                trackColor={{ false: colors.surfaceSunken, true: colors.solid }}
                thumbColor={colors.surface}
                accessibilityLabel={row.label}
                accessibilityState={{ checked: row.switchValue === true }}
              />
            ) : (
              <ChevronRight size={18} color={row.destructive ? colors.dangerInk : colors.inkFaint} />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function MoreScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const go = (href: Href) => () => router.push(href);

  const libraryRows: MenuRow[] = [
    {
      label: "Compound reference",
      icon: <BookOpenText size={20} color={colors.ink} strokeWidth={1.6} />,
      onPress: go("/(tabs)/reference" as Href),
    },
    {
      label: "Glossary",
      icon: <CircleHelp size={20} color={colors.ink} strokeWidth={1.6} />,
      onPress: go("/(tabs)/reference/glossary" as Href),
    },
    ...(ASK_V1_ENABLED
      ? [
          {
            label: "Ask",
            icon: <MessageCircleQuestion size={20} color={colors.ink} strokeWidth={1.6} />,
            onPress: go("/(tabs)/reference/ask" as Href),
          } satisfies MenuRow,
        ]
      : []),
    {
      label: "Injection sites",
      icon: <MapPin size={20} color={colors.ink} strokeWidth={1.6} />,
      onPress: go("/sites" as Href),
    },
    {
      label: "Progress",
      icon: <TrendingUp size={20} color={colors.ink} strokeWidth={1.6} />,
      onPress: go("/progress" as Href),
    },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppText variant="overline" tone="secondary">
          More
        </AppText>
        <AppText variant="display" style={styles.title}>
          Settings
        </AppText>

        <View style={[styles.profile, { borderBottomColor: colors.hairline }]}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceSunken }]}>
            <BoldTallyMark size={28} />
          </View>
          <View style={styles.profileText}>
            <AppText variant="heading" weight="semibold">
              PepRep user
            </AppText>
            <AppText variant="caption" tone="secondary">
              Data stays on your device · export any time
            </AppText>
          </View>
        </View>

        <MenuSection title="Library" colors={colors} rows={libraryRows} />

        <MenuSection
          title="Preferences"
          colors={colors}
          rows={[
            {
              label: "All settings",
              icon: <Settings2 size={20} color={colors.ink} strokeWidth={1.6} />,
              onPress: go("/settings" as Href),
            },
            {
              label: "Privacy & safety",
              icon: <Shield size={20} color={colors.ink} strokeWidth={1.6} />,
              onPress: go("/settings" as Href),
            },
            {
              label: "About PepRep",
              icon: <Info size={20} color={colors.ink} strokeWidth={1.6} />,
              onPress: go("/about" as Href),
            },
          ]}
        />

        <MenuSection
          title="Data"
          colors={colors}
          rows={[
            {
              label: "Export / manage data",
              icon: <Download size={20} color={colors.ink} strokeWidth={1.6} />,
              onPress: go("/settings" as Href),
            },
            {
              label: "Clear all data",
              icon: <Trash2 size={20} color={colors.dangerInk} strokeWidth={1.6} />,
              onPress: go("/settings" as Href),
              destructive: true,
            },
          ]}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  title: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingBottom: spacing.lg,
    marginBottom: spacing.lg,
    borderBottomWidth: hairlineWidth,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  section: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  sectionTitle: {
    letterSpacing: 0.4,
  },
  sectionCard: {
    borderRadius: radius.lg,
    borderWidth: hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  rowIcon: {
    width: 28,
    alignItems: "center",
  },
  rowLabel: {
    flex: 1,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
});
