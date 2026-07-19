import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import MathSteps from "@/src/components/domain/MathSteps";
import AppText from "@/src/components/ui/AppText";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import ConfirmDialog from "@/src/components/ui/ConfirmDialog";
import EmptyState from "@/src/components/ui/EmptyState";
import Hairline from "@/src/components/ui/Hairline";
import Screen from "@/src/components/ui/Screen";
import Toast from "@/src/components/ui/Toast";
import { snapshotsRepository } from "@/src/db/repositories";
import type { CalcSnapshot, DoseEvent } from "@/src/db/types";
import { fmt } from "@/src/engine";
import { formatDateTime } from "@/src/engine/schedule";
import { siteLabel, statusLabel, stepsFromSnapshotOutputs } from "@/src/history/display";
import { useLedgerStore } from "@/src/store/ledger";
import { useVialsStore } from "@/src/store/vials";
import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

function stringParam(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") return value[0];
  return "";
}

function Fact({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.fact}>
      <AppText variant="overline" tone="faint">
        {label}
      </AppText>
      <AppText variant="label" tone="secondary">
        {value}
      </AppText>
    </View>
  );
}

export default function HistoryEventScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = stringParam(params.id);

  const events = useLedgerStore((state) => state.events);
  const unlogEvent = useLedgerStore((state) => state.unlogEvent);
  const restoreEvent = useLedgerStore((state) => state.restoreEvent);
  const vials = useVialsStore((state) => state.vials);

  const event: DoseEvent | undefined = useMemo(
    () => events.find((candidate) => candidate.id === id),
    [events, id],
  );

  const [snapshot, setSnapshot] = useState<CalcSnapshot | null>(null);
  const [confirmingVoid, setConfirmingVoid] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const voidButtonRef = useRef<{ focus?: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (event?.snapshotId === undefined) {
        setSnapshot(null);
        return;
      }
      const all = await snapshotsRepository.list();
      if (cancelled) return;
      setSnapshot(all.find((item) => item.id === event.snapshotId) ?? null);
    };
    load().catch((error) => console.error("[history/event] snapshot load failed", error));
    return () => {
      cancelled = true;
    };
  }, [event?.snapshotId]);

  const steps = snapshot !== null ? stepsFromSnapshotOutputs(snapshot.outputs) : [];
  const vialName =
    event?.vialId !== undefined
      ? (vials.find((vial) => vial.id === event.vialId)?.name ?? event.vialId)
      : null;
  const site = siteLabel(event?.siteId);

  return (
    <Screen>
      <View style={styles.chrome}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backButton}
          testID="history-event-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={colors.ink} />
        </Pressable>
        <AppText variant="heading" style={styles.chromeTitle} numberOfLines={1}>
          Event
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {event === undefined ? (
          <EmptyState
            icon={<AppText variant="title">?</AppText>}
            title="Event not found"
            caption="This DoseEvent is not in the local ledger."
            action={<Button label="Back" tone="primary" onPress={() => router.back()} />}
          />
        ) : (
          <>
            <View style={styles.titleBlock}>
              <AppText variant="title">{event.compoundName}</AppText>
              <AppText variant="label" mono tone="secondary">
                {fmt(event.doseValue)} {event.doseUnit}
              </AppText>
              <AppText variant="caption" tone="faint">
                Immutable record · {statusLabel(event.status)}
                {event.voidedAt !== undefined ? " · voided" : ""}
              </AppText>
            </View>

            <Card padded={false}>
              <Fact styles={styles} label="When" value={formatDateTime(event.occurredAt)} />
              <Hairline />
              <Fact styles={styles} label="Status" value={statusLabel(event.status)} />
              <Hairline />
              <Fact styles={styles} label="Site" value={site ?? "not recorded"} />
              <Hairline />
              <Fact styles={styles} label="Vial" value={vialName ?? "not recorded"} />
              <Hairline />
              <Fact styles={styles}
                label="Occurrence key"
                value={event.occurrenceKey ?? "not linked to a plan slot"}
              />
              {event.note !== undefined && event.note.length > 0 && (
                <>
                  <Hairline />
                  <Fact styles={styles} label="Note" value={event.note} />
                </>
              )}
              {event.voidedAt !== undefined && (
                <>
                  <Hairline />
                  <Fact styles={styles} label="Voided at" value={formatDateTime(event.voidedAt)} />
                </>
              )}
              {(event.corrections?.length ?? 0) > 0 && (
                <>
                  <Hairline />
                  <Fact
                    styles={styles}
                    label="Correction trail"
                    value={event.corrections!
                      .map((correction) =>
                        `${correction.type === "void" ? "Voided" : "Restored"} ${formatDateTime(correction.occurredAt)}`,
                      )
                      .join(" · ")}
                  />
                </>
              )}
            </Card>

            {snapshot !== null && steps.length > 0 && (
              <View style={styles.section}>
                <AppText variant="overline" tone="faint">
                  Saved calculator steps
                </AppText>
                <Card padded={false}>
                  <View style={styles.mathPad}>
                    <MathSteps steps={steps} />
                  </View>
                </Card>
              </View>
            )}

            {snapshot !== null && steps.length === 0 && (
              <Card>
                <AppText variant="label" tone="secondary">
                  Linked CalcSnapshot has no saved math steps.
                </AppText>
              </Card>
            )}

            {event.status === "completed" && event.voidedAt === undefined && (
              <Button
                ref={(node) => {
                  voidButtonRef.current = node as unknown as { focus?: () => void } | null;
                }}
                label="Un-log (void)"
                tone="ghost"
                onPress={() => setConfirmingVoid(true)}
                testID="unlog-event"
              />
            )}
            {event.voidedAt !== undefined && (
              <Button
                label="Restore voided log"
                tone="ghost"
                onPress={() => {
                  restoreEvent(event.id)
                    .then(() => setToast("Log restored and vial inventory debited once."))
                    .catch((error) => console.error("[history/event] restore failed", error));
                }}
                testID="restore-event"
              />
            )}
          </>
        )}
      </ScrollView>
      <ConfirmDialog
        visible={confirmingVoid && event !== undefined}
        title="Void this logged dose?"
        message={
          event !== undefined
            ? `${event.compoundName} · ${fmt(event.doseValue)} ${event.doseUnit} · ${formatDateTime(event.occurredAt)} · Vial: ${vialName ?? "not recorded"}. This restores linked inventory and keeps the audit record.`
            : ""
        }
        confirmLabel="Void log"
        destructive
        returnFocusRef={voidButtonRef}
        onCancel={() => setConfirmingVoid(false)}
        onConfirm={() => {
          setConfirmingVoid(false);
          if (event === undefined) return;
          unlogEvent(event.id)
            .then(() => setToast("Log voided. Linked inventory was restored."))
            .catch((error) => console.error("[history/event] unlog failed", error));
        }}
        testID="confirm-unlog-event"
      />
      {toast !== null ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}
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
    gap: spacing.xs,
  },
  fact: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  mathPad: {
    paddingVertical: spacing.sm,
  },
});
}
