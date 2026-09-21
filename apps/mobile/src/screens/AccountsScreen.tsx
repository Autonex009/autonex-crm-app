import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { accountsApi, type Account } from "../api";
import { PAGE_SIZE } from "../api/accounts";
import { usePagedList } from "../lib/paged";
import { spacing } from "../theme";
import { Avatar, Field, ListRow, QueryList, Screen, Txt } from "../ui";
import { ScreenHeader } from "./ScreenHeader";
import { useDebounced } from "../lib/useDebounced";
import type { AppNavigation } from "../navigation/types";

/** "Companies" in the UI, `accounts` on the wire — same as the web's nav. */
export function AccountsScreen({ navigation }: { navigation: AppNavigation }) {
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search, 300);

  const page = usePagedList<Account>({
    queryKey: ["accounts", debounced],
    pageSize: PAGE_SIZE,
    fetchPage: (offset, limit) => accountsApi.list(offset, limit, debounced),
  });

  return (
    <Screen>
      <ScreenHeader title="Companies" subtitle={`${page.total} in workspace`} />

      <View style={styles.search}>
        <Field
          label="Search"
          icon="search"
          value={search}
          onChangeText={setSearch}
          placeholder="Company name"
          returnKeyType="search"
        />
      </View>

      <QueryList<Account>
        query={page.query}
        data={page.items}
        total={page.total}
        header={
          <View style={styles.header}>
            <Txt variant="caption" color="subtle" uppercase>
              {page.total} {page.total === 1 ? "company" : "companies"}
              {page.total > 0 && page.items.length < page.total
                ? ` · showing ${page.items.length}`
                : ""}
            </Txt>
          </View>
        }
        hasNextPage={page.hasNextPage}
        isFetchingNextPage={page.isFetchingNextPage}
        onEndReached={page.fetchNextPage}
        keyExtractor={(account) => account.id}
        emptyTitle="No companies"
        emptyDetail={debounced ? "Nothing matches that search." : undefined}
        renderItem={(account) => (
          <ListRow
            title={account.name || "Unnamed Company"}
            subtitle={account.industry || "No industry listed"}
            leading={<Avatar name={account.name} />}
            onPress={() =>
              navigation.navigate("AccountDetail", {
                id: account.id,
                name: account.name || "Company",
              })
            }
            meta={
              <Txt variant="caption" color="subtle">
                {account.dealCount ?? 0} deals · {account.leadCount ?? 0} leads ·{" "}
                {account.contactCount ?? 0} contacts
              </Txt>
            }
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  header: { paddingBottom: spacing.sm },
});
