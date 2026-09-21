import type { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import { activitiesApi, type ActivityScope } from "../api";
import { timeAgo } from "../lib/dates";
import { humanize } from "../domain/stages";
import { spacing, useTheme } from "../theme";
import { Badge, Card, ErrorState, LoadingState, Screen, SectionHeader, Txt } from "../ui";

/**
 * Shared frame for the five detail screens: query states, pull-to-refresh, and
 * the activity timeline every record carries. Only the record-specific cards
 * differ, so those come in as children.
 */
export function DetailScaffold({
  query,
  scope,
  children,
}: {
  query: UseQueryResult<unknown>;
  /** Which record the timeline belongs to, e.g. `{ dealId: id }`. */
  scope: ActivityScope;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const activities = useQuery({
    queryKey: ["activities", scope],
    queryFn: () => activitiesApi.list(scope, 20),
    // The parent record is the point of the screen; the timeline is context.
    // Don't block the screen on it and don't retry hard if it fails.
    enabled: !query.isPending && !query.isError,
  });

  if (query.isPending) return <Screen><LoadingState /></Screen>;

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

  return (
    <Screen edges={["left", "right"]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          // A detail screen sits under a stack header with no tab bar below,
          // so nothing else claims the home-indicator strip.
          { paddingBottom: spacing.xl + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => {
              void query.refetch();
              void activities.refetch();
            }}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {children}

        <View>
          <SectionHeader title="Activity" />
          <Card padded={false}>
            {activities.isPending ? (
              <View style={styles.row}>
                <Txt variant="label" color="subtle">
                  Loading…
                </Txt>
              </View>
            ) : (activities.data?.length ?? 0) === 0 ? (
              <View style={styles.row}>
                <Txt variant="label" color="subtle">
                  No activity recorded yet.
                </Txt>
              </View>
            ) : (
              activities.data?.map((activity, index) => (
                <View
                  key={activity.id}
                  style={[
                    styles.row,
                    index > 0 && {
                      borderTopColor: colors.line,
                      borderTopWidth: StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <View style={styles.rowBody}>
                    <Txt variant="body" numberOfLines={2}>
                      {activity.subject || humanize(activity.kind)}
                    </Txt>
                    {activity.body ? (
                      <Txt variant="label" color="muted" numberOfLines={3}>
                        {activity.body}
                      </Txt>
                    ) : null}
                    <Txt variant="caption" color="subtle">
                      {activity.authorName || "System"} · {timeAgo(activity.occurredAt)}
                    </Txt>
                  </View>
                  <Badge tone="neutral">{humanize(activity.kind)}</Badge>
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.lg },
  row: { flexDirection: "row", gap: spacing.sm, padding: spacing.sm + 4, alignItems: "flex-start" },
  rowBody: { flex: 1, gap: 3 },
});
