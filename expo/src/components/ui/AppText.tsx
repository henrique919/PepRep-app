import React from "react";
import { StyleSheet, Text } from "react-native";
import type { TextProps, TextStyle } from "react-native";

import { colors, fonts, fontSize, letterSpacing, lineHeight } from "@/src/theme/tokens";

type Variant =
  | "display"
  | "title"
  | "heading"
  | "body"
  | "label"
  | "caption"
  | "overline"
  | "readout"
  | "gauge";
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
    variant === "display" || variant === "title" || variant === "readout"
      ? "bold"
      : variant === "heading" || variant === "gauge"
        ? "semibold"
        : variant === "overline"
          ? "semibold"
          : "regular";
  const finalWeight = weight ?? defaultWeight;
  const fontFamily = mono || variant === "readout" || variant === "gauge"
    ? monoFamily[finalWeight]
    : uiFamily[finalWeight];

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
  display: {
    fontSize: fontSize.display,
    lineHeight: lineHeight.display,
  },
  title: {
    fontSize: fontSize.title,
    lineHeight: lineHeight.title,
  },
  heading: {
    fontSize: fontSize.heading,
    lineHeight: lineHeight.heading,
  },
  body: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
  },
  label: {
    fontSize: fontSize.label,
    lineHeight: lineHeight.label,
  },
  caption: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
  },
  overline: {
    fontSize: fontSize.overline,
    lineHeight: lineHeight.overline,
    letterSpacing: letterSpacing.overline,
    textTransform: "uppercase",
  },
  readout: {
    fontSize: fontSize.readout,
    lineHeight: lineHeight.readout,
    letterSpacing: letterSpacing.readout,
    fontVariant: ["tabular-nums"],
  },
  gauge: {
    fontSize: fontSize.gauge,
    lineHeight: lineHeight.gauge,
    letterSpacing: letterSpacing.tight,
    fontVariant: ["tabular-nums"],
  },
});
