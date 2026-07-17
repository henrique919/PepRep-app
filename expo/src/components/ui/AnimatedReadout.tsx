import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
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
 * Precision instrument readout — counts the numeral up and springs the shell.
 */
export default function AnimatedReadout({
  value,
  decimals = 1,
  testID,
}: AnimatedReadoutProps) {
  const [display, setDisplay] = useState(() => fmt(0, decimals));
  const scale = useSharedValue(0.96);

  useEffect(() => {
    scale.value = 0.96;
    scale.value = withSpring(1, { damping: 16, stiffness: 140, mass: 0.7 });

    const start = performance.now();
    const duration = 420;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(fmt(value * eased, decimals));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, decimals, scale]);

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
