import { usePathname } from "expo-router";
import React, { type ComponentType } from "react";
import { StyleSheet, View } from "react-native";

/**
 * React Navigation keeps visited web tab scenes mounted. Hide inactive scenes
 * from layout, keyboard navigation, and assistive technology while preserving
 * their state for the next visit.
 */
export function withAccessibleTabScreen<P extends object>(
  ScreenComponent: ComponentType<P>,
  isActivePath: (pathname: string) => boolean,
) {
  function AccessibleTabScreen(props: P) {
    const pathname = usePathname();
    const isFocused = isActivePath(pathname);

    return (
      <View
        aria-hidden={!isFocused}
        accessibilityElementsHidden={!isFocused}
        importantForAccessibility={isFocused ? "auto" : "no-hide-descendants"}
        style={[styles.screen, !isFocused && styles.hidden]}
      >
        <ScreenComponent {...props} />
      </View>
    );
  }

  AccessibleTabScreen.displayName = `AccessibleTabScreen(${ScreenComponent.displayName ?? ScreenComponent.name ?? "Screen"})`;
  return AccessibleTabScreen;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  hidden: {
    display: "none",
  },
});
