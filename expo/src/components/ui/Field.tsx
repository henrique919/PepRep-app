import React, { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import type { KeyboardTypeOptions } from "react-native";

import AppText from "@/src/components/ui/AppText";
import { colors, fonts, fontSize, hairlineWidth, radius, spacing } from "@/src/theme/tokens";

interface FieldProps {
  label: string;
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
  value,
  onChangeText,
  suffix,
  placeholder,
  keyboardType = "decimal-pad",
  mono = true,
  accessory,
  testID,
}: FieldProps) {
  const [focused, setFocused] = useState<boolean>(false);

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <AppText variant="overline" tone="faint">
          {label}
        </AppText>
        {accessory}
      </View>
      <View style={[styles.inputRow, focused && styles.focused]}>
        <TextInput
          testID={testID}
          style={[
            styles.input,
            mono ? styles.monoInput : styles.uiInput,
            focused && styles.inputFocused,
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
          <AppText variant="label" mono tone="faint">
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
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSunken,
    borderWidth: hairlineWidth,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  focused: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    fontSize: fontSize.heading,
    color: colors.ink,
    // Explicit fill so web UA dark-mode cannot hide ink (T0.3).
    backgroundColor: colors.surfaceSunken,
    paddingVertical: spacing.sm,
  },
  inputFocused: {
    backgroundColor: colors.surface,
  },
  monoInput: {
    fontFamily: fonts.monoMedium,
  },
  uiInput: {
    fontFamily: fonts.uiMedium,
    fontSize: fontSize.body,
  },
});
