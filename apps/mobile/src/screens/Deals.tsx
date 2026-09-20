import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { RefreshControl, SectionList, StyleSheet, View } from "react-native";

import { humanize, money, moneyShort, shortDate } from "../lib/format";
import { type Deal, useDeals } from "../lib/queries";
import { spacing, useTheme } from "../theme";
import { Divider, Empty, Failed, Gap, Loading, Overline, Row, Txt } from "../ui";

/**
 * The deal board, flattened into a list.
 *
 * A kanban does not survive the trip to a phone — seven columns at 390pt means
 * either horizontal paging (which hides six of them) or cards too narrow to
 * read. Sections in pipeline order keep the one thing the board was for: where
 * everything sits, and how much is in each place.
 *
 * Every section header carries its own count and total, so the numbers a
 * dashboard would show are already on the screen you navigate to anyway.
 */
export function DealsScreen() {
  const navigation = useNavigation<any>();
  const t = useTheme();
  const { data, isLoading, isRefetching, refetch, error } = useDeals();

  const sections = useMemo(() => {
    if (!data) return [];
    // Server stage order is pipeline order; preserve it rather than sorting.
    const order = data.stages ?? [];
    const byStage = new Map<string, Deal[]>(order.map((s) => [s, []]));

    for (const deal of data.deals ?? []) {
      if (!byStage.has(deal.stage)) byStage.set(deal.stage, []);
      byStage.get(deal.stage)!.push(deal);
    }

    return (
      [...byStage.entries()]
        // An empty stage is signal on a board, where the column still occupies
        // space. In a list it is just a header with nothing under it.
        .filter(([, deals]) => deals.length > 0)
        .map(([stage, deals]) => ({
          title: humanize(stage),
          total: deals.reduce((sum, d) => sum + (d.amount ?? 0), 0),
          data: deals,
        }))
    );
  }, [data]);

  if (isLoading) return <Loading />;
  if (error) return <Failed error={error} onRetry={refetch} />;
  if (!sections.length) {
    return <Empty title="No deals" detail="Deals created on the web will appear here." />;
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(d) => d.id}
      style={{ backgroundColor: t.canvas }}
      contentContainerStyle={{ paddingBottom: spacing["2xl"] }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.fg.subtle} />
      }
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Overline>
            {section.title} · {section.data.length}
          </Overline>
          <Txt variant="caption" tone="subtle" numeric>
            {moneyShort(section.total)}
          </Txt>
        </View>
      )}
      renderItem={({ item }) => (
        <DealRow deal={item} onPress={() => navigation.navigate("DealDetail", { id: item.id })} />
      )}
      ItemSeparatorComponent={() => <Divider inset={spacing.md} />}
    />
  );
}

function DealRow({ deal, onPress }: { deal: Deal; onPress: () => void }) {
  const company = deal.accountName?.trim();
  const closes = deal.expectedCloseDate ? `Closes ${shortDate(deal.expectedCloseDate)}` : null;
  const kit = deal.totalCameras ? `${deal.totalCameras} cameras` : null;
  const meta = [kit, closes].filter(Boolean).join(" · ");

  return (
    <Row onPress={onPress}>
      {/*
        Company first and smallest, then the amount at display size, then the
        deal title. The company is how someone finds the row they are scanning
        for; the amount is why they care. Putting the title first would bury
        both behind free text of arbitrary length.
      */}
      {company ? <Overline>{company}</Overline> : null}
      <Gap size="xs" />
      <Txt variant="display" numeric>
        {money(deal.amount)}
      </Txt>
      <Gap size="xs" />
      <Txt variant="body" tone="muted" numberOfLines={1}>
        {deal.title}
      </Txt>
      {meta ? (
        <>
          <Gap size="xs" />
          <Txt variant="caption" tone="subtle">
            {meta}
          </Txt>
        </>
      ) : null}
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
});
