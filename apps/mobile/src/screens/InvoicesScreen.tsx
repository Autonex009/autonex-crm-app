import { useState } from "react";

import { invoicesApi, type Invoice } from "../api";
import { INVOICE_STATUSES, PAGE_SIZE } from "../api/invoices";
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
  ...INVOICE_STATUSES.map((status) => ({ key: status, label: humanize(status) })),
];

export function InvoicesScreen({ navigation }: { navigation: AppNavigation }) {
  const [status, setStatus] = useState("");

  const page = usePagedList<Invoice>({
    queryKey: ["invoices", status],
    pageSize: PAGE_SIZE,
    fetchPage: (offset, limit) => invoicesApi.list(offset, status, limit),
  });

  return (
    <Screen>
      <ScreenHeader title="Invoices" subtitle={`${page.total} documents`} />

      <FilterChips options={STATUS_FILTERS} value={status} onChange={setStatus} />

      <QueryList<Invoice>
        query={page.query}
        data={page.items}
        total={page.total}
        hasNextPage={page.hasNextPage}
        isFetchingNextPage={page.isFetchingNextPage}
        onEndReached={page.fetchNextPage}
        keyExtractor={(invoice) => invoice.id}
        emptyTitle="No invoices"
        emptyDetail={status ? "Nothing with that status." : undefined}
        renderItem={(invoice) => (
          <ListRow
            title={invoice.title || invoice.number}
            subtitle={invoice.accountName || invoice.contactName}
            onPress={() =>
              navigation.navigate("InvoiceDetail", { id: invoice.id, name: invoice.number })
            }
            meta={
              <>
                {/* An overdue invoice is flagged regardless of status: "sent"
                    in blue would otherwise bury the thing that needs chasing. */}
                <Badge
                  tone={invoice.overdue ? "danger" : documentStatusTone(invoice.status)}
                  dot
                >
                  {invoice.overdue ? "Overdue" : humanize(invoice.status)}
                </Badge>
                <Txt variant="caption" color="subtle">
                  {invoice.number}
                  {invoice.dueDate ? ` · due ${formatDate(invoice.dueDate)}` : ""}
                </Txt>
              </>
            }
            trailing={
              <Txt variant="label">
                {formatMoney(invoice.balance || invoice.total, invoice.currency)}
              </Txt>
            }
          />
        )}
      />
    </Screen>
  );
}
