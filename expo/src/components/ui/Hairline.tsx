import React from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/src/theme";
import { hairlineWidth } from "@/src/theme/tokens";

interface HairlineProps {
  dark?: boolean;
}

export default function Hairline({ dark = false }: HairlineProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.line,
        { backgroundColor: dark ? colors.hairlineDark : colors.hairline },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  line: {
    height: hairlineWidth,
    alignSelf: "stretch",
  },
});
