import { Image, StyleSheet, View } from "react-native";
import { radius, useTheme } from "../theme";

interface AppLogoProps {
  size?: number;
  rounded?: boolean;
}

/**
 * Autonex AI App Logo component.
 */
export function AppLogo({ size = 36, rounded = true }: AppLogoProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: rounded ? Math.min(size / 3.5, radius.md) : 0,
          borderColor: colors.line,
          backgroundColor: "#05195e",
        },
      ]}
    >
      <Image
        source={require("../../assets/autonex_ai_logo.jpeg")}
        style={{
          width: size * 0.9,
          height: size * 0.9,
          resizeMode: "contain",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
