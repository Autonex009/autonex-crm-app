import { useNavigation } from "@react-navigation/native";
import { useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, TextInput, View } from "react-native";

import { type Account, useAccounts } from "../lib/queries";
import { HAIRLINE, spacing, useTheme } from "../theme";
import { Divider, Empty, Failed, Gap, Loading, Overline, Row, Txt } from "../ui";

/**
 * Companies, with a search field.
 *
 * Filtered on the client rather than through the API: the list is capped at 100
 * and already in memory, so a local filter is instant, works offline on cached
 * data, and costs no request per keystroke. Past a few hundred accounts this
 * should move to a server-side `?q=`.
 */
export function CompaniesScreen() {
  const navigation = useNavigation<any>();
  const t = useTheme();
  const [query, setQuery] = useState("");
  const { data, isLoading, isRefetching, refetch, error } = useAccounts();

  const items = useMemo(() => {
    const all = data?.items ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.industry ?? "").toLowerCase().includes(q),
    );
  }, [data, query]);

  if (isLoading) return <Loading />;
  if (error) return <Failed error={error} onRetry={refetch} />;

  return (
    <View style={{ flex: 1, backgroundColor: t.canvas }}>
      <View style={[styles.searchWrap, { borderBottomColor: t.line }]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search companies"
          placeholderTextColor={t.fg.subtle}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          style={[
            styles.search,
            { backgroundColor: t.surface, color: t.fg.default, borderColor: t.line },
          ]}
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ paddingBottom: spacing["2xl"] }}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.fg.subtle} />
        }
        ListEmptyComponent={
          <Empty
            title={query ? "No matches" : "No companies"}
            detail={query ? `Nothing matching "${query}".` : undefined}
          />
        }
        renderItem={({ item }) => (
          <CompanyRow
            account={item}
            onPress={() => navigation.navigate("CompanyDetail", { id: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <Divider inset={spacing.md} />}
      />
    </View>
  );
}

function CompanyRow({ account, onPress }: { account: Account; onPress: () => void }) {
  // Counts, not a description: they are what tells you whether this company is
  // active, and they are the only numbers the list endpoint gives us.
  const counts = [
    account.dealCount ? `${account.dealCount} deals` : null,
    account.leadCount ? `${account.leadCount} leads` : null,
    account.contactCount ? `${account.contactCount} contacts` : null,
  ].filter(Boolean);

  return (
    <Row onPress={onPress}>
      {account.industry ? <Overline>{account.industry}</Overline> : null}
      <Gap size="xs" />
      <Txt variant="title" numberOfLines={1}>
        {account.name}
      </Txt>
      <Gap size="xs" />
      <Txt variant="caption" tone="subtle">
        {counts.length ? counts.join(" · ") : "Nothing linked yet"}
      </Txt>
    </Row>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: HAIRLINE,
  },
  search: {
    height: 40,
    borderRadius: 10,
    borderWidth: HAIRLINE,
    paddingHorizontal: spacing.sm + 4,
    fontSize: 15,
  },
});
