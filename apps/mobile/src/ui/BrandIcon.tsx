import { Image, StyleSheet, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

import { useTheme } from "../theme";

export type SsoProvider = "google" | "github";

/**
 * The identity-provider marks, drawn to each brand's own guidelines rather
 * than as a generic glyph.
 *
 * Google ships as the four-colour "G" bitmap because the brand's terms do not
 * allow it to be recoloured or redrawn — the monochrome outline the app used
 * before was not the Google mark at all. GitHub is the solid Octocat from
 * FontAwesome, which is the real silhouette and, unlike Google's, is meant to
 * take the foreground colour: black on light, white on dark.
 */
export function BrandIcon({ provider, size = 20 }: { provider: SsoProvider; size?: number }) {
  const { dark } = useTheme();

  if (provider === "google") {
    return (
      <Image
        source={require("../../assets/google-icon.png")}
        style={[styles.icon, { width: size, height: size }]}
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View style={[styles.icon, { width: size, height: size }]}>
      <FontAwesome name="github" size={size} color={dark ? "#ffffff" : "#181717"} />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { resizeMode: "contain", alignItems: "center", justifyContent: "center" },
});
