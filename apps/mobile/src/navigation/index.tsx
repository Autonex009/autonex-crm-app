import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type NavigationContainerRef,
  type Theme as NavTheme,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useCallback, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { useAuth } from "../lib/auth";
import type { PushPayload } from "../lib/push";
import { useNotifications } from "../lib/queries";
import { useBadgeSync, usePushRegistration } from "../lib/usePush";
import { ActivityScreen } from "../screens/Activity";
import { CompaniesScreen } from "../screens/Companies";
import { CompanyDetailScreen } from "../screens/CompanyDetail";
import { DealDetailScreen } from "../screens/DealDetail";
import { DealsScreen } from "../screens/Deals";
import { LeadDetailScreen } from "../screens/LeadDetail";
import { LeadsScreen } from "../screens/Leads";
import { SettingsScreen } from "../screens/Settings";
import { SignInScreen } from "../screens/SignIn";
import { HAIRLINE, type Theme, useTheme } from "../theme";
import { Loading, Txt } from "../ui";
import { routeFor } from "./routeFor";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/**
 * Tab icons as glyphs rather than an icon font.
 *
 * A vector icon package is ~500 KB of fonts in the bundle for five shapes. At
 * this size a filled dot that grows and takes the accent colour when active
 * reads as clearly, costs nothing, and matches the restraint of the rest of the
 * UI.
 */
function TabDot({ focused, color }: { focused: boolean; color: string }) {
  return (
    <View
      style={[
        styles.tabDot,
        {
          backgroundColor: color,
          width: focused ? 8 : 6,
          height: focused ? 8 : 6,
          opacity: focused ? 1 : 0.45,
        },
      ]}
    />
  );
}

function Tabs() {
  const t = useTheme();
  const { data } = useNotifications();
  useBadgeSync(data?.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: t.canvas },
        headerShadowVisible: false,
        headerTitleStyle: { color: t.fg.default, fontSize: 17, fontWeight: "700" },
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor: t.line,
          borderTopWidth: HAIRLINE,
        },
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.fg.subtle,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: TabDot,
      }}
    >
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          // The unread count is the whole point of the app, so it rides the tab
          // as well as the app icon.
          tabBarBadge: data?.unreadCount ? data.unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: t.accent, fontSize: 10 },
        }}
      />
      <Tab.Screen name="Deals" component={DealsScreen} />
      <Tab.Screen name="Leads" component={LeadsScreen} />
      <Tab.Screen name="Companies" component={CompaniesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

/** React Navigation's theme, derived from ours so headers match the screens. */
function navTheme(t: Theme): NavTheme {
  const base = t.scheme === "dark" ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: t.accent,
      background: t.canvas,
      card: t.surface,
      text: t.fg.default,
      border: t.line,
    },
  };
}

export function RootNavigator() {
  const t = useTheme();
  const status = useAuth((s) => s.status);
  // Typed as an open route map rather than a declared ParamList: routeFor
  // resolves a server-supplied actionUrl, so the screen name is not knowable
  // statically. routeFor is the allowlist — it returns null for anything it
  // does not recognise, so an unknown name never reaches navigate().
  const navRef = useRef<NavigationContainerRef<Record<string, object | undefined>>>(null);

  /**
   * Routes a notification tap.
   *
   * Goes through the container ref rather than a screen's `navigation` prop
   * because a cold-start tap is delivered before any screen has mounted. An
   * unknown actionUrl is ignored, which leaves the app on Activity — a
   * notification type added server-side must never crash an older build.
   */
  const openFromPush = useCallback((payload: PushPayload) => {
    const route = routeFor(payload.actionUrl);
    if (route && navRef.current?.isReady()) {
      navRef.current.navigate(route.screen, route.params);
    }
  }, []);

  usePushRegistration(openFromPush);

  // `unknown` means the boot refresh has not answered yet. Showing the sign-in
  // screen here would flash the login form at someone who is already signed in,
  // on every cold start.
  if (status === "unknown") {
    return (
      <View style={[styles.splash, { backgroundColor: t.canvas }]}>
        <Loading />
        <Txt variant="overline" tone="subtle" style={styles.splashLabel}>
          Autonex DealBridge
        </Txt>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navRef} theme={navTheme(t)}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: t.canvas },
          headerShadowVisible: false,
          headerTintColor: t.accent,
          headerTitleStyle: { color: t.fg.default, fontSize: 17, fontWeight: "700" },
          contentStyle: { backgroundColor: t.canvas },
        }}
      >
        {status === "authenticated" ? (
          <>
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="DealDetail"
              component={DealDetailScreen}
              options={{ title: "Deal" }}
            />
            <Stack.Screen
              name="LeadDetail"
              component={LeadDetailScreen}
              options={{ title: "Lead" }}
            />
            <Stack.Screen
              name="CompanyDetail"
              component={CompanyDetailScreen}
              options={{ title: "Company" }}
            />
          </>
        ) : (
          <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabDot: { borderRadius: 4 },
  splash: { flex: 1, alignItems: "center", justifyContent: "center" },
  splashLabel: { position: "absolute", bottom: 56, textTransform: "uppercase" },
});
