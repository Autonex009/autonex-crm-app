import { useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { dashboardApi, notificationsApi, type Attention, type NotificationItem } from "../api";
import { timeAgo } from "../lib/dates";
import { formatMoneyCompact } from "../lib/money";
import { useCurrency } from "../org/workspace";
import { useAuthStore } from "../store/auth";
import { radius, spacing, toneColors, useTheme, type Tone } from "../theme";
import {
  AppLogo,
  Badge,
  Card,
  ErrorState,
  LoadingState,
  Screen,
  SectionHeader,
  StatTile,
  ThemeToggle,
  Txt,
} from "../ui";
import { ScreenHeader } from "./ScreenHeader";
import type { AppNavigation } from "../navigation/types";

/** Overdue items get progressively louder, as the web dashboard does. */
function attentionTone(days: number): Tone {
  if (days >= 14) return "danger";
  if (days >= 7) return "warning";
  return "info";
}

function priorityTone(priority: NotificationItem["priority"]): Tone {
  switch (priority) {
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "danger":
      return "danger";
    default:
      return "info";
  }
}

export function DashboardScreen() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const currency = useCurrency();
  const navigation = useNavigation<AppNavigation>();
  const user = useAuthStore((s) => s.user);

  const query = useQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.summary });
  const notifsQuery = useQuery({
    queryKey: ["notifications", "recent"],
    queryFn: () => notificationsApi.list(5),
    refetchInterval: 30_000,
  });

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  if (query.isPending) {
    return (
      <Screen>
        <LoadingState label="Loading workspace…" />
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        <ErrorState
          message={query.error instanceof Error ? query.error.message : "Request failed"}
          onRetry={() => void query.refetch()}
        />
      </Screen>
    );
  }

  const s = query.data;
  const unreadCount = notifsQuery.data?.unreadCount ?? 0;
  const recentNotifs = notifsQuery.data?.items?.slice(0, 3) ?? [];

  return (
    <Screen>
      <ScreenHeader
        title="Dealbridge"
        subtitle="Workspace overview"
        leading={<AppLogo size={36} rounded />}
        showBack={false}
        action={
          <View style={styles.headerActions}>
            <ThemeToggle size="sm" />
            <Pressable
              onPress={() => navigation.navigate("Notifications")}
              style={({ pressed }) => [
                styles.bellButton,
                {
                  backgroundColor: pressed ? colors.surfaceHover : colors.surface,
                  borderColor: colors.line,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Notifications, ${unreadCount} unread`}
              hitSlop={6}
            >
              <Feather name="bell" size={17} color={colors.fg} />
              {unreadCount > 0 && (
                <View style={[styles.badgeDot, { backgroundColor: colors.badSolid }]}>
                  <Txt variant="caption" style={styles.badgeDotText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Txt>
                </View>
              )}
            </Pressable>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          // The tab bar floats over this list; without the inset the last card
          // sits under it on a gesture-navigation device.
          { paddingBottom: spacing.xl + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching || notifsQuery.isRefetching}
            onRefresh={() => {
              void query.refetch();
              void notifsQuery.refetch();
            }}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Modern Welcome & Quick Shortcuts Hero Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: dark ? colors.surface : "#ffffff",
              borderColor: dark ? colors.lineStrong : colors.line,
              shadowColor: dark ? "#000" : "#4338ca",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: dark ? 0.3 : 0.05,
              shadowRadius: 8,
              elevation: 2,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroGreeting}>
              <Txt variant="heading" style={styles.greetingTitle}>
                {greeting}, {user?.name?.split(" ")[0] || "there"} 👋
              </Txt>
              <Txt variant="caption" color="muted">
                {s.deals.open} active deals · {formatMoneyCompact(s.deals.total, currency)} in pipeline
              </Txt>
            </View>
            <View style={[styles.liveBadge, { backgroundColor: colors.okSoft, borderColor: colors.okFg }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.okFg }]} />
              <Txt variant="caption" style={{ color: colors.okFg, fontSize: 10, fontWeight: "800" }}>
                ACTIVE
              </Txt>
            </View>
          </View>

          {/* Quick Action Pills */}
          <View style={styles.quickActions}>
            <Pressable
              onPress={() => navigation.navigate("Leads")}
              style={({ pressed }) => [
                styles.actionPill,
                {
                  backgroundColor: pressed ? colors.surfaceHover : colors.surfaceMuted,
                  borderColor: colors.line,
                },
              ]}
            >
              <Feather name="trending-up" size={13} color={colors.accent} />
              <Txt variant="label" style={{ fontSize: 12 }}>Leads</Txt>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate("Deals")}
              style={({ pressed }) => [
                styles.actionPill,
                {
                  backgroundColor: pressed ? colors.surfaceHover : colors.surfaceMuted,
                  borderColor: colors.line,
                },
              ]}
            >
              <Feather name="briefcase" size={13} color={colors.accent} />
              <Txt variant="label" style={{ fontSize: 12 }}>Deals</Txt>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate("Companies")}
              style={({ pressed }) => [
                styles.actionPill,
                {
                  backgroundColor: pressed ? colors.surfaceHover : colors.surfaceMuted,
                  borderColor: colors.line,
                },
              ]}
            >
              <Feather name="home" size={13} color={colors.accent} />
              <Txt variant="label" style={{ fontSize: 12 }}>Companies</Txt>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate("Notifications")}
              style={({ pressed }) => [
                styles.actionPill,
                {
                  backgroundColor: pressed ? colors.surfaceHover : colors.surfaceMuted,
                  borderColor: colors.line,
                },
              ]}
            >
              <Feather name="bell" size={13} color={colors.accent} />
              <Txt variant="label" style={{ fontSize: 12 }}>Alerts</Txt>
            </Pressable>
          </View>
        </View>

        {/* Notifications Spotlight Card on Dashboard */}
        <View>
          <SectionHeader
            title={`Notifications ${unreadCount > 0 ? `(${unreadCount} new)` : ""}`}
            action={
              <Pressable
                onPress={() => navigation.navigate("Notifications")}
                hitSlop={8}
              >
                <Txt variant="label" color="accent">
                  View all →
                </Txt>
              </Pressable>
            }
          />
          <Card padded={false}>
            {recentNotifs.length === 0 ? (
              <View style={styles.emptyNotifs}>
                <Feather name="check-circle" size={18} color={colors.okFg} />
                <Txt variant="body" color="muted">
                  All caught up! No recent notifications.
                </Txt>
              </View>
            ) : (
              recentNotifs.map((item, index) => {
                const tone = priorityTone(item.priority);
                const { fg } = toneColors(tone, colors);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => navigation.navigate("Notifications")}
                    style={({ pressed }) => [
                      styles.notifRow,
                      index > 0 && {
                        borderTopColor: colors.line,
                        borderTopWidth: StyleSheet.hairlineWidth,
                      },
                      pressed && { backgroundColor: colors.surfaceHover },
                    ]}
                  >
                    <View
                      style={[
                        styles.notifDot,
                        { backgroundColor: item.isRead ? "transparent" : fg },
                      ]}
                    />
                    <View style={styles.notifBody}>
                      <Txt variant={item.isRead ? "body" : "heading"} numberOfLines={1}>
                        {item.title}
                      </Txt>
                      {item.body ? (
                        <Txt variant="caption" color="muted" numberOfLines={1}>
                          {item.body}
                        </Txt>
                      ) : null}
                    </View>
                    <Txt variant="caption" color="subtle">
                      {timeAgo(item.createdAt)}
                    </Txt>
                  </Pressable>
                );
              })
            )}
          </Card>
        </View>

        {/* Pipeline Section */}
        <View>
          <SectionHeader title="Pipeline" />
          <View style={styles.grid}>
            <StatTile
              label="Open deals"
              value={s.deals.open}
              hint={formatMoneyCompact(s.deals.total, currency)}
            />
            <StatTile label="Won" value={s.deals.won} tone="success" />
            <StatTile label="Open leads" value={s.leads.open} />
            <StatTile
              label="Quotes"
              value={s.quotes.open}
              hint={formatMoneyCompact(s.quotes.total, currency)}
            />
          </View>
        </View>

        {/* Billing Section */}
        <View>
          <SectionHeader title="Billing" />
          <View style={styles.grid}>
            <StatTile
              label="Outstanding"
              value={formatMoneyCompact(s.invoices.outstanding, currency)}
              tone={s.invoices.outstanding > 0 ? "warning" : "neutral"}
            />
            <StatTile
              label="Overdue"
              value={formatMoneyCompact(s.invoices.overdue, currency)}
              tone={s.invoices.overdue > 0 ? "danger" : "neutral"}
            />
            <StatTile
              label="Paid"
              value={formatMoneyCompact(s.invoices.paid, currency)}
              tone="success"
            />
            <StatTile label="Contacts" value={s.contacts} hint={`${s.members} members`} />
          </View>
        </View>

        {/* Needs Attention */}
        {s.attention.length > 0 && (
          <View>
            <SectionHeader title={`Needs attention (${s.attention.length})`} />
            <Card padded={false}>
              {s.attention.slice(0, 8).map((item: Attention, index) => (
                <View
                  key={`${item.kind}-${item.id}`}
                  style={[
                    styles.attention,
                    index > 0 && {
                      borderTopColor: colors.line,
                      borderTopWidth: StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <View style={styles.attentionBody}>
                    <Txt variant="heading" numberOfLines={1}>
                      {item.label}
                    </Txt>
                    <Txt variant="label" color="muted" numberOfLines={1}>
                      {item.detail}
                    </Txt>
                  </View>
                  <Badge tone={attentionTone(item.days)}>{item.days}d</Badge>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Recent Activity */}
        {s.recent.length > 0 && (
          <View>
            <SectionHeader title="Recent activity" />
            <Card padded={false}>
              {s.recent.slice(0, 10).map((item, index) => (
                <View
                  key={`${item.entity}-${item.at}-${index}`}
                  style={[
                    styles.attention,
                    index > 0 && {
                      borderTopColor: colors.line,
                      borderTopWidth: StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <View style={styles.attentionBody}>
                    <Txt variant="body" numberOfLines={1}>
                      {item.subject}
                    </Txt>
                    <Txt variant="caption" color="subtle" numberOfLines={1}>
                      {item.actor || "System"} · {timeAgo(item.at)}
                    </Txt>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.lg,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeDot: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeDotText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 11,
  },
  heroCard: {
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  heroGreeting: {
    flex: 1,
    gap: 3,
  },
  greetingTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  quickActions: {
    flexDirection: "row",
    gap: spacing.xs + 2,
  },
  actionPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  emptyNotifs: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm + 4,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notifBody: {
    flex: 1,
    gap: 2,
  },
  attention: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm + 4,
  },
  attentionBody: {
    flex: 1,
    gap: 2,
  },
});
