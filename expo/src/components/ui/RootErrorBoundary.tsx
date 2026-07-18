import React, { Component, useMemo, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { ThemeProvider, useTheme } from "@/src/theme";
import type { ColorTokens } from "@/src/theme/tokens";
import { radius, spacing } from "@/src/theme/tokens";

interface RootErrorBoundaryProps {
  children: ReactNode;
  onRecover?: () => void;
}

interface RootErrorBoundaryState {
  hasError: boolean;
}

/**
 * Calm root fallback — never shows stack traces to users.
 */
export default class RootErrorBoundary extends Component<
  RootErrorBoundaryProps,
  RootErrorBoundaryState
> {
  state: RootErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RootErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[RootErrorBoundary]", error.message, info.componentStack);
  }

  private handleRecover = () => {
    this.setState({ hasError: false });
    this.props.onRecover?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ThemeProvider>
          <ErrorFallback onRecover={this.handleRecover} />
        </ThemeProvider>
      );
    }
    return this.props.children;
  }
}

function ErrorFallback({ onRecover }: { onRecover: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.screen} accessibilityRole="alert">
      <AppText variant="display" style={styles.title}>
        PepRep
      </AppText>
      <AppText variant="heading" style={styles.heading}>
        Something went wrong
      </AppText>
      <AppText variant="body" tone="secondary" style={styles.body}>
        Your records on this device were not erased. Try again — if this keeps happening, force-quit
        the app and reopen.
      </AppText>
      <Pressable
        onPress={onRecover}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        testID="error-boundary-recover"
      >
        <AppText variant="label" weight="semibold" tone="onSolid">
          Try again
        </AppText>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xxl,
      justifyContent: "center",
      gap: spacing.md,
    },
    title: {
      marginBottom: spacing.sm,
    },
    heading: {
      marginBottom: spacing.xs,
    },
    body: {
      marginBottom: spacing.lg,
    },
    button: {
      alignSelf: "flex-start",
      backgroundColor: colors.solid,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      minHeight: 48,
      justifyContent: "center",
    },
  });
}
