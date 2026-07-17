import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/** Quiet confirmation tick — log / save / skip. No-op on web. */
export function hapticTick(): void {
  if (Platform.OS === "web") return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
}

/** Lighter press feedback for secondary controls. */
export function hapticPress(): void {
  if (Platform.OS === "web") return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}
