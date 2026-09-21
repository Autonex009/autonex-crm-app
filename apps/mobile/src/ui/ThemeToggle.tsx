import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme, useThemeStore } from "../theme";

interface ThemeToggleProps {
  size?: "sm" | "md";
}

/**
 * Modern tactile light / dark mode toggle switch.
 * Displays sun & moon icons with smooth active indicator.
 */
export function ThemeToggle({ size = "md" }: ThemeToggleProps) {
  const { colors, dark } = useTheme();
  const toggle = useThemeStore((s) => s.toggle);

  const isSmall = size === "sm";
  const width = isSmall ? 52 : 62;
  const height = isSmall ? 28 : 34;
  const iconSize = isSmall ? 13 : 15;
  const thumbSize = isSmall ? 22 : 26;

  return (
    <Pressable
      onPress={() => toggle(dark)}
      accessibilityRole="switch"
      accessibilityLabel={`Switch to ${dark ? "light" : "dark"} mode`}
      accessibilityState={{ checked: dark }}
      style={[
        styles.track,
        {
          width,
          height,
          borderRadius: height / 2,
          backgroundColor: dark ? colors.surfaceMuted : colors.surfaceHover,
          borderColor: colors.line,
        },
      ]}
    >
      {/* Sun icon on left */}
      <View style={[styles.iconWrap, { left: isSmall ? 6 : 7 }]}>
        <Feather
          name="sun"
          size={iconSize}
          color={dark ? colors.fgSubtle : "#eab308"}
        />
      </View>

      {/* Moon icon on right */}
      <View style={[styles.iconWrap, { right: isSmall ? 6 : 7 }]}>
        <Feather
          name="moon"
          size={iconSize}
          color={dark ? "#818cf8" : colors.fgSubtle}
        />
      </View>

      {/* Sliding thumb */}
      <View
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            backgroundColor: dark ? colors.accent : "#ffffff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: dark ? 0.4 : 0.15,
            shadowRadius: 2,
            elevation: 2,
            transform: [
              {
                translateX: dark ? width - thumbSize - (isSmall ? 3 : 4) : isSmall ? 3 : 4,
              },
            ],
          },
        ]}
      >
        <Feather
          name={dark ? "moon" : "sun"}
          size={iconSize - 2}
          color={dark ? colors.onAccent : "#eab308"}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    borderWidth: 1,
    overflow: "hidden",
  },
  iconWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  thumb: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
});
