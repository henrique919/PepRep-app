import React from "react";
import { StyleSheet, Text } from "react-native";
import type { TextProps, TextStyle } from "react-native";

import { colors, fonts, fontSize } from "@/src/theme/tokens";

type Variant = "display" | "title" | "heading" | "body" | "label" | "caption" | "overline";
type Tone =
  | "ink"
  | "secondary"
  | "faint"
  | "accent"
  | "onDark"
  | "onDarkSecondary"
  | "onAccent"
  | "warn"
  | "danger";
type Weight = "regular" | "medium" | "semibold" | "bold";

interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  weight?: Weight;
  /** Numerals must always be mono (IBM Plex Mono, tabular by nature). */
  mono?: boolean;
}

const toneColor: Record<Tone, string> = {
  ink: colors.ink,
  secondary: colors.inkSecondary,
  faint: colors.inkFaint,
  accent: colors.accent,
  onDark: colors.onDark,
  onDarkSecondary: colors.onDarkSecondary,
  onAccent: colors.onAccent,
  warn: colors.warnInk,
  danger: colors.dangerInk,
};

const uiFamily: Record<Weight, string> = {
  regular: fonts.ui,
  medium: fonts.uiMedium,
  semibold: fonts.uiSemiBold,
  bold: fonts.uiBold,
};

const monoFamily: Record<Weight, string> = {
  regular: fonts.mono,
  medium: fonts.monoMedium,
  semibold: fonts.monoSemiBold,
  bold: fonts.monoSemiBold,
};

export default function AppText({
  variant = "body",
  tone = "ink",
  weight,
  mono = false,
  style,
  children,
  ...rest
}: AppTextProps) {
  const defaultWeight: Weight =
    variant === "display" || variant === "title"
      ? "bold"
      : variant === "heading"
        ? "semibold"
        : variant === "overline"
          ? "semibold"
          : "regular";
  const finalWeight = weight ?? defaultWeight;
  const fontFamily = mono ? monoFamily[finalWeight] : uiFamily[finalWeight];

  const composed: TextStyle = {
    ...styles[variant],
    fontFamily,
    color: toneColor[tone],
  };

  return (
    <Text {...rest} style={[composed, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  display: { fontSize: fontSize.display, lineHeight: 36 },
  title: { fontSize: fontSize.title, lineHeight: 28 },
  heading: { fontSize: fontSize.heading, lineHeight: 24 },
  body: { fontSize: fontSize.body, lineHeight: 22 },
  label: { fontSize: fontSize.label, lineHeight: 18 },
  caption: { fontSize: fontSize.caption, lineHeight: 17 },
  overline: { fontSize: 11, lineHeight: 14, letterSpacing: 1.4, textTransform: "uppercase" },
});
