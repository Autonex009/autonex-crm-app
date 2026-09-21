import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { orgApi } from "../api";
import { canSeeActions } from "../api/actions";
import { endSession } from "../lib/api";
import { humanize } from "../domain/stages";
import { useAuthStore } from "../store/auth";
import { spacing, useTheme, useThemeStore } from "../theme";
import {
  AppLogo,
  Avatar,
  Badge,
  Button,
  Card,
  DetailRow,
  Divider,
  ListRow,
  Screen,
  SectionHeader,
  ThemeToggle,
  Txt,
} from "../ui";
import { ScreenHeader } from "./ScreenHeader";
import type { AppNavigation } from "../navigation/types";

const THEME_LABEL = { system: "Follow system", light: "Light", dark: "Dark" } as const;

/**
 * The tab bar holds five slots; everything past Dashboard/Leads/Deals/Companies
 * lives here — quotes, invoices, the team roster and session controls.
 */
export function MoreScreen({ navigation }: { navigation: AppNavigation }) {
  const { dark } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const mode = useThemeStore((s) => s.mode);
  const cycleTheme = useThemeStore((s) => s.cycle);

  const workspace = useQuery({ queryKey: ["workspace"], queryFn: orgApi.workspace });
  const members = useQuery({ queryKey: ["members"], queryFn: orgApi.members });

  const signOut = async () => {
    await endSession();
    // Drop every cached record with the session: the next user to sign in on
    // this device must not see the previous one's pipeline.
    queryClient.clear();
  };

  return (
    <Screen>
      <ScreenHeader title="More" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          // The tab bar floats over this list; without the inset the sign-out
          // button sits under it on a gesture-navigation device.
          { paddingBottom: spacing.xl + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <View style={styles.profile}>
            <Avatar name={user?.name || user?.email} size={44} />
            <View style={styles.profileText}>
              <Txt variant="heading" numberOfLines={1}>
                {user?.name || user?.email || "Signed in"}
              </Txt>
              <Txt variant="label" color="muted" numberOfLines={1}>
                {user?.email}
              </Txt>
            </View>
            {user?.role ? <Badge tone="brand">{humanize(user.role)}</Badge> : null}
          </View>
        </Card>

        <View>
          <SectionHeader title="Sales & billing" />
          <View style={styles.group}>
            {/* Actions are manager-only server side, so the row is hidden
                rather than left to open a screen that would 403. */}
            {canSeeActions(user?.role) && (
              <ListRow title="Actions" onPress={() => navigation.navigate("Actions")} />
            )}
            <ListRow title="Quotes" onPress={() => navigation.navigate("Quotes")} />
            <ListRow title="Invoices" onPress={() => navigation.navigate("Invoices")} />
            <ListRow
              title="Notifications"
              onPress={() => navigation.navigate("Notifications")}
            />
          </View>
        </View>

        <View>
          <SectionHeader title="Workspace" />
          <Card>
            <DetailRow label="Name" value={workspace.data?.name ?? "—"} />
            <DetailRow label="Currency" value={workspace.data?.currency ?? "—"} />
            <Divider style={{ marginVertical: 10 }} />
            <DetailRow
              label="Theme"
              value={
                <View style={styles.themeRow}>
                  <View style={{ gap: 2 }}>
                    <Txt variant="body">{dark ? "Dark mode" : "Light mode"}</Txt>
                    <Txt variant="caption" color="muted">
                      {mode === "system" ? "Following system" : "Custom preference"}
                    </Txt>
                  </View>
                  <ThemeToggle size="md" />
                </View>
              }
            />
          </Card>
        </View>

        <View>
          <SectionHeader title={`Team (${members.data?.length ?? 0})`} />
          <View style={styles.group}>
            {(members.data ?? []).map((member) => (
              <ListRow
                key={member.id}
                title={member.name || member.email}
                subtitle={member.name ? member.email : null}
                leading={<Avatar name={member.name || member.email} size={28} />}
                trailing={
                  member.role ? <Badge tone="neutral">{humanize(member.role)}</Badge> : null
                }
              />
            ))}
          </View>
        </View>

        <Button variant="danger" block onPress={signOut}>
          Sign out
        </Button>

        <View style={styles.footerBrand}>
          <AppLogo size={32} rounded />
          <View style={styles.footerText}>
            <Txt variant="heading">Dealbridge</Txt>
            <Txt variant="caption" color="subtle">
              Powered by Autonex AI · v1.0.0
            </Txt>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.lg },
  profile: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 4 },
  profileText: { flex: 1, gap: 2 },
  group: { gap: spacing.sm },
  themeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footerBrand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm + 2,
    paddingTop: spacing.md,
  },
  footerText: { alignItems: "flex-start", gap: 1 },
});
