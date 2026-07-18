import React, { useId, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import type { KeyboardTypeOptions } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme";
import { fonts, fontSize, spacing } from "@/src/theme/tokens";

interface FieldProps {
  label: string;
  /** Secondary hint on the right of the label row (design field-label-hint). */
  hint?: string;
  value: string;
  onChangeText: (text: string) => void;
  /** Unit suffix rendered inside the input ("mg", "mL", "units"). */
  suffix?: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  /** Numeric fields render in IBM Plex Mono. */
  mono?: boolean;
  accessory?: React.ReactNode;
  /** Optional error text announced to assistive tech. */
  error?: string;
  secureTextEntry?: boolean;
  testID?: string;
}

export default function Field({
  label,
  hint,
  value,
  onChangeText,
  suffix,
  placeholder,
  keyboardType = "decimal-pad",
  mono = true,
  accessory,
  error,
  secureTextEntry = false,
  testID,
}: FieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState<boolean>(false);
  const reactId = useId();
  const inputId = `field-${reactId.replace(/:/g, "")}`;
  const accessibilityLabel =
    suffix !== undefined && suffix.length > 0 ? `${label}, ${suffix}` : label;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <AppText variant="overline" tone="secondary" style={styles.label} nativeID={`${inputId}-label`}>
          {label}
        </AppText>
        {hint ? (
          <AppText variant="caption" mono tone="faint">
            {hint}
          </AppText>
        ) : null}
        {accessory}
      </View>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.dangerInk : focused ? colors.ink : colors.hairline,
          },
        ]}
      >
        <TextInput
          testID={testID}
          nativeID={inputId}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={hint}
          accessibilityState={{ disabled: false }}
          style={[
            styles.input,
            { color: colors.ink, backgroundColor: colors.surface },
            mono ? styles.monoInput : styles.uiInput,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkFaint}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize={mono || secureTextEntry ? "none" : "sentences"}
          autoCorrect={!mono && !secureTextEntry}
          secureTextEntry={secureTextEntry}
          textContentType={secureTextEntry ? "password" : undefined}
        />
        {suffix !== undefined && (
          <AppText variant="label" mono weight="semibold" tone="secondary" importantForAccessibility="no">
            {suffix}
          </AppText>
        )}
      </View>
      {error !== undefined && error.length > 0 ? (
        <AppText
          variant="caption"
          tone="danger"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          testID={testID !== undefined ? `${testID}-error` : undefined}
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  label: {
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 26,
    paddingVertical: spacing.xs,
  },
  monoInput: {
    fontFamily: fonts.monoMedium,
  },
  uiInput: {
    fontFamily: fonts.uiMedium,
    fontSize: fontSize.body,
  },
});
