import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";

import AppText from "@/src/components/ui/AppText";
import type { InjectionSite } from "@/src/db/models";
import { SITE_LABELS } from "@/src/db/models";
import { colors, spacing } from "@/src/theme/tokens";

interface SitePickerProps {
  value: InjectionSite | null;
  onChange: (site: InjectionSite | null) => void;
  /** Sites the user logged most recently, newest first (display only). */
  recentSites?: InjectionSite[];
}

interface SitePoint {
  site: InjectionSite;
  x: number;
  y: number;
}

const MAP_W = 200;
const MAP_H = 320;
const HIT_SIZE = 44;

const SITE_POINTS: SitePoint[] = [
  { site: "deltoid-left", x: 48, y: 76 },
  { site: "deltoid-right", x: 152, y: 76 },
  { site: "abdomen-left", x: 82, y: 128 },
  { site: "abdomen-right", x: 118, y: 128 },
  { site: "glute-left", x: 80, y: 186 },
  { site: "glute-right", x: 120, y: 186 },
  { site: "thigh-left", x: 83, y: 252 },
  { site: "thigh-right", x: 117, y: 252 },
];

/**
 * Schematic body map for recording where an injection went.
 * Purely a record-keeping control — it suggests nothing.
 * Tap handling lives in overlaid Pressables (not SVG onPress, which leaks
 * unsupported responder props to the DOM on web).
 */
export default function SitePicker({ value, onChange, recentSites = [] }: SitePickerProps) {
  const lastUsed = recentSites.length > 0 ? recentSites[0] : undefined;

  const select = (site: InjectionSite) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => undefined);
    }
    onChange(value === site ? null : site);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.map}>
        <Svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
          {/* schematic figure */}
          <Circle cx={100} cy={30} r={17} fill="none" stroke={colors.hairline} strokeWidth={1.5} />
          <Rect x={64} y={54} width={72} height={104} rx={18} fill={colors.surface} stroke={colors.hairline} strokeWidth={1.5} />
          <Rect x={38} y={60} width={19} height={78} rx={9} fill={colors.surface} stroke={colors.hairline} strokeWidth={1.5} />
          <Rect x={143} y={60} width={19} height={78} rx={9} fill={colors.surface} stroke={colors.hairline} strokeWidth={1.5} />
          <Rect x={66} y={164} width={68} height={42} rx={14} fill={colors.surface} stroke={colors.hairline} strokeWidth={1.5} />
          <Rect x={70} y={212} width={26} height={100} rx={12} fill={colors.surface} stroke={colors.hairline} strokeWidth={1.5} />
          <Rect x={104} y={212} width={26} height={100} rx={12} fill={colors.surface} stroke={colors.hairline} strokeWidth={1.5} />

          {/* site markers (visual only) */}
          {SITE_POINTS.map((point) => {
            const selected = value === point.site;
            const wasLast = lastUsed === point.site;
            return (
              <React.Fragment key={point.site}>
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={12}
                  fill={selected ? colors.accent : colors.bg}
                  stroke={selected ? colors.accent : wasLast ? colors.inkSecondary : colors.inkFaint}
                  strokeWidth={selected ? 2 : 1.4}
                  strokeDasharray={wasLast && !selected ? "3 2" : undefined}
                />
                {selected && <Circle cx={point.x} cy={point.y} r={4} fill={colors.onAccent} />}
              </React.Fragment>
            );
          })}
        </Svg>

        {/* tap targets overlaid on the map */}
        {SITE_POINTS.map((point) => (
          <Pressable
            key={`hit-${point.site}`}
            onPress={() => select(point.site)}
            accessibilityRole="button"
            accessibilityLabel={SITE_LABELS[point.site]}
            accessibilityState={{ selected: value === point.site }}
            style={[
              styles.hitArea,
              { left: point.x - HIT_SIZE / 2, top: point.y - HIT_SIZE / 2 },
            ]}
            testID={`site-${point.site}`}
          />
        ))}
      </View>

      <AppText variant="label" tone={value !== null ? "ink" : "faint"} weight="medium">
        {value !== null ? SITE_LABELS[value] : "Tap a site to record it (optional)"}
      </AppText>
      {lastUsed !== undefined && (
        <AppText variant="caption" tone="faint">
          Dashed ring = your last recorded site ({SITE_LABELS[lastUsed]})
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.sm,
  },
  map: {
    width: MAP_W,
    height: MAP_H,
  },
  hitArea: {
    position: "absolute",
    width: HIT_SIZE,
    height: HIT_SIZE,
  },
});
