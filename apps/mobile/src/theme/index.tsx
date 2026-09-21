import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import { darkPalette, lightPalette, type Palette } from "./tokens";

export * from "./tokens";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "gocrm.theme";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Cycles system → light → dark → system, matching the web's single toggle. */
  cycle: () => void;
  /** Toggles explicitly between light and dark. */
  toggle: (isDarkNow?: boolean) => void;
}

/**
 * Theme preference. Persisted through expo-secure-store rather than a plain
 * key/value store only because it is the one storage module this app already
 * ships — the value is not a secret.
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: "system",
  setMode: (mode) => {
    set({ mode });
    void SecureStore.setItemAsync(STORAGE_KEY, mode).catch(() => {
      /* Preference just won't survive a restart. */
    });
  },
  cycle: () => {
    const order: ThemeMode[] = ["system", "light", "dark"];
    get().setMode(order[(order.indexOf(get().mode) + 1) % order.length]);
  },
  toggle: (isDarkNow) => {
    if (typeof isDarkNow === "boolean") {
      get().setMode(isDarkNow ? "light" : "dark");
    } else {
      get().setMode(get().mode === "dark" ? "light" : "dark");
    }
  },
}));

/** Reads the stored preference once at boot. */
export function useThemeHydration(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((value) => {
        if (!active) return;
        if (value === "light" || value === "dark" || value === "system") {
          useThemeStore.setState({ mode: value });
        }
      })
      .catch(() => {
        /* Fall through to the "system" default. */
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return ready;
}

export interface Theme {
  colors: Palette;
  dark: boolean;
}

const ThemeContext = createContext<Theme>({ colors: lightPalette, dark: false });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const system = useColorScheme();

  const value = useMemo<Theme>(() => {
    const dark = mode === "dark" || (mode === "system" && system === "dark");
    return { colors: dark ? darkPalette : lightPalette, dark };
  }, [mode, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** The palette for the active theme. Every styled component reads this. */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}
