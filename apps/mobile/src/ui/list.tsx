import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { radius, spacing, useTheme } from "../theme";
import { Txt } from "./primitives";

/**
 * Tappable record row: title line, optional meta line, trailing slot, chevron.
 * Every list screen (leads, deals, companies, quotes, invoices) renders through
 * this so row height, padding and press feedback are identical across the app.
 */
export function ListRow({
  title,
  subtitle,
  meta,
  trailing,
  leading,
  onPress,
}: {
  title: string;
  subtitle?: string | null;
  meta?: ReactNode;
  trailing?: ReactNode;
  leading?: ReactNode;
  onPress?: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.surfaceHover : colors.surface,
          borderColor: colors.line,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: pressed ? 0.08 : 0.03,
          shadowRadius: 3,
          elevation: 1,
        },
      ]}
    >
      {leading}

      <View style={styles.body}>
        <Txt variant="heading" numberOfLines={1}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="label" color="muted" numberOfLines={1}>
            {subtitle}
          </Txt>
        ) : null}
        {meta ? <View style={styles.meta}>{meta}</View> : null}
      </View>

      <View style={styles.trailing}>
        {trailing}
        {onPress && <Feather name="chevron-right" size={16} color={colors.fgSubtle} />}
      </View>
    </Pressable>
  );
}

/** Label/value pair for detail screens. */
export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <View style={styles.detail}>
      <Txt variant="caption" color="subtle" uppercase style={{ letterSpacing: 0.5 }}>
        {label}
      </Txt>
      {typeof value === "string" || typeof value === "number" ? (
        <Txt variant="body" style={{ fontWeight: "600" }}>{value}</Txt>
      ) : (
        value
      )}
    </View>
  );
}

/** Section title above a group of rows or cards. */
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.section}>
      <Txt variant="caption" color="subtle" uppercase>
        {title}
      </Txt>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  body: { flex: 1, gap: 3 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" },
  trailing: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  detail: { gap: 3, paddingVertical: 6 },
  section: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginBottom: spacing.sm,
  },
});
