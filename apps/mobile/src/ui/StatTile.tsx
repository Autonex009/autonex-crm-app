import { StyleSheet, View } from "react-native";
import { radius, spacing, toneColors, useTheme, type Tone } from "../theme";
import { Txt } from "./primitives";

/**
 * Single metric tile for the dashboard grid.
 * Consistent 2-column or grid fitting with balanced sizing.
 */
export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
}) {
  const { colors } = useTheme();
  const { fg, bg } = toneColors(tone, colors);

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: colors.surface,
          borderColor: colors.line,
        },
      ]}
    >
      {tone !== "neutral" && (
        <View style={[styles.indicator, { backgroundColor: fg }]} />
      )}
      <Txt
        variant="title"
        numberOfLines={1}
        style={[styles.valueText, { color: tone === "neutral" ? colors.fg : fg }]}
      >
        {value}
      </Txt>
      <Txt variant="caption" color="muted" uppercase numberOfLines={1}>
        {label}
      </Txt>
      {hint ? (
        <Txt variant="caption" color="subtle" numberOfLines={1}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 140,
    gap: 2,
    padding: spacing.sm + 4,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    position: "relative",
    overflow: "hidden",
  },
  indicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
  },
  valueText: {
    fontSize: 20,
    fontWeight: "700",
  },
});
