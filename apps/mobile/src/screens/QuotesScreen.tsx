import { useState } from "react";

import { quotesApi, type Quote } from "../api";
import { PAGE_SIZE, QUOTE_STATUSES } from "../api/quotes";
import { documentStatusTone, humanize } from "../domain/stages";
import { formatDate } from "../lib/dates";
import { formatMoney } from "../lib/money";
import { usePagedList } from "../lib/paged";
import { Badge, ListRow, QueryList, Screen, Txt } from "../ui";
import { FilterChips } from "./FilterChips";
import { ScreenHeader } from "./ScreenHeader";
import type { AppNavigation } from "../navigation/types";

const STATUS_FILTERS = [
  { key: "", label: "All" },
  ...QUOTE_STATUSES.map((status) => ({ key: status, label: humanize(status) })),
];

export function QuotesScreen({ navigation }: { navigation: AppNavigation }) {
  const [status, setStatus] = useState("");

  const page = usePagedList<Quote>({
    queryKey: ["quotes", status],
    pageSize: PAGE_SIZE,
    fetchPage: (offset, limit) => quotesApi.list(offset, status, limit),
  });

  return (
    <Screen>
      <ScreenHeader title="Quotes" subtitle={`${page.total} documents`} />

      <FilterChips options={STATUS_FILTERS} value={status} onChange={setStatus} />

      <QueryList<Quote>
        query={page.query}
        data={page.items}
        total={page.total}
        hasNextPage={page.hasNextPage}
        isFetchingNextPage={page.isFetchingNextPage}
        onEndReached={page.fetchNextPage}
        keyExtractor={(quote) => quote.id}
        emptyTitle="No quotes"
        emptyDetail={status ? "Nothing with that status." : undefined}
        renderItem={(quote) => (
          <ListRow
            title={quote.title || quote.number}
            subtitle={quote.accountName || quote.contactName}
            onPress={() =>
              navigation.navigate("QuoteDetail", { id: quote.id, name: quote.number })
            }
            meta={
              <>
                <Badge tone={documentStatusTone(quote.status)} dot>
                  {humanize(quote.status)}
                </Badge>
                <Txt variant="caption" color="subtle">
                  {quote.number}
                  {quote.validUntil ? ` · valid to ${formatDate(quote.validUntil)}` : ""}
                </Txt>
              </>
            }
            trailing={<Txt variant="label">{formatMoney(quote.total, quote.currency)}</Txt>}
          />
        )}
      />
    </Screen>
  );
}
