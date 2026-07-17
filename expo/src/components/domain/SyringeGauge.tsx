import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Line, Path, Rect, Text as SvgText } from "react-native-svg";

import type { SyringeCapacity } from "@/src/engine";
import { fmt } from "@/src/engine";
import { buildSyringeGauge } from "@/src/engine/syringe";
import { colors, fonts } from "@/src/theme/tokens";

interface SyringeGaugeProps {
  units: number;
  capacity: SyringeCapacity;
}

const VIEW_W = 360;
const VIEW_H = 134;
const BARREL_X = 58;
const BARREL_W = 266;
const BARREL_Y = 42;
const BARREL_H = 46;
const CY = BARREL_Y + BARREL_H / 2;
const ROD_END_X = 338;

/**
 * A realistic horizontal U-100 syringe: needle on the left, plunger on the
 * right, pale liquid fill up to the draw with a red marker above it. All
 * geometry comes from the engine's gauge model — this component never
 * computes units or volumes itself.
 */
export default function SyringeGauge({ units, capacity }: SyringeGaugeProps) {
  const model = useMemo(() => buildSyringeGauge(units, capacity), [units, capacity]);

  const fillX = BARREL_X + BARREL_W * model.fillFraction;
  const stopX = Math.max(fillX, BARREL_X + 8);
  const markerX = Math.min(Math.max(fillX, BARREL_X), BARREL_X + BARREL_W);
  const labelX = Math.min(Math.max(markerX, 30), VIEW_W - 30);
  const labelTicks = model.ticks.filter((tick) => tick.major);

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
        {/* needle */}
        <Line x1={4} y1={CY} x2={40} y2={CY} stroke={colors.inkSecondary} strokeWidth={1.8} />
        {/* needle hub */}
        <Rect
          x={40}
          y={CY - 11}
          width={18}
          height={22}
          rx={4}
          fill={colors.surfaceSunken}
          stroke={colors.hairline}
          strokeWidth={1}
        />
        {/* barrel interior */}
        <Rect
          x={BARREL_X}
          y={BARREL_Y}
          width={BARREL_W}
          height={BARREL_H}
          rx={8}
          fill={colors.surface}
        />
        {/* liquid fill */}
        {model.fillFraction > 0 && (
          <Rect
            x={BARREL_X + 1.5}
            y={BARREL_Y + 1.5}
            width={Math.max(stopX - BARREL_X - 3, 0)}
            height={BARREL_H - 3}
            rx={6}
            fill={colors.accentSoft}
            opacity={model.overflow ? 0.55 : 1}
          />
        )}
        {/* plunger rod */}
        <Rect
          x={stopX + 3}
          y={CY - 4}
          width={Math.max(ROD_END_X - stopX - 3, 0)}
          height={8}
          fill={colors.surfaceSunken}
          stroke={colors.hairline}
          strokeWidth={0.8}
        />
        {/* plunger stopper */}
        {model.fillFraction > 0 && (
          <Rect
            x={stopX - 3}
            y={BARREL_Y + 4}
            width={7}
            height={BARREL_H - 8}
            rx={2}
            fill={colors.ink}
          />
        )}
        {/* thumb rest */}
        <Rect
          x={ROD_END_X + 4}
          y={CY - 25}
          width={10}
          height={50}
          rx={4}
          fill={colors.surfaceSunken}
          stroke={colors.hairline}
          strokeWidth={1}
        />
        {/* tick marks hanging from the top of the barrel */}
        {model.ticks.map((tick) => {
          const x = BARREL_X + BARREL_W * tick.fraction;
          const len = tick.major ? 13 : 8;
          return (
            <Line
              key={`tick-${tick.units}`}
              x1={x}
              y1={BARREL_Y + 1}
              x2={x}
              y2={BARREL_Y + 1 + len}
              stroke={tick.major ? colors.inkSecondary : colors.inkFaint}
              strokeWidth={tick.major ? 1.3 : 0.8}
              opacity={tick.major ? 0.95 : 0.6}
            />
          );
        })}
        {/* barrel outline (on top so the rod appears inside the glass) */}
        <Rect
          x={BARREL_X}
          y={BARREL_Y}
          width={BARREL_W}
          height={BARREL_H}
          rx={8}
          fill="none"
          stroke={colors.hairline}
          strokeWidth={1.4}
        />
        {/* draw marker */}
        {model.fillFraction > 0 && (
          <>
            <SvgText
              x={labelX}
              y={16}
              fontSize={13}
              fontFamily={fonts.monoSemiBold}
              fill={colors.accent}
              textAnchor="middle"
            >
              {`${fmt(units, 1)} u`}
            </SvgText>
            <Path
              d={`M ${markerX - 5} 21 L ${markerX + 5} 21 L ${markerX} 29 Z`}
              fill={colors.accent}
            />
            <Line
              x1={markerX}
              y1={29}
              x2={markerX}
              y2={BARREL_Y + BARREL_H + 5}
              stroke={colors.accent}
              strokeWidth={2}
            />
          </>
        )}
        {/* scale labels under the barrel */}
        {labelTicks.map((tick) => (
          <SvgText
            key={`label-${tick.units}`}
            x={BARREL_X + BARREL_W * tick.fraction}
            y={BARREL_Y + BARREL_H + 24}
            fontSize={11}
            fontFamily={fonts.mono}
            fill={colors.inkSecondary}
            textAnchor="middle"
          >
            {String(tick.units)}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "stretch",
    aspectRatio: VIEW_W / VIEW_H,
  },
});
