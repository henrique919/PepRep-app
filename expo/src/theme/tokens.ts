/**
 * PepRep design tokens — the only source of colours, spacing, radii and type.
 * Aesthetic: precision instrument. Warm-paper light is the default; dark is a
 * designed warm charcoal counterpart (not a browser UA recolour).
 */

export type ColorTokens = {
  bg: string;
  surface: string;
  surfaceSunken: string;
  panel: string;
  panelRaised: string;
  ink: string;
  inkSecondary: string;
  inkFaint: string;
  onDark: string;
  onDarkSecondary: string;
  /** Solid control fill (primary buttons). Opposite of page text contrast. */
  solid: string;
  onSolid: string;
  hairline: string;
  hairlineDark: string;
  accent: string;
  accentPressed: string;
  accentSoft: string;
  onAccent: string;
  /** Barrel fluid — accent with body so the column reads as liquid. */
  fluid: string;
  fluidOverflow: string;
  shadow: string;
  warnBg: string;
  warnBorder: string;
  warnInk: string;
  dangerInk: string;
  dangerBg: string;
};

/** Warm paper — default when the system scheme is unset or light. */
export const lightColors: ColorTokens = {
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
  solid: "#1C1B18",
  onSolid: "#F4F1EA",
  hairline: "#E1DCD0",
  hairlineDark: "#3A372F",
  accent: "#E1580E",
  accentPressed: "#C44A09",
  accentSoft: "#FAE9DE",
  onAccent: "#FFFFFF",
  fluid: "#E36A2A",
  fluidOverflow: "#B85A4A",
  shadow: "#1C1B18",
  warnBg: "#FAF3DF",
  warnBorder: "#E8D9A8",
  warnInk: "#7A5D10",
  dangerInk: "#9C3A2E",
  dangerBg: "#F8E9E5",
};

/** Warm charcoal dark — same accent, inverted surfaces/ink. */
export const darkColors: ColorTokens = {
  bg: "#141311",
  surface: "#1E1C18",
  surfaceSunken: "#181612",
  panel: "#2A2823",
  panelRaised: "#34312B",
  ink: "#F2EDE4",
  inkSecondary: "#B7B1A4",
  inkFaint: "#8F897C",
  onDark: "#F2EDE4",
  onDarkSecondary: "#B7B1A4",
  solid: "#F2EDE4",
  onSolid: "#141311",
  hairline: "#3A372F",
  hairlineDark: "#4A463C",
  accent: "#E1580E",
  accentPressed: "#C44A09",
  accentSoft: "#3D2418",
  onAccent: "#FFFFFF",
  fluid: "#E36A2A",
  fluidOverflow: "#B85A4A",
  shadow: "#000000",
  warnBg: "#3A3420",
  warnBorder: "#5C4E28",
  warnInk: "#E8D9A8",
  dangerInk: "#E8A090",
  dangerBg: "#3A2420",
};

/**
 * Light palette alias for rare non-React call sites.
 * UI must prefer `useTheme().colors` so dark mode is honoured.
 */
export const colors: ColorTokens = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  section: 20,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const fontSize = {
  overline: 11,
  caption: 12,
  label: 13,
  body: 15,
  heading: 17,
  title: 22,
  display: 30,
  gauge: 44,
  readout: 56,
} as const;

export const letterSpacing = {
  tight: -0.4,
  readout: -1.6,
  overline: 1.5,
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
