/**
 * Semantic colour tokens, mirroring apps/web/src/styles/theme.css.
 *
 * The web declares these as CSS custom properties under `:root` and `.dark`;
 * React Native has no cascade, so the same two sets live here as plain objects
 * and are handed down through context. The values are copied verbatim —
 * if a token moves on the web it must move here, or the two apps drift.
 */
import { radius, spacing } from "@go-crm/design-tokens";

export interface Palette {
  canvas: string;
  surface: string;
  surfaceMuted: string;
  surfaceHover: string;

  line: string;
  lineStrong: string;

  fg: string;
  fgMuted: string;
  fgSubtle: string;

  accent: string;
  accentHover: string;
  accentSoft: string;
  accentOn: string;

  okSoft: string;
  okFg: string;
  warnSoft: string;
  warnFg: string;
  badSoft: string;
  badFg: string;
  badSolid: string;
  infoSoft: string;
  infoFg: string;

  overlay: string;
  /** Text that sits on top of a filled accent surface. */
  onAccent: string;
}

export const lightPalette: Palette = {
  canvas: "#f7f7f8",
  surface: "#ffffff",
  surfaceMuted: "#f4f4f5",
  surfaceHover: "#fafafa",

  line: "#e7e7ea",
  lineStrong: "#d4d4d8",

  fg: "#171717",
  fgMuted: "#52525b",
  fgSubtle: "#a1a1aa",

  accent: "#4f46e5",
  accentHover: "#4338ca",
  accentSoft: "#eef2ff",
  accentOn: "#4338ca",

  okSoft: "#ecfdf5",
  okFg: "#047857",
  warnSoft: "#fffbeb",
  warnFg: "#b45309",
  badSoft: "#fef2f2",
  badFg: "#b91c1c",
  badSolid: "#dc2626",
  infoSoft: "#eff6ff",
  infoFg: "#1d4ed8",

  overlay: "rgba(24, 24, 27, 0.55)",
  onAccent: "#ffffff",
};

export const darkPalette: Palette = {
  canvas: "#09090b",
  surface: "#131316",
  surfaceMuted: "#1a1a1e",
  surfaceHover: "#1f1f24",

  line: "#26262b",
  lineStrong: "#35353c",

  fg: "#f4f4f5",
  fgMuted: "#a1a1aa",
  fgSubtle: "#71717a",

  accent: "#6366f1",
  accentHover: "#4f46e5",
  accentSoft: "#1e1b38",
  accentOn: "#a5b4fc",

  okSoft: "#052e21",
  okFg: "#6ee7b7",
  warnSoft: "#3a2708",
  warnFg: "#fcd34d",
  badSoft: "#3a1113",
  badFg: "#fca5a5",
  badSolid: "#ef4444",
  infoSoft: "#101f42",
  infoFg: "#93c5fd",

  overlay: "rgba(0, 0, 0, 0.6)",
  onAccent: "#ffffff",
};

/**
 * Tone → (fill, foreground) pair, the native counterpart of the TONES map in
 * apps/web/src/app/ui/primitives.tsx. Badges, chips and alerts all resolve
 * through here so one tone never means two different colours.
 */
export type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

export function toneColors(tone: Tone, p: Palette): { bg: string; fg: string } {
  switch (tone) {
    case "brand":
      return { bg: p.accentSoft, fg: p.accentOn };
    case "success":
      return { bg: p.okSoft, fg: p.okFg };
    case "warning":
      return { bg: p.warnSoft, fg: p.warnFg };
    case "danger":
      return { bg: p.badSoft, fg: p.badFg };
    case "info":
      return { bg: p.infoSoft, fg: p.infoFg };
    default:
      return { bg: p.surfaceMuted, fg: p.fgMuted };
  }
}

/** Type scale. Kept small and deliberate — five sizes cover every screen. */
export const type = {
  display: { fontSize: 28, fontWeight: "800" },
  title: { fontSize: 20, fontWeight: "700" },
  heading: { fontSize: 15, fontWeight: "700" },
  body: { fontSize: 14, fontWeight: "500" },
  label: { fontSize: 12, fontWeight: "600" },
  caption: { fontSize: 11, fontWeight: "600" },
} as const;

export { radius, spacing };
