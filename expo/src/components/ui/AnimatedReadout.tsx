import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import AppText from "@/src/components/ui/AppText";
import { fmt } from "@/src/engine";
import { letterSpacing } from "@/src/theme/tokens";

interface AnimatedReadoutProps {
  value: number;
  decimals?: number;
  testID?: string;
}

/**
 * Precision instrument readout.
 *
 * SAFETY: the numeral is always the final formatted value on the first paint.
 * Never count, tween, or interpolate through a transient number. Only the
 * decorative shell scale may spring (and even that is skipped under reduce-motion).
 */
export default function AnimatedReadout({
  value,
  decimals = 1,
  testID,
}: AnimatedReadoutProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const display = fmt(value, decimals);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      return;
    }
    scale.value = 0.96;
    scale.value = withSpring(1, { damping: 16, stiffness: 140, mass: 0.7 });
  }, [value, decimals, scale, reduceMotion]);

  const shellStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.wrap, shellStyle]} testID={testID}>
      <AppText variant="readout" tone="onDark" weight="semibold" style={styles.readout}>
        {display}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: "center",
  },
  readout: {
    letterSpacing: letterSpacing.readout,
  },
});
