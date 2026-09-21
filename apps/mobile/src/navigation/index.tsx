import { useState } from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DefaultTheme, DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { useWorkspaceSync } from "../org/workspace";
import { useAuthStore, useSessionUnknown } from "../store/auth";
import { useTheme } from "../theme";
import { LoadingState, Screen } from "../ui";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { AccountDetailScreen } from "../screens/AccountDetailScreen";
import { ActionsScreen } from "../screens/ActionsScreen";
import { AccountsScreen } from "../screens/AccountsScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { DealDetailScreen } from "../screens/DealDetailScreen";
import { DealsScreen } from "../screens/DealsScreen";
import { InvoiceDetailScreen } from "../screens/InvoiceDetailScreen";
import { InvoicesScreen } from "../screens/InvoicesScreen";
import { LeadDetailScreen } from "../screens/LeadDetailScreen";
import { LeadsScreen } from "../screens/LeadsScreen";
import { MoreScreen } from "../screens/MoreScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { QuoteDetailScreen } from "../screens/QuoteDetailScreen";
import { QuotesScreen } from "../screens/QuotesScreen";
import type { AppStackParamList } from "./types";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<AppStackParamList>();

/** Tab glyphs, chosen to echo the web sidebar's lucide icons. */
const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  Dashboard: "grid",
  Leads: "trending-up",
  Deals: "briefcase",
  Companies: "home",
  More: "menu",
};

/** Height of the tab bar itself, before the device's bottom inset. */
const TAB_BAR_HEIGHT = 58;

function Tabs() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();

  // Mounted here rather than per screen: the currency is needed by every tab
  // and this is the one component that stays mounted for the whole session.
  useWorkspaceSync();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.fgSubtle,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: StyleSheet.hairlineWidth,
          // Measured, not guessed per platform: a notched iPhone, a gesture-
          // navigation Android and a three-button Android all want different
          // bottom padding, and a hardcoded 22/8 is wrong on two of the three.
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: dark ? 0.35 : 0.06,
          shadowRadius: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 1 },
        tabBarIcon: ({ color, focused }) => (
          <Feather
            name={TAB_ICONS[route.name] ?? "circle"}
            size={focused ? 21 : 19}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Leads" component={LeadsScreen} />
      <Tab.Screen name="Deals" component={DealsScreen} />
      <Tab.Screen name="Companies" component={AccountsScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

/** Login ⇄ Register. Kept as local state: neither is a deep-linkable route. */
function AuthFlow() {
  const [screen, setScreen] = useState<"login" | "register">("login");

  return screen === "login" ? (
    <LoginScreen onSwitch={() => setScreen("register")} />
  ) : (
    <RegisterScreen onSwitch={() => setScreen("login")} />
  );
}

function AppStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.fg,
        headerTitleStyle: { fontSize: 16, fontWeight: "700" },
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />

      {/* The header title falls back to the name passed by the list row, so a
          detail screen is labelled before its own query resolves. */}
      <Stack.Screen
        name="LeadDetail"
        component={LeadDetailScreen}
        options={({ route }) => ({ title: route.params?.name || "Lead" })}
      />
      <Stack.Screen
        name="DealDetail"
        component={DealDetailScreen}
        options={({ route }) => ({ title: route.params?.name || "Deal" })}
      />
      <Stack.Screen
        name="AccountDetail"
        component={AccountDetailScreen}
        options={({ route }) => ({ title: route.params?.name || "Company" })}
      />
      <Stack.Screen
        name="QuoteDetail"
        component={QuoteDetailScreen}
        options={({ route }) => ({ title: route.params?.name || "Quote" })}
      />
      <Stack.Screen
        name="InvoiceDetail"
        component={InvoiceDetailScreen}
        options={({ route }) => ({ title: route.params?.name || "Invoice" })}
      />

      <Stack.Screen name="Actions" component={ActionsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Quotes" component={QuotesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Invoices" component={InvoicesScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

/**
 * Chooses the tree for the current session state.
 *
 * `unknown` is the boot state — the refresh token may or may not still be
 * valid, and rendering the login screen before /auth/refresh answers would
 * flash it on every cold start for an already-signed-in user.
 */
export function RootNavigator() {
  const { colors, dark } = useTheme();
  const status = useAuthStore((s) => s.status);
  const unknown = useSessionUnknown();

  const navTheme = {
    ...(dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(dark ? DarkTheme : DefaultTheme).colors,
      primary: colors.accent,
      background: colors.canvas,
      card: colors.surface,
      text: colors.fg,
      border: colors.line,
    },
  };

  if (unknown) {
    return (
      <Screen>
        <LoadingState label="Restoring session…" />
      </Screen>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {status === "authenticated" ? <AppStack /> : <AuthFlow />}
    </NavigationContainer>
  );
}
