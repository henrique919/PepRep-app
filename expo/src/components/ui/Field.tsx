import React, { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import type { KeyboardTypeOptions } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { useTheme } from "@/src/theme";
import { fonts, fontSize, hairlineWidth, radius, spacing } from "@/src/theme/tokens";

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
  testID,
}: FieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState<boolean>(false);

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <AppText variant="overline" tone="secondary" style={styles.label}>
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
            borderColor: focused ? colors.ink : colors.hairline,
          },
        ]}
      >
        <TextInput
          testID={testID}
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
          autoCapitalize={mono ? "none" : "sentences"}
          autoCorrect={!mono}
        />
        {suffix !== undefined && (
          <AppText variant="label" mono weight="semibold" tone="secondary">
            {suffix}
          </AppText>
        )}
      </View>
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
  },
  input: {
    flex: 1,
    fontSize: 26,
    paddingVertical: spacing.sm,
  },
  monoInput: {
    fontFamily: fonts.monoMedium,
  },
  uiInput: {
    fontFamily: fonts.uiMedium,
    fontSize: fontSize.body,
  },
});
