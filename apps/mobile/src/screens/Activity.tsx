import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { RefreshControl, SectionList, StyleSheet, View } from "react-native";

import { relativeTime } from "../lib/format";
import {
  type NotificationItem,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from "../lib/queries";
import { spacing, useTheme } from "../theme";
import {
  Divider,
  Empty,
  Failed,
  Gap,
  Loading,
  Overline,
  Row,
  StatusDot,
  type StatusTone,
  Txt,
} from "../ui";
import { routeFor } from "../navigation/routeFor";

/**
 * The home screen.
 *
 * Activity, not a dashboard. The app exists because a push arrives and someone
 * taps it, so the first screen is the same list that push came from — tapping a
 * banner and tapping a row lead to exactly the same place, which means there is
 * only one mental model to learn.
 *
 * Grouped unread-first rather than strictly chronological: the question on
 * opening the app is "what have I not seen", and a pure timeline buries that
 * under this morning's already-read noise.
 */
export function ActivityScreen() {
  const navigation = useNavigation<any>();
  const t = useTheme();
  const { data, isLoading, isRefetching, refetch, error } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const onPress = useCallback(
    (item: NotificationItem) => {
      if (!item.isRead) markRead.mutate(item.id);
      const route = routeFor(item.actionUrl);
      if (route) navigation.navigate(route.screen, route.params);
    },
    [markRead, navigation],
  );

  if (isLoading) return <Loading />;
  if (error) return <Failed error={error} onRetry={refetch} />;

  const items = data?.items ?? [];
  const unread = items.filter((n) => !n.isRead);
  const read = items.filter((n) => n.isRead);

  const sections = [
    ...(unread.length ? [{ title: `${unread.length} new`, data: unread }] : []),
    ...(read.length ? [{ title: "Earlier", data: read }] : []),
  ];

  if (!items.length) {
    return (
      <Empty
        title="Nothing yet"
        detail="Deal moves and follow-ups will show up here, and on your lock screen."
      />
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      style={{ backgroundColor: t.canvas }}
      contentContainerStyle={{ paddingBottom: spacing["2xl"] }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.fg.subtle} />
      }
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Overline>{section.title}</Overline>
          {section.data === unread && unread.length > 1 ? (
            <Txt
              variant="caption"
              tone="accent"
              onPress={() => markAllRead.mutate()}
              suppressHighlighting
            >
              Mark all read
            </Txt>
          ) : null}
        </View>
      )}
      renderItem={({ item }) => <NotificationRow item={item} onPress={onPress} />}
      ItemSeparatorComponent={() => <Divider inset={spacing.md} />}
      SectionSeparatorComponent={null}
    />
  );
}

const TONE: Record<string, StatusTone> = {
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
};

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
}) {
  const t = useTheme();
  return (
    <Row onPress={() => onPress(item)}>
      <View style={styles.row}>
        {/*
          The unread marker is a dot in the gutter rather than a bold row or a
          tinted background: it stays legible against the priority colour, and
          it does not shift the text when it disappears on read.
        */}
        <View style={styles.gutter}>
          {item.isRead ? null : <StatusDot tone={TONE[item.priority] ?? "info"} />}
        </View>

        <View style={styles.body}>
          <View style={styles.titleLine}>
            <Txt
              variant={item.isRead ? "body" : "bodyStrong"}
              tone={item.isRead ? "muted" : "default"}
              numberOfLines={1}
              style={styles.title}
            >
              {item.title}
            </Txt>
            <Txt variant="caption" tone="subtle" numeric>
              {relativeTime(item.createdAt)}
            </Txt>
          </View>
          <Gap size="xs" />
          <Txt variant="caption" tone={item.isRead ? "subtle" : "muted"} numberOfLines={2}>
            {item.body}
          </Txt>
        </View>
      </View>
    </Row>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  row: { flexDirection: "row", alignItems: "flex-start" },
  gutter: { width: 14, paddingTop: 7 },
  body: { flex: 1 },
  titleLine: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  title: { flex: 1 },
});
