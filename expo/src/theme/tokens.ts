/**
 * PepRep design tokens — the only source of colours, spacing, radii and type.
 * Aesthetic: precision instrument. Warm paper, warm near-black ink, one
 * signal-orange accent. Numerals are always IBM Plex Mono.
 */

export const colors = {
  bg: "#F4F1EA",
  surface: "#FFFFFF",
  surfaceSunken: "#EBE7DD",
  panel: "#22201C",
  panelRaised: "#2C2A25",
  ink: "#1C1B18",
  inkSecondary: "#5B564C",
  inkFaint: "#8F897C",
  onDark: "#F4F1EA",
  onDarkSecondary: "#B7B1A4",
  hairline: "#E1DCD0",
  hairlineDark: "#3A372F",
  accent: "#E1580E",
  accentPressed: "#C44A09",
  accentSoft: "#FAE9DE",
  onAccent: "#FFFFFF",
  warnBg: "#FAF3DF",
  warnBorder: "#E8D9A8",
  warnInk: "#7A5D10",
  dangerInk: "#9C3A2E",
  dangerBg: "#F8E9E5",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const fontSize = {
  caption: 12,
  label: 13,
  body: 15,
  heading: 17,
  title: 22,
  display: 30,
  gauge: 44,
} as const;

export const fonts = {
  ui: "Inter_400Regular",
  uiMedium: "Inter_500Medium",
  uiSemiBold: "Inter_600SemiBold",
  uiBold: "Inter_700Bold",
  mono: "IBMPlexMono_400Regular",
  monoMedium: "IBMPlexMono_500Medium",
  monoSemiBold: "IBMPlexMono_600SemiBold",
} as const;

export const hairlineWidth = 1 as const;

/** Standard quiet disclaimer shown in the calculator footer and About. */
export const DISCLAIMER =
  "PepRep is a measurement tool. It is not medical advice and does not recommend doses.";
