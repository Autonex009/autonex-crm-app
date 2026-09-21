import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { radius, spacing, useTheme } from "../theme";
import { Txt } from "../ui";

export function ScreenHeader({
  title,
  subtitle,
  action,
  leading,
  showBack,
  onBack,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  leading?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}) {
  const { colors } = useTheme();
  const navigation = useNavigation();

  // If showBack is explicitly set use that, else check if navigator can go back
  const canBack = showBack !== undefined ? showBack : navigation.canGoBack();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.wrap, { borderBottomColor: colors.line }]}>
      <View style={styles.left}>
        {canBack ? (
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: pressed ? colors.surfaceHover : colors.surface,
                borderColor: colors.line,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={18} color={colors.fg} />
          </Pressable>
        ) : leading ? (
          leading
        ) : null}

        <View style={styles.text}>
          <Txt variant="title" numberOfLines={1}>
            {title}
          </Txt>
          {subtitle ? (
            <Txt variant="label" color="muted" numberOfLines={1}>
              {subtitle}
            </Txt>
          ) : null}
        </View>
      </View>

      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 1 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
