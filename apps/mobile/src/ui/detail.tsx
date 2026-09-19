import { Linking, Platform, StyleSheet, View } from "react-native";

import { HAIRLINE, spacing, useTheme } from "../theme";
import { Divider, Gap, Overline, Row, Txt } from "./index";

/**
 * Detail-screen building blocks.
 *
 * The app does not edit records, so a detail screen is a reading surface with a
 * few escape hatches into the phone's own apps — call, mail, maps. Those escape
 * hatches are the reason to have it on a phone at all: the web app can show you
 * a number, but only this can dial it.
 */

/** A labelled value. Renders nothing when empty, so screens need no guards. */
export function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <View style={styles.field}>
      <Overline>{label}</Overline>
      <Gap size="xs" />
      <Txt variant="body">{value}</Txt>
    </View>
  );
}

/** A section heading with a hairline above it. */
export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Divider />
      <View style={styles.sectionHeader}>
        <Overline>{title}</Overline>
      </View>
      {children}
    </View>
  );
}

/**
 * A row that hands off to another app.
 *
 * `canOpenURL` is checked first: a tablet with no dialler, or an Android build
 * whose manifest does not declare the `tel` intent, would otherwise fail
 * silently on tap and look like a broken button.
 */
export function ActionRow({ label, value, url }: { label: string; value: string; url: string }) {
  const t = useTheme();
  const open = async () => {
    try {
      if (await Linking.canOpenURL(url)) await Linking.openURL(url);
    } catch {
      // Nothing useful to say — the handoff simply is not available here.
    }
  };

  return (
    <>
      <Row onPress={open}>
        <View style={styles.actionRow}>
          <View style={styles.actionText}>
            <Overline>{label}</Overline>
            <Gap size="xs" />
            <Txt variant="body" tone="accent" numberOfLines={1}>
              {value}
            </Txt>
          </View>
          <Txt variant="body" tone="subtle">
            ›
          </Txt>
        </View>
      </Row>
      <Divider inset={spacing.md} />
    </>
  );
}

/** Builds a platform-correct maps URL for an address. */
export function mapsUrl(address: string): string {
  const q = encodeURIComponent(address);
  // Apple Maps on iOS, the geo: intent elsewhere — a Google Maps https link
  // would open a browser on a phone without the app installed.
  return Platform.select({
    ios: `maps:0,0?q=${q}`,
    android: `geo:0,0?q=${q}`,
    default: `https://maps.google.com/?q=${q}`,
  })!;
}

/**
 * The header every detail screen opens with: a small label over a large value.
 * Same shape as a list row, deliberately — the row you tapped expands into it.
 */
export function DetailHeader({
  overline,
  title,
  subtitle,
}: {
  overline?: string | null;
  title: string;
  subtitle?: string | null;
}) {
  return (
    <View style={styles.header}>
      {overline ? <Overline>{overline}</Overline> : null}
      <Gap size="xs" />
      <Txt variant="display" numeric>
        {title}
      </Txt>
      {subtitle ? (
        <>
          <Gap size="sm" />
          <Txt variant="body" tone="muted">
            {subtitle}
          </Txt>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  actionRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  actionText: { flex: 1 },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 0,
  },
});
