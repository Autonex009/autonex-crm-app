import { Pressable, StyleSheet, View } from "react-native";
import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { notificationsApi, type NotificationItem } from "../api";
import type { NotificationsResponse } from "../api";
import { useUncountedList } from "../lib/paged";
import { timeAgo } from "../lib/dates";
import { radius, spacing, toneColors, useTheme, type Tone } from "../theme";
import { Badge, QueryList, Screen, Txt } from "../ui";
import { ScreenHeader } from "./ScreenHeader";

/** The API's priority vocabulary maps onto the shared tone scale. */
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

/** Rows per request. A feed is scrolled, so a small page keeps it responsive. */
const PAGE_SIZE = 25;

export function NotificationsScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  // `select` is memoised because the hook flat-maps through it; a fresh
  // closure each render would rebuild the row array on every commit.
  const selectItems = useCallback(
    (page: NotificationsResponse) => page.items ?? [],
    [],
  );

  const feed = useUncountedList<NotificationItem, NotificationsResponse>({
    queryKey: ["notifications", "feed"],
    pageSize: PAGE_SIZE,
    fetchPage: (offset, limit) => notificationsApi.list(limit, offset),
    select: selectItems,
    // The bell badge should not lag behind reality by much.
    refetchInterval: 60_000,
  });

  // Marking read is the one write this screen performs: it is part of reading
  // the feed, not authoring data, and without it the unread count never clears.
  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const items = feed.items;
  // The count lives on every page; the first is the freshest one loaded.
  const unread = (Array.isArray(feed.pages) && feed.pages[0]?.unreadCount) || 0;

  return (
    <Screen>
      <ScreenHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : "All caught up"}
        action={
          unread > 0 ? (
            <Pressable onPress={() => markAllRead.mutate()} hitSlop={8}>
              <Txt variant="label" color="accent">
                Mark all read
              </Txt>
            </Pressable>
          ) : null
        }
      />

      <QueryList<NotificationItem>
        query={feed.query}
        data={items}
        hasNextPage={feed.hasNextPage}
        isFetchingNextPage={feed.isFetchingNextPage}
        onEndReached={feed.fetchNextPage}
        keyExtractor={(item) => item.id}
        emptyTitle="Nothing yet"
        emptyDetail="Alerts about your leads, deals and invoices land here."
        renderItem={(item) => {
          const tone = priorityTone(item.priority);
          const { fg } = toneColors(tone, colors);

          return (
            <Pressable
              onPress={() => !item.isRead && markRead.mutate(item.id)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: pressed ? colors.surfaceHover : colors.surface,
                  borderColor: colors.line,
                },
              ]}
            >
              {/* Unread marker in the priority colour: one glance tells you
                  both what is new and how much it matters. */}
              <View
                style={[
                  styles.dot,
                  { backgroundColor: item.isRead ? "transparent" : fg },
                ]}
              />

              <View style={styles.body}>
                <Txt variant={item.isRead ? "body" : "heading"} numberOfLines={2}>
                  {item.title}
                </Txt>
                {item.body ? (
                  <Txt variant="label" color="muted" numberOfLines={3}>
                    {item.body}
                  </Txt>
                ) : null}
                <View style={styles.meta}>
                  <Badge tone={tone}>{item.type.replace(/[_.]/g, " ")}</Badge>
                  <Txt variant="caption" color="subtle">
                    {timeAgo(item.createdAt)}
                  </Txt>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm + 4,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  body: { flex: 1, gap: 4 },
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 2 },
});
