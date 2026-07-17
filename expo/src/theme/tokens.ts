/**
 * PepRep design tokens — Mineral Protocol (D2).
 * Warm bone surfaces, carbon ink, single volt accent.
 * Source: design/screens/Inbedded/brand-spec.md
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
  /** Carbon solid — primary button fill. */
  solid: string;
  /** Label on carbon: volt (Mineral) or bone. */
  onSolid: string;
  hairline: string;
  hairlineDark: string;
  /** Volt lime accent. */
  accent: string;
  accentPressed: string;
  accentSoft: string;
  onAccent: string;
  /** Barrel fluid — volt with body. */
  fluid: string;
  fluidOverflow: string;
  shadow: string;
  success: string;
  successBg: string;
  warnBg: string;
  warnBorder: string;
  warnInk: string;
  dangerInk: string;
  dangerBg: string;
  infoBg: string;
  infoInk: string;
  stateLogged: string;
  stateDue: string;
  stateSkipped: string;
  stateMissed: string;
};

/** Mineral Protocol light — default. */
export const lightColors: ColorTokens = {
  bg: "#F3F0E8",
  surface: "#FAF9F5",
  surfaceSunken: "#EDEADF",
  panel: "#16161A",
  panelRaised: "#1C1C22",
  ink: "#16161A",
  inkSecondary: "#6B6A72",
  inkFaint: "#9A98A0",
  onDark: "#F2F1EE",
  onDarkSecondary: "#A8A6AE",
  solid: "#16161A",
  onSolid: "#E8FF47",
  hairline: "#E4E0D6",
  hairlineDark: "#2E2E36",
  accent: "#E8FF47",
  accentPressed: "#D4EF3A",
  accentSoft: "#F0FF9A",
  onAccent: "#1A1C0E",
  fluid: "#E8FF47",
  fluidOverflow: "#C43C2E",
  shadow: "#16161A",
  success: "#2F9D5C",
  successBg: "#E6F5EC",
  warnBg: "#FDF0D0",
  warnBorder: "#F0D896",
  warnInk: "#5C4008",
  dangerInk: "#C43C2E",
  dangerBg: "#FDE8E6",
  infoBg: "#E8EEFC",
  infoInk: "#1E3A6E",
  stateLogged: "#2F9D5C",
  stateDue: "#E8FF47",
  stateSkipped: "#9A98A0",
  stateMissed: "#C43C2E",
};

/** Mineral Protocol dark. */
export const darkColors: ColorTokens = {
  bg: "#141418",
  surface: "#1C1C22",
  surfaceSunken: "#25252C",
  panel: "#25252C",
  panelRaised: "#2E2E36",
  ink: "#F2F1EE",
  inkSecondary: "#A8A6AE",
  inkFaint: "#6B6A72",
  onDark: "#F2F1EE",
  onDarkSecondary: "#A8A6AE",
  solid: "#E8FF47",
  onSolid: "#1A1C0E",
  hairline: "#2E2E36",
  hairlineDark: "#3A3A44",
  accent: "#EFFF66",
  accentPressed: "#E8FF47",
  accentSoft: "#3A4020",
  onAccent: "#1A1C0E",
  fluid: "#EFFF66",
  fluidOverflow: "#C43C2E",
  shadow: "#000000",
  success: "#2F9D5C",
  successBg: "#1A2E22",
  warnBg: "#3A3420",
  warnBorder: "#5C4E28",
  warnInk: "#F0D896",
  dangerInk: "#E8A090",
  dangerBg: "#3A2420",
  infoBg: "#1A2438",
  infoInk: "#A8C0F0",
  stateLogged: "#2F9D5C",
  stateDue: "#EFFF66",
  stateSkipped: "#6B6A72",
  stateMissed: "#C43C2E",
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
  huge: 48,
  massive: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const fontSize = {
  overline: 11,
  caption: 12,
  label: 13,
  body: 15,
  heading: 17,
  title: 22,
  display: 28,
  gauge: 44,
  readout: 56,
} as const;

export const letterSpacing = {
  tight: -0.8,
  readout: -1.6,
  overline: 0.66,
  button: 0.28,
} as const;

export const fonts = {
  ui: "DMSans_400Regular",
  uiMedium: "DMSans_500Medium",
  uiSemiBold: "DMSans_600SemiBold",
  uiBold: "DMSans_700Bold",
  display: "Syne_700Bold",
  displaySemi: "Syne_600SemiBold",
  displayExtra: "Syne_800ExtraBold",
  mono: "IBMPlexMono_400Regular",
  monoMedium: "IBMPlexMono_500Medium",
  monoSemiBold: "IBMPlexMono_600SemiBold",
} as const;

export const motion = {
  durationMs: 180,
  easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
} as const;

export const hairlineWidth = 1 as const;

/** Standard quiet disclaimer shown in the calculator footer and About. */
export const DISCLAIMER =
  "PepRep is a measurement tool. It is not medical advice and does not recommend doses.";
