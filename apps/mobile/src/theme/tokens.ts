import { colors, radius, spacing } from "@go-crm/design-tokens";
import { Platform } from "react-native";

/**
 * The app's visual language: calm editorial.
 *
 * Three rules it holds to, because they are what keep a dense CRM legible on a
 * 390pt screen:
 *
 *  1. **Hierarchy comes from type scale, not from boxes.** A list is separated
 *     by hairlines and whitespace rather than by cards. Cards on a phone stack
 *     into a wall of identical rectangles; a 34pt number over an 11pt label
 *     reads instantly.
 *  2. **Colour only ever means status.** The indigo accent marks the one active
 *     thing on screen. Everything else is the neutral ramp.
 *  3. **Money is tabular.** Amounts sit in a column and must align on the
 *     decimal, so they use the platform's tabular figures.
 *
 * Semantic names, not raw ramp values: every screen reads `t.fg.muted`, so dark
 * mode is one lookup table away rather than a conditional at each usage.
 */

export type Scheme = "light" | "dark";

export interface Theme {
  scheme: Scheme;
  /** Page background, one step off pure white so surfaces can sit on it. */
  canvas: string;
  /** Raised surfaces: sheets, the tab bar, the one card we do use. */
  surface: string;
  /** Pressed state for a row. */
  surfacePressed: string;
  /** Hairline dividers and, rarely, borders. */
  line: string;
  lineStrong: string;
  fg: {
    default: string;
    muted: string;
    subtle: string;
    /** Text on an accent fill. */
    onAccent: string;
  };
  accent: string;
  accentSoft: string;
  accentFg: string;
  status: {
    ok: string;
    okSoft: string;
    warn: string;
    warnSoft: string;
    bad: string;
    badSoft: string;
    info: string;
    infoSoft: string;
  };
}

const light: Theme = {
  scheme: "light",
  canvas: "#F7F7F8",
  surface: colors.neutral[0],
  surfacePressed: colors.neutral[100],
  line: "#E7E7EA",
  lineStrong: colors.neutral[300],
  fg: {
    default: colors.neutral[900],
    muted: "#52525B",
    subtle: colors.neutral[400],
    onAccent: colors.neutral[0],
  },
  accent: colors.brand[600],
  accentSoft: colors.brand[50],
  accentFg: colors.brand[700],
  status: {
    ok: colors.success[700],
    okSoft: colors.success[50],
    warn: colors.warning[700],
    warnSoft: colors.warning[50],
    bad: colors.danger[700],
    badSoft: colors.danger[50],
    info: colors.info[700],
    infoSoft: colors.info[50],
  },
};

/**
 * Dark mode is not the light ramp inverted.
 *
 * The canvas is a near-black with a trace of blue rather than #000, so an OLED
 * panel still shows the elevation between canvas and surface; pure black would
 * flatten them into one. Accent and status colours step *lighter* (600 -> 400),
 * because a saturated mid-tone that passes contrast on white fails badly on a
 * dark field.
 */
const dark: Theme = {
  scheme: "dark",
  canvas: "#0B0B0F",
  surface: "#17171B",
  surfacePressed: "#202027",
  line: "#26262D",
  lineStrong: "#35353E",
  fg: {
    default: "#FAFAFA",
    muted: "#A1A1AA",
    subtle: "#6B6B76",
    onAccent: colors.neutral[0],
  },
  accent: colors.brand[400],
  accentSoft: "#1E1B4B",
  accentFg: colors.brand[300],
  status: {
    ok: "#34D399",
    okSoft: "#052E23",
    warn: "#FBBF24",
    warnSoft: "#33240A",
    bad: "#F87171",
    badSoft: "#3B1315",
    info: "#60A5FA",
    infoSoft: "#11244A",
  },
};

export const themes = { light, dark } as const;

/**
 * Type scale. Deliberately gappy — 11/13/15 for supporting text, then a jump to
 * 22/34 for the thing that matters. Evenly spaced steps read as a wall.
 */
export const type = {
  /** Section labels and metadata. Always uppercase with tracking. */
  overline: { fontSize: 11, lineHeight: 14, letterSpacing: 0.8, fontWeight: "600" },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  body: { fontSize: 15, lineHeight: 21, fontWeight: "400" },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: "600" },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "700", letterSpacing: -0.3 },
  display: { fontSize: 34, lineHeight: 40, fontWeight: "700", letterSpacing: -0.8 },
} as const;

/**
 * Tabular figures, so a column of amounts aligns.
 *
 * iOS exposes the feature through a named variant; Android needs the OpenType
 * feature requested on the font. Everything else falls back to the default
 * face, which is proportional but not wrong.
 */
export const tabular = Platform.select({
  ios: { fontVariant: ["tabular-nums" as const] },
  android: { fontFeatureSettings: "'tnum'" },
  default: {},
});

export { radius, spacing };

/** One hairline, the real device hairline rather than a rounded 1px. */
export const HAIRLINE = Platform.select({ ios: 0.5, default: 0.8 });
