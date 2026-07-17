import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

import { useTheme } from "@/src/theme";

type MarkVariant = "default" | "onVolt" | "mono";

interface BoldTallyMarkProps {
  size?: number;
  variant?: MarkVariant;
}

/**
 * Locked Bold Tally monogram — four horizontal strokes + volt slash.
 * Geometry from brand-spec.md (72 viewBox). Never rotate strokes vertical.
 */
export default function BoldTallyMark({
  size = 28,
  variant = "default",
}: BoldTallyMarkProps) {
  const { colors } = useTheme();
  const stroke =
    variant === "onVolt" ? colors.bg : variant === "mono" ? colors.ink : colors.ink;
  const slash =
    variant === "onVolt" ? colors.bg : variant === "mono" ? colors.ink : colors.accent;

  return (
    <Svg width={size} height={size} viewBox="0 0 72 72" fill="none" accessibilityLabel="PepRep">
      <Rect x="10" y="12" width="52" height="9" rx="4.5" fill={stroke} />
      <Rect x="10" y="28" width="52" height="9" rx="4.5" fill={stroke} />
      <Rect x="10" y="44" width="52" height="9" rx="4.5" fill={stroke} />
      <Rect x="10" y="60" width="28" height="9" rx="4.5" fill={stroke} />
      <Path
        d="M46 54l14 18"
        stroke={slash}
        strokeWidth={7}
        strokeLinecap="round"
      />
    </Svg>
  );
}
