import { createContext, useContext } from "react";
import { useColorScheme } from "react-native";

import { type Theme, themes } from "./tokens";

/**
 * The active theme, following the OS setting.
 *
 * No in-app toggle: a phone already has one, in a place people know to look,
 * and a second switch that disagrees with the system is a bug report waiting to
 * happen. `useColorScheme` re-renders on change, so switching the OS appearance
 * repaints the app live.
 */
const ThemeContext = createContext<Theme>(themes.light);

export const ThemeProvider = ThemeContext.Provider;

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/** Resolves the OS preference; `null` (no preference) means light. */
export function useSystemTheme(): Theme {
  return themes[useColorScheme() === "dark" ? "dark" : "light"];
}

export * from "./tokens";
