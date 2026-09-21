import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp, NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";

export type TabParamList = {
  Dashboard: undefined;
  Leads: undefined;
  Deals: undefined;
  Companies: undefined;
  More: undefined;
};

/**
 * Every route in the authenticated stack, with its params.
 */
export type AppStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  LeadDetail: { id: string; name?: string };
  DealDetail: { id: string; name?: string };
  AccountDetail: { id: string; name?: string };
  QuoteDetail: { id: string; name?: string };
  InvoiceDetail: { id: string; name?: string };
  Actions: undefined;
  Quotes: undefined;
  Invoices: undefined;
  Notifications: undefined;
};

export type AppNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  NativeStackNavigationProp<AppStackParamList>
>;

export type AppRouteProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>;
