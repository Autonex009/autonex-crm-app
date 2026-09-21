import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import {
  ACTION_PRIORITY_META,
  ACTION_STATUS_LABEL,
  actionMetrics,
  actionPriority,
  actionsApi,
  byActionPriority,
  canSeeActions,
  dueLabel,
  isOverdue,
  matchesView,
  type Action,
  type ActionView,
} from "../api/actions";
import { windowed } from "../lib/paged";
import { useAuthStore } from "../store/auth";
import { spacing, toneColors, useTheme } from "../theme";
import { Badge, EmptyState, ListRow, QueryList, Screen, StatTile, Txt } from "../ui";
import { FilterChips } from "./FilterChips";
import { ScreenHeader } from "./ScreenHeader";

/** Rows mounted per window. The list is loaded whole; this bounds rendering. */
const PAGE_SIZE = 25;

const VIEWS: { key: ActionView; label: string }[] = [
  { key: "active", label: "Open" },
  { key: "overdue", label: "Overdue" },
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "done", label: "Done" },
  { key: "all", label: "All" },
];

/**
 * The web's Actions dashboard, read-only.
 *
 * The gateway returns the org's whole action list in one request, so the saved
 * views slice what is already loaded rather than refetching per chip — which
 * is also why a chip's count can never disagree with the list it opens.
 */
export function ActionsScreen() {
  const { colors } = useTheme();
  const role = useAuthStore((s) => s.user?.role);
  const allowed = canSeeActions(role);

  const [view, setView] = useState<ActionView>("active");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const query = useQuery({
    queryKey: ["actions", "all"],
    queryFn: () => actionsApi.list(),
    enabled: allowed,
  });

  const all = useMemo(() => query.data ?? [], [query.data]);
  const metrics = useMemo(() => actionMetrics(all), [all]);

  const filtered = useMemo(
    () => byActionPriority(all.filter((action) => matchesView(action, view))),
    [all, view],
  );

  // A different view is a different list from the top; keeping the old window
  // would mount every row of a short view at once.
  useEffect(() => setVisible(PAGE_SIZE), [view]);

  const { items, hasNextPage } = useMemo(
    () => windowed(filtered, visible),
    [filtered, visible],
  );

  const header = useMemo(
    () => (
      <View style={styles.tiles}>
        <StatTile
          label="Overdue"
          value={metrics.overdue}
          tone={metrics.overdue > 0 ? "danger" : "neutral"}
        />
        <StatTile
          label="Due today"
          value={metrics.today}
          tone={metrics.today > 0 ? "warning" : "neutral"}
        />
        <StatTile label="Open" value={metrics.active} />
        <StatTile label="Done" value={metrics.done} tone="success" />
      </View>
    ),
    [metrics],
  );

  const renderItem = useCallback(
    (action: Action) => {
      const priority = ACTION_PRIORITY_META[actionPriority(action)];
      const due = dueLabel(action);
      const overdue = isOverdue(action);
      const finished = action.status === "done";

      return (
        <ListRow
          title={action.title}
          leading={
            <View
              style={[
                styles.priorityBar,
                { backgroundColor: toneColors(finished ? "neutral" : priority.tone, colors).fg },
              ]}
            />
          }
          meta={
            <>
              <Badge tone={finished ? "success" : overdue ? "danger" : "neutral"}>
                {ACTION_STATUS_LABEL[action.status] ?? action.status}
              </Badge>
              <Badge tone={finished ? "neutral" : priority.tone} dot>
                {priority.label}
              </Badge>
              <Txt
                variant="caption"
                style={{
                  color: due.tone === "neutral" ? colors.fgSubtle : toneColors(due.tone, colors).fg,
                }}
              >
                {due.text}
              </Txt>
            </>
          }
        />
      );
    },
    [colors],
  );

  if (!allowed) {
    return (
      <Screen>
        <ScreenHeader title="Actions" />
        <EmptyState
          title="Not available"
          detail="Follow-up actions are visible to owners, admins and account managers."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Actions" subtitle="Follow-ups across the workspace" />

      <FilterChips
        options={VIEWS}
        value={view}
        onChange={(key) => setView(key as ActionView)}
      />

      <QueryList<Action>
        query={query}
        data={items}
        header={header}
        total={filtered.length}
        hasNextPage={hasNextPage}
        onEndReached={() => setVisible((n) => n + PAGE_SIZE)}
        keyExtractor={(action) => action.id}
        emptyTitle="Nothing here"
        emptyDetail="No actions match this view."
        renderItem={renderItem}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  // A colour stripe rather than a dot: at row height it is the only priority
  // marker readable without looking directly at it. The row centres its
  // children, so the height is fixed rather than stretched.
  priorityBar: { width: 3, height: 36, borderRadius: 2 },
});
