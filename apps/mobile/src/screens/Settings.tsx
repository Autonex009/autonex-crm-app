import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Linking, ScrollView, View } from "react-native";

import { API_URL, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { usePushToken } from "../lib/usePush";
import { registerForPush, setBadge, unregisterPush } from "../lib/push";
import { spacing, useTheme } from "../theme";
import { Button, Divider, Gap, Overline, StatusLabel, Txt } from "../ui";
import { Field, Section } from "../ui/detail";

/**
 * Settings.
 *
 * Mostly a status screen: the only things worth changing from here are whether
 * this device receives notifications, and whether you are signed in.
 */
export function SettingsScreen() {
  const t = useTheme();
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const clear = useAuth((s) => s.clear);
  const { token, reason, refresh } = usePushToken();
  const [busy, setBusy] = useState(false);

  const enablePush = async () => {
    setBusy(true);
    const result = await registerForPush();
    refresh(result);
    setBusy(false);

    // iOS shows its permission prompt once per install. After a denial,
    // requesting again returns denied without a prompt, so the only way back is
    // the system settings screen — say so rather than letting the button look
    // broken.
    if (!result.token && result.reason?.includes("turned off")) {
      void Linking.openSettings();
    }
  };

  const signOut = async () => {
    setBusy(true);
    // Detach the device first: otherwise this handset keeps receiving the
    // signed-out user's notifications until someone signs in again.
    await unregisterPush(token);
    await api.endSession();
    await setBadge(0);
    qc.clear();
    clear();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.canvas }}
      contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
    >
      <View style={{ padding: spacing.md }}>
        <Overline>Signed in as</Overline>
        <Gap size="xs" />
        <Txt variant="title">{user?.name || user?.email || "—"}</Txt>
        {user?.name && user?.email ? (
          <>
            <Gap size="xs" />
            <Txt variant="caption" tone="subtle">
              {user.email}
            </Txt>
          </>
        ) : null}
      </View>

      <Section title="Notifications">
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
          <StatusLabel tone={token ? "success" : "warning"}>
            {token ? "This device is receiving notifications" : "Not receiving notifications"}
          </StatusLabel>
          <Gap size="sm" />
          <Txt variant="caption" tone="subtle">
            {token
              ? "Deal moves and follow-ups arrive on your lock screen. Tapping one opens it here."
              : (reason ?? "Turn these on to hear about deal moves without opening the app.")}
          </Txt>
          {!token ? (
            <>
              <Gap size="md" />
              <Button
                title="Enable notifications"
                onPress={enablePush}
                variant="secondary"
                loading={busy}
              />
            </>
          ) : null}
        </View>
      </Section>

      <Section title="Connection">
        <View style={{ paddingVertical: spacing.sm }}>
          <Field label="API" value={API_URL} />
          <Field label="Workspace" value={user?.orgId ?? null} />
          <Field label="Role" value={user?.role ?? null} />
        </View>
      </Section>

      <Section title="About">
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
          <Txt variant="caption" tone="subtle">
            A read-only companion to the DealBridge web app. Creating and editing records happens
            there; this is for keeping up and reaching people.
          </Txt>
        </View>
      </Section>

      <Gap size="lg" />
      <Divider />
      <View style={{ padding: spacing.md }}>
        <Button title="Sign out" onPress={signOut} variant="danger" loading={busy} />
      </View>
    </ScrollView>
  );
}
