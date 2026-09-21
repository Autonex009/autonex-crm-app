import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { radius, spacing, useTheme } from "../theme";

export interface FilterOption {
  key: string;
  label: string;
}

/**
 * Horizontal segmented filter chips with smooth scrolling and edge padding.
 * Strict sizing and cross-axis alignment to prevent vertical stretching during loading.
 */
export function FilterChips({
  options,
  value,
  onChange,
}: {
  options: readonly FilterOption[];
  value: string;
  onChange: (key: string) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
      >
        {options.map((option) => {
          const active = option.key === value;
          return (
            <Pressable
              key={option.key || "all"}
              onPress={() => onChange(option.key)}
              hitSlop={4}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.accent : colors.surface,
                  borderColor: active ? colors.accent : colors.line,
                },
              ]}
            >
              <Text
                style={[
                  styles.label,
                  { color: active ? colors.onAccent : colors.fgMuted },
                ]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    flexGrow: 0,
    flexShrink: 0,
    justifyContent: "center",
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 0,
    height: 48,
  },
  scroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chip: {
    height: 32,
    alignSelf: "center",
    paddingHorizontal: spacing.sm + 6,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 12, fontWeight: "700" },
});
