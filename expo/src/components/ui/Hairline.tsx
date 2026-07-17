import React from "react";
import { StyleSheet, View } from "react-native";

import { colors, hairlineWidth } from "@/src/theme/tokens";

interface HairlineProps {
  dark?: boolean;
}

export default function Hairline({ dark = false }: HairlineProps) {
  return <View style={[styles.line, dark && styles.dark]} />;
}

const styles = StyleSheet.create({
  line: {
    height: hairlineWidth,
    backgroundColor: colors.hairline,
    alignSelf: "stretch",
  },
  dark: {
    backgroundColor: colors.hairlineDark,
  },
});
