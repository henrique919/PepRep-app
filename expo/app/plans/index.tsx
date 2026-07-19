import { useRouter } from "expo-router";
import { Archive, CalendarDays, ChevronLeft, Pencil, Plus, RotateCcw } from "lucide-react-native";
import React, { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import ConfirmDialog from "@/src/components/ui/ConfirmDialog";
import EmptyState from "@/src/components/ui/EmptyState";
import Screen from "@/src/components/ui/Screen";
import Toast from "@/src/components/ui/Toast";
import type { Plan, ScheduleVersion } from "@/src/db/types";
import { fmt } from "@/src/engine";
import { dayKey, versionActiveOn } from "@/src/engine/schedule";
import { usePlansStore } from "@/src/store/plans";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function activeVersion(plan: Plan): ScheduleVersion | undefined {
  return versionActiveOn(plan, dayKey(new Date().toISOString()));
}

function daysLabel(days: number[]): string {
  if (days.length === 0) return "No days set";
  return days.map((day) => DAY_LABELS[day] ?? String(day)).join(" · ");
}

export default function PlansScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const allPlans = usePlansStore((state) => state.plans);
  const archivePlan = usePlansStore((state) => state.archivePlan);
  const restorePlan = usePlansStore((state) => state.restorePlan);
  const [pendingArchive, setPendingArchive] = useState<Plan | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const archiveRefs = useRef<Record<string, { focus?: () => void } | null>>({});
  const activeReturnFocusRef = useRef<{ focus?: () => void } | null>(null);

  const plans = useMemo(
    () => allPlans.filter((plan) => plan.archivedAt === undefined),
    [allPlans],
  );
  const archivedPlans = useMemo(
    () => allPlans.filter((plan) => plan.archivedAt !== undefined),
    [allPlans],
  );

  const rows = useMemo(
    () =>
      plans.map((plan) => ({
        plan,
        version: activeVersion(plan),
      })),
    [plans],
  );

  return (
    <Screen>
      <View style={styles.chrome}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backButton}
          testID="plans-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.chromeText}>
          <AppText variant="heading">Plans</AppText>
        </View>
        <Button
          label="New"
          tone="accent"
          compact
          onPress={() => router.push("/plans/new")}
          icon={<Plus size={16} color={colors.onAccent} />}
          testID="open-plan-new"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {rows.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={28} color={colors.inkFaint} />}
            title="No plans yet"
            caption="Create a plan with the days and times you choose. Nothing is suggested."
            action={
              <Button
                label="Create a plan"
                tone="primary"
                onPress={() => router.push("/plans/new")}
              />
            }
          />
        ) : (
          rows.map(({ plan, version }) => (
            <Card key={plan.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardText}>
                  <AppText variant="heading" numberOfLines={1}>
                    {version?.name ?? plan.compoundName}
                  </AppText>
                  <AppText variant="label" mono tone="secondary">
                    {version !== undefined
                      ? `${version.name === plan.compoundName ? "" : `${plan.compoundName} · `}${fmt(version.doseValue)} ${version.doseUnit}`
                      : plan.compoundName}
                  </AppText>
                  {version !== undefined && (
                    <>
                      <AppText variant="caption" tone="faint">
                        {daysLabel(version.daysOfWeek)}
                      </AppText>
                      <AppText variant="caption" mono tone="faint">
                        {version.timesLocal.join(" · ") || "No times set"}
                      </AppText>
                    </>
                  )}
                </View>
                <View style={styles.cardActions}>
                  <Pressable
                    onPress={() => router.push({ pathname: "/plans/new", params: { planId: plan.id } })}
                    hitSlop={8}
                    style={styles.archiveButton}
                    testID={`edit-plan-${plan.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit plan ${version?.name ?? plan.compoundName}`}
                  >
                    <Pencil size={16} color={colors.ink} />
                  </Pressable>
                  <Pressable
                    ref={(node) => {
                      archiveRefs.current[plan.id] = node as unknown as { focus?: () => void } | null;
                    }}
                    onPress={() => {
                      activeReturnFocusRef.current = archiveRefs.current[plan.id];
                      setPendingArchive(plan);
                    }}
                    hitSlop={8}
                    style={styles.archiveButton}
                    testID={`archive-plan-${plan.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Archive plan ${plan.compoundName}`}
                  >
                    <Archive size={16} color={colors.inkFaint} />
                  </Pressable>
                </View>
              </View>
            </Card>
          ))
        )}

        {archivedPlans.length > 0 ? (
          <View style={styles.archivedSection}>
            <AppText variant="overline" tone="secondary">Archived plans</AppText>
            {archivedPlans.map((plan) => (
              <Card key={plan.id} style={styles.archivedCard}>
                <View style={styles.cardText}>
                  <AppText variant="label" weight="semibold">{plan.compoundName}</AppText>
                  <AppText variant="caption" tone="secondary">Archived · future occurrences paused</AppText>
                </View>
                <Button
                  label="Restore"
                  tone="ghost"
                  compact
                  icon={<RotateCcw size={15} color={colors.ink} />}
                  onPress={() => {
                    restorePlan(plan.id)
                      .then(() => setToast({ message: `Restored ${plan.compoundName}` }))
                      .catch((error) => console.error("[plans] Failed to restore", error));
                  }}
                  testID={`restore-plan-${plan.id}`}
                />
              </Card>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={pendingArchive !== null}
        title="Archive this plan?"
        message={
          pendingArchive !== null
            ? `${activeVersion(pendingArchive)?.name ?? pendingArchive.compoundName} will stop creating future occurrences. Logged history stays unchanged.`
            : ""
        }
        confirmLabel="Archive plan"
        destructive
        returnFocusRef={activeReturnFocusRef}
        onCancel={() => setPendingArchive(null)}
        onConfirm={() => {
          const plan = pendingArchive;
          setPendingArchive(null);
          if (plan === null) return;
          archivePlan(plan.id)
            .then(() =>
              setToast({
                message: `Archived ${plan.compoundName}`,
                actionLabel: "Undo",
                onAction: () => {
                  restorePlan(plan.id)
                    .then(() => setToast({ message: `Restored ${plan.compoundName}` }))
                    .catch((error) => console.error("[plans] Failed to undo archive", error));
                },
              }),
            )
            .catch((error) => console.error("[plans] Failed to archive", error));
        }}
        testID="confirm-archive-plan"
      />
      {toast !== null ? (
        <Toast
          message={toast.message}
          actionLabel={toast.actionLabel}
          onAction={toast.onAction}
          onDismiss={() => setToast(null)}
        />
      ) : null}
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
  chromeText: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  archiveButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  cardActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  archivedSection: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  archivedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
});
}
