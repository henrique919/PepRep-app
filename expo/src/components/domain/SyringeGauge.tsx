import React, { useEffect, useId, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import type { SyringeCapacity } from "@/src/engine";
import { fmt } from "@/src/engine";
import { buildSyringeGauge } from "@/src/engine/syringe";
import { useTheme } from "@/src/theme";
import { fonts } from "@/src/theme/tokens";

interface SyringeGaugeProps {
  units: number;
  capacity: SyringeCapacity;
}

/**
 * Layout metrics for a true U-100 barrel silhouette. Capacity only changes
 * the drawn barrel proportions — fill and ticks always come from the engine.
 */
function barrelLayout(capacity: SyringeCapacity) {
  switch (capacity) {
    case 30:
      return { barrelW: 208, barrelH: 54, needleLen: 34 };
    case 50:
      return { barrelW: 248, barrelH: 48, needleLen: 38 };
    case 100:
      return { barrelW: 286, barrelH: 42, needleLen: 42 };
  }
}

const VIEW_H = 148;
const PAD_L = 6;
const HUB_W = 20;
const FLANGE_W = 10;
const THUMB_W = 14;
const ROD_END_PAD = 8;

/**
 * Signature horizontal U-100 syringe: needle → hub → barrel → plunger.
 * All unit/volume geometry is engine-driven via `buildSyringeGauge`.
 */
export default function SyringeGauge({ units, capacity }: SyringeGaugeProps) {
  const uid = useId().replace(/:/g, "");
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const model = useMemo(() => buildSyringeGauge(units, capacity), [units, capacity]);
  const [fillProgress, setFillProgress] = useState(() => model.fillFraction);
  const appear = useSharedValue(1);

  useEffect(() => {
    const target = model.fillFraction;
    if (reduceMotion) {
      appear.value = 1;
      setFillProgress(target);
      return;
    }

    appear.value = 0;
    appear.value = withTiming(1, {
      duration: 380,
      easing: Easing.out(Easing.cubic),
    });

    const start = performance.now();
    const duration = 520;
    let frame = 0;
    setFillProgress(0);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setFillProgress(target * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [model.fillFraction, units, capacity, appear, reduceMotion]);

  const shellStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + appear.value * 0.45,
  }));

  const layout = useMemo(() => {
    const { barrelW, barrelH, needleLen } = barrelLayout(model.capacityUnits);
    const needleX0 = PAD_L;
    const hubX = needleX0 + needleLen;
    const barrelX = hubX + HUB_W;
    const flangeX = barrelX + barrelW;
    const thumbX = flangeX + FLANGE_W + 52;
    const viewW = thumbX + THUMB_W + ROD_END_PAD;
    const barrelY = (VIEW_H - barrelH) / 2 + 4;
    const cy = barrelY + barrelH / 2;
    const fillX = barrelX + barrelW * fillProgress;
    /** Stopper sits at the fluid meniscus; empty barrel parks it at the zero end. */
    const stopX = fillProgress > 0.001 ? fillX : barrelX + 5;
    const markerX = Math.min(Math.max(fillX, barrelX), barrelX + barrelW);
    const labelX = Math.min(Math.max(markerX, 36), viewW - 36);

    return {
      barrelW,
      barrelH,
      needleLen,
      needleX0,
      hubX,
      barrelX,
      flangeX,
      thumbX,
      viewW,
      barrelY,
      cy,
      fillX,
      stopX,
      markerX,
      labelX,
    };
  }, [model.capacityUnits, fillProgress]);

  const {
    barrelW,
    barrelH,
    needleX0,
    hubX,
    barrelX,
    flangeX,
    thumbX,
    viewW,
    barrelY,
    cy,
    stopX,
    markerX,
    labelX,
  } = layout;

  const labelTicks = model.ticks.filter((tick) => tick.major);
  const fluidColor = model.overflow ? colors.fluidOverflow : colors.fluid;
  const markerColor = model.overflow ? colors.dangerInk : colors.accent;
  const showFill = fillProgress > 0.001;
  const rodW = Math.max(thumbX - stopX - 4, 0);
  const clipId = `barrel-bore-${uid}`;
  const fluidGradId = `fluid-grad-${uid}`;
  const glassGradId = `glass-grad-${uid}`;

  return (
    <Animated.View style={[styles.wrap, { aspectRatio: viewW / VIEW_H }, shellStyle]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${viewW} ${VIEW_H}`}>
        <Defs>
          <LinearGradient id={glassGradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.surface} stopOpacity={1} />
            <Stop offset="0.45" stopColor={colors.surface} stopOpacity={1} />
            <Stop offset="1" stopColor={colors.surfaceSunken} stopOpacity={1} />
          </LinearGradient>
          <LinearGradient id={fluidGradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={fluidColor} stopOpacity={0.55} />
            <Stop offset="0.35" stopColor={fluidColor} stopOpacity={0.88} />
            <Stop offset="1" stopColor={fluidColor} stopOpacity={0.72} />
          </LinearGradient>
          <ClipPath id={clipId}>
            <Rect x={barrelX + 1} y={barrelY + 1} width={barrelW - 2} height={barrelH - 2} rx={7} />
          </ClipPath>
        </Defs>

        {/* needle bevel + shaft */}
        <Path
          d={`M ${needleX0} ${cy} L ${hubX - 1} ${cy - 1.1} L ${hubX - 1} ${cy + 1.1} Z`}
          fill={colors.inkSecondary}
        />
        <Line
          x1={needleX0 + 2}
          y1={cy}
          x2={hubX}
          y2={cy}
          stroke={colors.ink}
          strokeWidth={1.35}
          strokeLinecap="round"
        />

        {/* hub / luer */}
        <Path
          d={[
            `M ${hubX} ${cy - 7}`,
            `L ${hubX + 6} ${cy - 12}`,
            `L ${barrelX} ${cy - barrelH / 2 + 4}`,
            `L ${barrelX} ${cy + barrelH / 2 - 4}`,
            `L ${hubX + 6} ${cy + 12}`,
            `L ${hubX} ${cy + 7}`,
            "Z",
          ].join(" ")}
          fill={colors.surfaceSunken}
          stroke={colors.hairline}
          strokeWidth={1}
        />
        <Rect
          x={hubX + 3}
          y={cy - 5}
          width={4}
          height={10}
          rx={1}
          fill={colors.inkFaint}
          opacity={0.45}
        />

        {/* barrel glass body */}
        <Rect
          x={barrelX}
          y={barrelY}
          width={barrelW}
          height={barrelH}
          rx={8}
          fill={`url(#${glassGradId})`}
        />
        {/* top glass highlight */}
        <Rect
          x={barrelX + 6}
          y={barrelY + 3}
          width={barrelW - 12}
          height={3.5}
          rx={1.5}
          fill={colors.surface}
          opacity={0.85}
        />

        {/* fluid column (clipped to bore) */}
        {showFill && (
          <G clipPath={`url(#${clipId})`}>
            <Rect
              x={barrelX + 1}
              y={barrelY + 1}
              width={Math.max(stopX - barrelX - 1, 0)}
              height={barrelH - 2}
              fill={`url(#${fluidGradId})`}
            />
            {/* meniscus glint */}
            <Rect
              x={Math.max(stopX - 5, barrelX + 1)}
              y={barrelY + 2}
              width={4}
              height={barrelH - 4}
              fill={colors.surface}
              opacity={0.22}
            />
            {model.overflow && (
              <>
                {Array.from({ length: 7 }, (_, i) => {
                  const x = barrelX + 10 + i * 14;
                  return (
                    <Line
                      key={`hatch-${i}`}
                      x1={x}
                      y1={barrelY + 4}
                      x2={x + 10}
                      y2={barrelY + barrelH - 4}
                      stroke={colors.dangerInk}
                      strokeWidth={1.1}
                      opacity={0.35}
                    />
                  );
                })}
              </>
            )}
          </G>
        )}

        {/* plunger rod (drawn under flange / outline) */}
        <Rect
          x={stopX + 2}
          y={cy - 3.5}
          width={rodW}
          height={7}
          rx={1.5}
          fill={colors.surfaceSunken}
          stroke={colors.hairline}
          strokeWidth={0.8}
        />
        <Line
          x1={stopX + 6}
          y1={cy}
          x2={thumbX - 2}
          y2={cy}
          stroke={colors.inkFaint}
          strokeWidth={0.7}
          opacity={0.7}
        />

        {/* rubber stopper — sealing ribs */}
        <G>
          <Rect
            x={stopX - 4}
            y={barrelY + 3}
            width={8}
            height={barrelH - 6}
            rx={2.2}
            fill={colors.ink}
          />
          <Rect
            x={stopX - 5}
            y={barrelY + 6}
            width={10}
            height={3}
            rx={1}
            fill={colors.panel}
          />
          <Rect
            x={stopX - 5}
            y={barrelY + barrelH - 9}
            width={10}
            height={3}
            rx={1}
            fill={colors.panel}
          />
          <Circle cx={stopX} cy={cy} r={1.4} fill={colors.inkFaint} opacity={0.5} />
        </G>

        {/* finger flange at open end of barrel */}
        <Path
          d={[
            `M ${flangeX - 2} ${barrelY + 2}`,
            `L ${flangeX + FLANGE_W} ${barrelY - 14}`,
            `L ${flangeX + FLANGE_W + 3} ${barrelY - 14}`,
            `L ${flangeX + FLANGE_W + 3} ${barrelY + barrelH + 14}`,
            `L ${flangeX + FLANGE_W} ${barrelY + barrelH + 14}`,
            `L ${flangeX - 2} ${barrelY + barrelH - 2}`,
            "Z",
          ].join(" ")}
          fill={colors.surfaceSunken}
          stroke={colors.hairline}
          strokeWidth={1}
        />

        {/* tick marks — engine fractions only */}
        {model.ticks.map((tick) => {
          const x = barrelX + barrelW * tick.fraction;
          const major = tick.major;
          const len = major ? Math.min(barrelH * 0.42, 18) : Math.min(barrelH * 0.26, 11);
          return (
            <Line
              key={`tick-${tick.units}`}
              x1={x}
              y1={barrelY + 1.5}
              x2={x}
              y2={barrelY + 1.5 + len}
              stroke={major ? colors.inkSecondary : colors.inkFaint}
              strokeWidth={major ? 1.35 : 0.75}
              opacity={major ? 0.95 : 0.55}
            />
          );
        })}

        {/* barrel outline (above ticks / fluid for glass edge) */}
        <Rect
          x={barrelX}
          y={barrelY}
          width={barrelW}
          height={barrelH}
          rx={8}
          fill="none"
          stroke={model.overflow ? colors.dangerInk : colors.hairline}
          strokeWidth={model.overflow ? 1.8 : 1.45}
          strokeDasharray={model.overflow ? "5 3" : undefined}
        />

        {/* thumb rest */}
        <Rect
          x={thumbX}
          y={cy - 26}
          width={THUMB_W}
          height={52}
          rx={5}
          fill={colors.surfaceSunken}
          stroke={colors.hairline}
          strokeWidth={1.1}
        />
        <Rect
          x={thumbX + 3}
          y={cy - 22}
          width={3}
          height={44}
          rx={1.5}
          fill={colors.surface}
          opacity={0.65}
        />

        {/* exact fill callout */}
        {showFill && (
          <G>
            <SvgText
              x={labelX}
              y={18}
              fontSize={13}
              fontFamily={fonts.monoSemiBold}
              fill={markerColor}
              textAnchor="middle"
            >
              {`${fmt(units, 1)} u`}
            </SvgText>
            <Path
              d={`M ${markerX - 5.5} 22 L ${markerX + 5.5} 22 L ${markerX} 30.5 Z`}
              fill={markerColor}
            />
            <Line
              x1={markerX}
              y1={30.5}
              x2={markerX}
              y2={barrelY + barrelH + 6}
              stroke={markerColor}
              strokeWidth={2}
              strokeLinecap="round"
            />
            {/* meniscus tick across the bore */}
            <Line
              x1={markerX}
              y1={barrelY + 2}
              x2={markerX}
              y2={barrelY + barrelH - 2}
              stroke={markerColor}
              strokeWidth={1.25}
              opacity={0.85}
            />
          </G>
        )}

        {/* scale labels under the barrel */}
        {labelTicks.map((tick) => (
          <SvgText
            key={`label-${tick.units}`}
            x={barrelX + barrelW * tick.fraction}
            y={barrelY + barrelH + 22}
            fontSize={11}
            fontFamily={fonts.mono}
            fill={colors.inkSecondary}
            textAnchor="middle"
          >
            {String(tick.units)}
          </SvgText>
        ))}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "stretch",
  },
});
