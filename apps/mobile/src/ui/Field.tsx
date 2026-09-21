import { useState, type Ref } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { radius, spacing, useTheme } from "../theme";
import { Txt } from "./primitives";

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  /** Feather glyph rendered inside the left edge, as the web does with lucide. */
  icon?: keyof typeof Feather.glyphMap;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoComplete?: TextInputProps["autoComplete"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  returnKeyType?: TextInputProps["returnKeyType"];
  onSubmitEditing?: () => void;
  /** iOS autofill hint; ignored on Android, which uses `autoComplete`. */
  textContentType?: TextInputProps["textContentType"];
  /**
   * Keeps focus on submit so a "next" key can hand it to the following field.
   * Without it both platforms close the keyboard between fields.
   */
  blurOnSubmit?: boolean;
  /** Lets a form move focus here, e.g. from the field above. */
  inputRef?: Ref<TextInput>;
}

/**
 * Labelled text input. Mirrors the web's auth field: uppercase micro-label,
 * leading glyph, error text below, accent ring on focus.
 */
export function Field({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  error,
  icon,
  secure,
  keyboardType,
  autoComplete,
  autoCapitalize = "none",
  returnKeyType,
  onSubmitEditing,
  textContentType,
  blurOnSubmit,
  inputRef,
}: FieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const borderColor = error ? colors.badSolid : focused ? colors.accent : colors.line;

  return (
    <View style={styles.wrap}>
      <Txt variant="caption" color="muted" uppercase>
        {label}
      </Txt>

      <View
        style={[
          styles.box,
          { backgroundColor: colors.surfaceMuted, borderColor },
          focused && !error && { borderWidth: 1.5 },
        ]}
      >
        {icon && <Feather name={icon} size={16} color={colors.fgSubtle} />}

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.fgSubtle}
          secureTextEntry={secure && !revealed}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          textContentType={textContentType}
          blurOnSubmit={blurOnSubmit}
          // Android draws its own underline inside a bordered box otherwise.
          underlineColorAndroid="transparent"
          style={[styles.input, { color: colors.fg }]}
        />

        {secure && (
          <Pressable
            onPress={() => setRevealed((r) => !r)}
            hitSlop={10}
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
          >
            <Feather
              name={revealed ? "eye-off" : "eye"}
              size={16}
              color={colors.fgSubtle}
            />
          </Pressable>
        )}
      </View>

      {error && (
        <Txt variant="caption" color="danger">
          {error}
        </Txt>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    // Android pads a TextInput generously by default, which makes the box
    // taller than its iOS twin; zeroing it lets `minHeight` decide.
    paddingVertical: 0,
  },
});
