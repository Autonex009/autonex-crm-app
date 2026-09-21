import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { leadsApi, type Lead } from "../api";
import { PAGE_SIZE } from "../api/leads";
import { leadStageMeta } from "../domain/stages";
import { usePagedList } from "../lib/paged";
import { useDebounced } from "../lib/useDebounced";
import { formatMoneyCompact } from "../lib/money";
import { useCurrency } from "../org/workspace";
import { spacing } from "../theme";
import { Badge, Field, ListRow, QueryList, Screen, Txt } from "../ui";
import { FilterChips } from "./FilterChips";
import { ScreenHeader } from "./ScreenHeader";
import type { AppNavigation } from "../navigation/types";

/** The same four saved views the web's Leads screen offers. */
const FILTERS = [
  { key: "", label: "All" },
  { key: "open", label: "Open" },
  { key: "overdue", label: "Overdue" },
  { key: "converted", label: "Converted" },
];

export function LeadsScreen({ navigation }: { navigation: AppNavigation }) {
  const currency = useCurrency();
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search, 300);

  const page = usePagedList<Lead>({
    queryKey: ["leads", filter, debounced],
    pageSize: PAGE_SIZE,
    fetchPage: (offset, limit) =>
      leadsApi.list(offset, filter, limit, { search: debounced }),
  });

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <Txt variant="caption" color="subtle" uppercase>
          {page.total} {page.total === 1 ? "lead" : "leads"}
        </Txt>
      </View>
    ),
    [page.total],
  );

  return (
    <Screen>
      <ScreenHeader title="Leads" subtitle="Top of the pipeline" />

      <View style={styles.search}>
        <Field
          label="Search"
          icon="search"
          value={search}
          onChangeText={setSearch}
          placeholder="Name, company or email"
          returnKeyType="search"
        />
      </View>

      <FilterChips options={FILTERS} value={filter} onChange={setFilter} />

      <QueryList<Lead>
        query={page.query}
        data={page.items}
        header={header}
        total={page.total}
        hasNextPage={page.hasNextPage}
        isFetchingNextPage={page.isFetchingNextPage}
        onEndReached={page.fetchNextPage}
        keyExtractor={(lead) => lead.id}
        emptyTitle="No leads"
        emptyDetail={
          debounced ? "Nothing matches that search." : "Leads created on the web app show up here."
        }
        renderItem={(lead) => {
          const meta = leadStageMeta(lead.stage);
          const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ");

          return (
            <ListRow
              title={name || "Unnamed lead"}
              subtitle={lead.accountName || lead.company}
              onPress={() => navigation.navigate("LeadDetail", { id: lead.id, name })}
              meta={
                <>
                  <Badge tone={meta.tone} dot>
                    {meta.label}
                  </Badge>
                  {lead.overdue && <Badge tone="danger">Overdue</Badge>}
                  {!lead.overdue && lead.dueToday && <Badge tone="warning">Due today</Badge>}
                </>
              }
              trailing={
                lead.value ? (
                  <Txt variant="label" color="muted">
                    {formatMoneyCompact(lead.value, currency)}
                  </Txt>
                ) : null
              }
            />
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  header: { paddingBottom: spacing.sm },
});
