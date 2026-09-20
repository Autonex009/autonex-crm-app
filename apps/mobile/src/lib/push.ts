import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { api } from "./api";

/**
 * Push notifications.
 *
 * The flow, end to end:
 *
 *   app launch -> ask the OS for permission -> get an Expo push token
 *              -> POST it to /api/v1/notifications/devices
 *   deal moves -> gateway records a notification -> POSTs to Expo
 *              -> Expo routes to APNs / FCM -> banner on the phone
 *   tap        -> data.actionUrl tells the app which screen to open
 *
 * Expo's service rather than APNs and FCM directly, because that keeps this an
 * Expo managed build: no certificates, no google-services.json, no native
 * module, no eject.
 */

export const NOTIFICATION_CHANNEL = "default";

/**
 * What to do with a notification that arrives while the app is open.
 *
 * Banners are shown rather than suppressed: the whole point of this app is that
 * someone learns a deal moved, and swallowing the alert because they happen to
 * be looking at a different screen would defeat it. The list also refetches on
 * receipt, so the banner and the Activity screen never disagree.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/** The routing payload the gateway attaches to every push. */
export interface PushPayload {
  notificationId?: string;
  type?: string;
  actionUrl?: string;
  priority?: string;
}

/**
 * Android needs a channel before any notification can be shown as a heads-up
 * banner. Created on every launch because it is idempotent, and because a
 * channel deleted by the user in system settings should come back.
 */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL, {
    name: "Deal activity",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: "#4F46E5",
  });
}

/**
 * Asks for permission and registers this device with the gateway.
 *
 * Returns the token on success, or null with a reason. Callers treat null as
 * "push is off" and carry on — the app is fully usable without it, and the
 * Activity screen still lists everything on pull-to-refresh.
 */
export type PushRegistration =
  { token: string; reason?: undefined } | { token: null; reason: string };

export async function registerForPush(): Promise<PushRegistration> {
  // A simulator has no push service to register with, and asking produces a
  // confusing failure rather than a prompt.
  if (!Device.isDevice) {
    return { token: null, reason: "Push notifications need a physical device." };
  }

  await ensureAndroidChannel();

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  // Only ask when we have not asked before. iOS shows the system prompt exactly
  // once per install; asking again after a denial silently returns denied, so
  // re-prompting achieves nothing and the app must send the user to Settings.
  if (status !== "granted" && existing.canAskAgain) {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") {
    return { token: null, reason: "Notifications are turned off for this app." };
  }

  // projectId is what ties the token to the EAS project. Without it Expo cannot
  // mint one in a production build, and the error it gives is opaque.
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  let token: string;
  try {
    token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
  } catch (err) {
    return {
      token: null,
      reason: err instanceof Error ? err.message : "Could not get a push token.",
    };
  }

  try {
    // Idempotent by design: the token can be reissued after an app update or a
    // restore onto a new handset, and the client cannot tell which case it is
    // in, so it re-registers every launch and the server reconciles.
    await api.apiFetch("/api/v1/notifications/devices", {
      method: "POST",
      body: JSON.stringify({
        token,
        platform: Platform.OS,
        deviceName: Device.deviceName ?? Device.modelName ?? undefined,
      }),
    });
  } catch (err) {
    return {
      token: null,
      reason: err instanceof Error ? err.message : "Could not register this device.",
    };
  }

  return { token };
}

/**
 * Detaches this device server-side, on sign-out.
 *
 * Without it the handset keeps receiving the previous user's notifications
 * until someone signs in again and the row is re-pointed — which on a shared
 * phone means one person's deals leaking to another.
 */
export async function unregisterPush(token: string | null): Promise<void> {
  if (!token) return;
  try {
    await api.apiFetch("/api/v1/notifications/devices", {
      method: "DELETE",
      body: JSON.stringify({ token }),
    });
  } catch {
    // Best effort. Signing out locally still has to succeed, and the server
    // prunes the token anyway once Expo reports the install as gone.
  }
}

/** Sets the app-icon badge, tolerating platforms that do not support it. */
export async function setBadge(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch {
    // Android launchers vary in whether they honour this at all.
  }
}
