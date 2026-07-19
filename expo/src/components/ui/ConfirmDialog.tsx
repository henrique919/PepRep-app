import React, { useCallback, useRef } from "react";
import {
  AccessibilityInfo,
  findNodeHandle,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { hairlineWidth, radius, spacing } from "@/src/theme/tokens";

import AppText from "./AppText";
import Button from "./Button";

type FocusTarget = { focus?: () => void } | null;

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  returnFocusRef?: React.RefObject<FocusTarget>;
  testID?: string;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
  returnFocusRef,
  testID,
}: ConfirmDialogProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const dialogRef = useRef<View>(null);

  const restoreFocus = useCallback(() => {
    setTimeout(() => returnFocusRef?.current?.focus?.(), 0);
  }, [returnFocusRef]);

  const cancel = useCallback(() => {
    onCancel();
    restoreFocus();
  }, [onCancel, restoreFocus]);

  const confirm = useCallback(() => {
    onConfirm();
    restoreFocus();
  }, [onConfirm, restoreFocus]);

  const focusDialog = useCallback(() => {
    const handle = findNodeHandle(dialogRef.current);
    if (handle !== null) AccessibilityInfo.setAccessibilityFocus(handle);
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={cancel}
      onShow={focusDialog}
      statusBarTranslucent
    >
      <View style={styles.overlay} accessibilityViewIsModal>
        <Pressable style={StyleSheet.absoluteFill} onPress={cancel} accessibilityElementsHidden />
        <View
          ref={dialogRef}
          style={styles.dialog}
          accessibilityRole="alert"
          accessibilityLabel={`${title}. ${message}`}
          testID={testID}
        >
          <AppText variant="heading">{title}</AppText>
          <AppText variant="body" tone="secondary">
            {message}
          </AppText>
          <View style={styles.actions}>
            <Button label={cancelLabel} tone="ghost" compact onPress={cancel} />
            <Button
              label={confirmLabel}
              tone={destructive ? "danger" : "primary"}
              compact
              onPress={confirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
      backgroundColor: "rgba(8, 8, 11, 0.72)",
    },
    dialog: {
      width: "100%",
      maxWidth: 440,
      gap: spacing.md,
      padding: spacing.xl,
      borderRadius: radius.lg,
      borderWidth: hairlineWidth,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
  });
}
