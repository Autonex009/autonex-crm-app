import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { dealsApi, type Deal } from "../api";
import { actionsApi, canSeeActions, groupActionsByDeal } from "../api/actions";
import { dealTasksApi, groupTasksByDeal } from "../api/tasks";
import { DEAL_STAGES, dealStageMeta, normalizeDealStage } from "../domain/stages";
import { windowed } from "../lib/paged";
import { formatMoneyCompact } from "../lib/money";
import { useCurrency } from "../org/workspace";
import { useAuthStore } from "../store/auth";
import { spacing } from "../theme";
import { QueryList, Screen, Txt } from "../ui";
import { DealCard } from "./deals/DealCard";
import { FilterChips } from "./FilterChips";
import { ScreenHeader } from "./ScreenHeader";
import type { AppNavigation } from "../navigation/types";

/**
 * The web renders deals as a drag-and-drop kanban board. A phone gets the same
 * data as a stage-filtered list instead: horizontal columns on a 390pt screen
 * would show one card at a time, and drag-to-reorder is the one interaction
 * this read-focused app deliberately leaves to the desktop.
 */
const STAGE_FILTERS = [
  { key: "", label: "All" },
  ...DEAL_STAGES.map((stage) => ({ key: stage, label: dealStageMeta(stage).label })),
];

/**
 * Rows added per "page". The board endpoint has no offset — it returns the
 * whole pipeline in one request — so paging here is about how many cards are
 * mounted, not how many are fetched. A deal card is a dozen views deep, and
 * mounting several hundred at once is what drops frames on a mid-range Android.
 */
const PAGE_SIZE = 20;

/**
 * Shared empty list for a deal with no actions.
 *
 * A fresh `[]` per render would give every card a new prop identity and undo
 * `DealCard`'s memo — which on a scrolling board is the whole cost.
 */
const NO_ACTIONS: readonly never[] = [];

export function DealsScreen({ navigation }: { navigation: AppNavigation }) {
  const currency = useCurrency();
  const role = useAuthStore((s) => s.user?.role);
  const [stage, setStage] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const query = useQuery({ queryKey: ["deals"], queryFn: dealsApi.board });

  // Both lists arrive whole and get grouped by deal here, so a card never
  // issues a request of its own — otherwise a 20-card screen is 40 requests.
  const tasks = useQuery({
    queryKey: ["deal-tasks"],
    queryFn: () => dealTasksApi.list(),
    enabled: !query.isPending && !query.isError,
  });

  // Actions: query if manager or if available; retry: false avoids spamming 403
  const managerView = canSeeActions(role);
  const actions = useQuery({
    queryKey: ["actions", "board"],
    queryFn: () => actionsApi.list({ excludeDone: true }),
    enabled: (!role || managerView) && !query.isPending && !query.isError,
    retry: false,
  });

  const tasksByDeal = useMemo(
    () => groupTasksByDeal(tasks.data ?? []),
    [tasks.data],
  );
  const actionsByDeal = useMemo(
    () => groupActionsByDeal(actions.data ?? []),
    [actions.data],
  );

  const filtered = useMemo(() => {
    const all = query.data?.deals ?? [];
    const matching = stage
      ? all.filter((deal) => normalizeDealStage(deal.stage) === stage)
      : all;
    // The board arrives ordered by the kanban position within each column;
    // a flat list is more useful ordered by value.
    return [...matching].sort((a, b) => (b.amount || 0) - (a.amount || 0));
  }, [query.data, stage]);

  // Changing the filter shows a different set of deals from the top, so the
  // window has to start over — otherwise switching to a small stage after
  // scrolling a large one renders every card in it at once.
  useEffect(() => setVisible(PAGE_SIZE), [stage]);

  // Memoised so FlatList's `data` keeps its identity between renders; a new
  // array each time re-renders every mounted row.
  const { items, hasNextPage } = useMemo(
    () => windowed(filtered, visible),
    [filtered, visible],
  );

  const value = useMemo(
    () => filtered.reduce((sum, deal) => sum + (deal.amount || 0), 0),
    [filtered],
  );

  const header = useMemo(() => {
    // `formatMoneyCompact` renders zero as an em dash, which reads as "missing"
    // rather than "nothing in this stage" when it is the only number on the row.
    const total = formatMoneyCompact(value, currency);
    return (
      <View style={styles.header}>
        <Txt variant="caption" color="subtle" uppercase>
          {filtered.length} {filtered.length === 1 ? "deal" : "deals"} ·{" "}
          {total === "—" ? "no value" : total}
        </Txt>
      </View>
    );
  }, [filtered.length, value, currency]);

  const renderItem = useCallback(
    (deal: Deal) => (
      <DealCard
        deal={deal}
        tasks={tasksByDeal[deal.id]}
        actions={actions.isSuccess ? (actionsByDeal[deal.id] ?? NO_ACTIONS) : undefined}
        onPress={() =>
          navigation.navigate("DealDetail", {
            id: deal.id,
            name: deal.title || deal.accountName || "Deal",
          })
        }
      />
    ),
    [tasksByDeal, actionsByDeal, actions.isSuccess, navigation],
  );

  return (
    <Screen>
      <ScreenHeader title="Deals" subtitle="Active pipeline" />

      <FilterChips options={STAGE_FILTERS} value={stage} onChange={setStage} />

      <QueryList<Deal>
        query={query}
        data={items}
        header={header}
        total={filtered.length}
        hasNextPage={hasNextPage}
        onEndReached={() => setVisible((n) => n + PAGE_SIZE)}
        keyExtractor={(deal) => deal.id}
        emptyTitle="No deals"
        emptyDetail="Nothing in this stage right now."
        renderItem={renderItem}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: spacing.sm },
});
