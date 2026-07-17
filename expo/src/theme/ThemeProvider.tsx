/**
 * Theme hook — light (warm paper) by default; dark when useColorScheme() === 'dark'.
 */

import createContextHook from "@nkzw/create-context-hook";
import { useColorScheme } from "react-native";

import { darkColors, lightColors } from "@/src/theme/tokens";
import type { ColorTokens } from "@/src/theme/tokens";

export type ThemeMode = "light" | "dark";

export interface Theme {
  mode: ThemeMode;
  colors: ColorTokens;
  isDark: boolean;
}

function resolveTheme(scheme: string | null | undefined): Theme {
  const isDark = scheme === "dark";
  return {
    mode: isDark ? "dark" : "light",
    colors: isDark ? darkColors : lightColors,
    isDark,
  };
}

const lightDefault = resolveTheme("light");

export const [ThemeProvider, useTheme] = createContextHook<Theme>(() => {
  return resolveTheme(useColorScheme());
}, lightDefault);
