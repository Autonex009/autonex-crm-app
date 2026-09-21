import { StyleSheet, View } from "react-native";

import { formatMoneyExact } from "../lib/money";
import { spacing } from "../theme";
import { Txt } from "../ui";

/**
 * Document totals. Always two decimals — a line reading "$35" beside one
 * reading "$34.65" makes a correct total look wrong, which is the reason the
 * web app formats documents through formatMoneyExact too.
 */
export function TotalsBlock({
  currency,
  subtotal,
  discountTotal,
  taxTotal,
  total,
  amountPaid,
  balance,
}: {
  currency: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  amountPaid?: number;
  balance?: number;
}) {
  return (
    <View style={styles.wrap}>
      <Line label="Subtotal" value={formatMoneyExact(subtotal, currency)} />
      {discountTotal > 0 && (
        <Line label="Discount" value={`−${formatMoneyExact(discountTotal, currency)}`} />
      )}
      {taxTotal > 0 && <Line label="Tax" value={formatMoneyExact(taxTotal, currency)} />}
      <Line label="Total" value={formatMoneyExact(total, currency)} strong />
      {amountPaid !== undefined && amountPaid > 0 && (
        <Line label="Paid" value={formatMoneyExact(amountPaid, currency)} />
      )}
      {balance !== undefined && (
        <Line label="Balance due" value={formatMoneyExact(balance, currency)} strong />
      )}
    </View>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.line}>
      <Txt variant={strong ? "heading" : "label"} color={strong ? "fg" : "muted"}>
        {label}
      </Txt>
      <Txt variant={strong ? "heading" : "label"}>{value}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.sm + 4, gap: 6 },
  line: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
