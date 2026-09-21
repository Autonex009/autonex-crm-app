import { StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { invoicesApi } from "../api";
import { documentStatusTone, humanize } from "../domain/stages";
import { formatDateLong } from "../lib/dates";
import { formatMoneyExact } from "../lib/money";
import { spacing, useTheme } from "../theme";
import { Badge, Card, DetailRow, Divider, SectionHeader, Txt } from "../ui";
import { DetailScaffold } from "./DetailScaffold";
import { TotalsBlock } from "./TotalsBlock";
import type { AppRouteProps } from "../navigation/types";

export function InvoiceDetailScreen({ route }: AppRouteProps<"InvoiceDetail">) {
  const { id } = route.params;
  const { colors } = useTheme();

  const query = useQuery({ queryKey: ["invoice", id], queryFn: () => invoicesApi.get(id) });
  const invoice = query.data;

  return (
    <DetailScaffold query={query} scope={{ invoiceId: id }}>
      {invoice && (
        <>
          <Card>
            <View style={{ gap: 8 }}>
              <Txt variant="caption" color="subtle" uppercase>
                {invoice.number}
              </Txt>
              <Txt variant="title">{invoice.title || "Untitled invoice"}</Txt>
              <Txt variant="display">
                {formatMoneyExact(invoice.balance, invoice.currency)}
              </Txt>
              <Badge
                tone={invoice.overdue ? "danger" : documentStatusTone(invoice.status)}
                dot
              >
                {invoice.overdue ? "Overdue" : humanize(invoice.status)}
              </Badge>
            </View>
          </Card>

          <View>
            <SectionHeader title="Details" />
            <Card>
              <DetailRow label="Company" value={invoice.accountName || "—"} />
              <DetailRow label="Contact" value={invoice.contactName || "—"} />
              <DetailRow label="Quote" value={invoice.quoteNumber || "—"} />
              <DetailRow label="Issued" value={formatDateLong(invoice.issueDate)} />
              <DetailRow label="Due" value={formatDateLong(invoice.dueDate)} />
              <DetailRow label="Owner" value={invoice.ownerName || "Unassigned"} />
            </Card>
          </View>

          {(invoice.items?.length ?? 0) > 0 && (
            <View>
              <SectionHeader title={`Line items (${invoice.items?.length})`} />
              <Card padded={false}>
                {invoice.items?.map((item, index) => (
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
                        {item.quantity} × {formatMoneyExact(item.unitPrice, invoice.currency)}
                      </Txt>
                    </View>
                    <Txt variant="label">
                      {formatMoneyExact(item.lineTotal, invoice.currency)}
                    </Txt>
                  </View>
                ))}

                <Divider />
                <TotalsBlock
                  currency={invoice.currency}
                  subtotal={invoice.subtotal}
                  discountTotal={invoice.discountTotal}
                  taxTotal={invoice.taxTotal}
                  total={invoice.total}
                  amountPaid={invoice.amountPaid}
                  balance={invoice.balance}
                />
              </Card>
            </View>
          )}

          {(invoice.payments?.length ?? 0) > 0 && (
            <View>
              <SectionHeader title="Payments" />
              <Card padded={false}>
                {invoice.payments?.map((payment, index) => (
                  <View
                    key={payment.id}
                    style={[
                      styles.item,
                      index > 0 && {
                        borderTopColor: colors.line,
                        borderTopWidth: StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <View style={styles.itemBody}>
                      <Txt variant="body">{formatDateLong(payment.paidOn)}</Txt>
                      <Txt variant="caption" color="subtle">
                        {payment.method || "Payment"}
                        {payment.reference ? ` · ${payment.reference}` : ""}
                      </Txt>
                    </View>
                    <Txt variant="label" color="success">
                      {formatMoneyExact(payment.amount, invoice.currency)}
                    </Txt>
                  </View>
                ))}
              </Card>
            </View>
          )}
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
