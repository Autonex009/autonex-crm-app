import { StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { quotesApi } from "../api";
import { documentStatusTone, humanize } from "../domain/stages";
import { formatDateLong } from "../lib/dates";
import { formatMoneyExact } from "../lib/money";
import { spacing, useTheme } from "../theme";
import { Badge, Card, DetailRow, Divider, SectionHeader, Txt } from "../ui";
import { DetailScaffold } from "./DetailScaffold";
import { TotalsBlock } from "./TotalsBlock";
import type { AppRouteProps } from "../navigation/types";

export function QuoteDetailScreen({ route }: AppRouteProps<"QuoteDetail">) {
  const { id } = route.params;
  const { colors } = useTheme();

  const query = useQuery({ queryKey: ["quote", id], queryFn: () => quotesApi.get(id) });
  const quote = query.data;

  return (
    <DetailScaffold query={query} scope={{ quoteId: id }}>
      {quote && (
        <>
          <Card>
            <View style={{ gap: 8 }}>
              <Txt variant="caption" color="subtle" uppercase>
                {quote.number}
              </Txt>
              <Txt variant="title">{quote.title || "Untitled quote"}</Txt>
              <Badge tone={documentStatusTone(quote.status)} dot>
                {humanize(quote.status)}
              </Badge>
            </View>
          </Card>

          <View>
            <SectionHeader title="Details" />
            <Card>
              <DetailRow label="Company" value={quote.accountName || "—"} />
              <DetailRow label="Contact" value={quote.contactName || "—"} />
              <DetailRow label="Deal" value={quote.dealTitle || "—"} />
              <DetailRow label="Owner" value={quote.ownerName || "Unassigned"} />
              <DetailRow label="Valid until" value={formatDateLong(quote.validUntil)} />
              <DetailRow label="Sent" value={formatDateLong(quote.sentAt)} />
            </Card>
          </View>

          {(quote.items?.length ?? 0) > 0 && (
            <View>
              <SectionHeader title={`Line items (${quote.items?.length})`} />
              <Card padded={false}>
                {quote.items?.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.item,
                      index > 0 && {
                        borderTopColor: colors.line,
                        borderTopWidth: StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <View style={styles.itemBody}>
                      <Txt variant="body" numberOfLines={3}>
                        {item.description}
                      </Txt>
                      <Txt variant="caption" color="subtle">
                        {item.quantity} × {formatMoneyExact(item.unitPrice, quote.currency)}
                        {item.discountPercent ? ` · −${item.discountPercent}%` : ""}
                        {item.taxPercent ? ` · tax ${item.taxPercent}%` : ""}
                      </Txt>
                    </View>
                    <Txt variant="label">
                      {formatMoneyExact(item.lineTotal, quote.currency)}
                    </Txt>
                  </View>
                ))}

                <Divider />
                <TotalsBlock
                  currency={quote.currency}
                  subtotal={quote.subtotal}
                  discountTotal={quote.discountTotal}
                  taxTotal={quote.taxTotal}
                  total={quote.total}
                />
              </Card>
            </View>
          )}

          {quote.notes ? (
            <View>
              <SectionHeader title="Notes" />
              <Card>
                <Txt variant="body" color="muted">
                  {quote.notes}
                </Txt>
              </Card>
            </View>
          ) : null}
        </>
      )}
    </DetailScaffold>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm + 4,
    alignItems: "flex-start",
  },
  itemBody: { flex: 1, gap: 3 },
});
