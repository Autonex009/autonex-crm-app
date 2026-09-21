import type { ReactElement } from "react";
import { ActivityIndicator, FlatList, Platform, RefreshControl, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing, useTheme } from "../theme";
import { Txt } from "./primitives";
import { EmptyState, ErrorState, LoadingState } from "./Screen";

/**
 * The slice of a TanStack query result a list actually reads. Narrowed to this
 * so the same component takes a `useQuery` and a `useInfiniteQuery` result
 * without either one's generics leaking into every call site.
 */
export interface ListQueryState {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  isRefetching: boolean;
  refetch: () => unknown;
}

interface QueryListProps<T> {
  query: ListQueryState;
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactElement;
  emptyTitle: string;
  emptyDetail?: string;
  header?: ReactElement;
  footer?: ReactElement;

  /* --- pagination ------------------------------------------------------- */
  /** Loads the next page. Called once the user nears the end of the list. */
  onEndReached?: () => void;
  /** Whether another page exists; drives the footer spinner and end label. */
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  /** Server-reported total, for the "showing N of M" footer. */
  total?: number;
}

/**
 * List backed by a TanStack query, with the five states every list screen
 * needs: first load, error with retry, empty, pull-to-refresh, and paging.
 *
 * Centralised because otherwise each of the six list screens grows its own
 * slightly different version and they drift on spacing, refresh behaviour and
 * — the expensive one — when exactly the next page is asked for.
 */
export function QueryList<T>({
  query,
  data,
  keyExtractor,
  renderItem,
  emptyTitle,
  emptyDetail,
  header,
  footer,
  onEndReached,
  hasNextPage = false,
  isFetchingNextPage = false,
  total,
}: QueryListProps<T>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Only the very first load gets the blocking spinner. A refetch keeps the
  // current rows on screen and shows the pull-to-refresh indicator instead.
  if (query.isPending) {
    return (
      <View style={styles.stateContainer}>
        <LoadingState />
      </View>
    );
  }

  if (query.isError) {
    return (
      <View style={styles.stateContainer}>
        <ErrorState
          message={query.error instanceof Error ? query.error.message : "Request failed"}
          onRetry={() => void query.refetch()}
        />
      </View>
    );
  }

  const paging = !!onEndReached;
  const loadedAll = paging && !hasNextPage && data.length > 0;

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => renderItem(item)}
      ListHeaderComponent={header}
      ItemSeparatorComponent={Separator}
      ListEmptyComponent={<EmptyState title={emptyTitle} detail={emptyDetail} />}
      ListFooterComponent={
        <>
          {isFetchingNextPage ? (
            <View style={styles.footerSpinner}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : null}

          {/* The count only means something once there is nothing left to
              fetch — until then "25 of 312" reads as a truncated list rather
              than as a list still filling. */}
          {loadedAll && (total ?? 0) > 0 ? (
            <View style={styles.footerLabel}>
              <Txt variant="caption" color="subtle">
                {data.length} of {total} shown
              </Txt>
            </View>
          ) : null}

          {footer}
        </>
      }
      contentContainerStyle={[
        styles.content,
        // The tab bar floats over the list; without this the last row sits
        // under it and can never be fully read.
        { paddingBottom: spacing.xl + insets.bottom },
        data.length === 0 && styles.grow,
      ]}
      onEndReached={() => {
        // FlatList fires this while the list is still empty on mount; asking
        // for page two before page one has rendered is wasted bandwidth.
        if (hasNextPage && !isFetchingNextPage && data.length > 0) onEndReached?.();
      }}
      onEndReachedThreshold={0.5}
      // A search field above the list must lose focus when the user starts
      // scrolling results; on Android `on-drag` is the only mode that behaves.
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          // A next-page fetch must not spin the pull-to-refresh control: on
          // Android that yanks the list back to the top mid-scroll.
          refreshing={query.isRefetching && !isFetchingNextPage}
          onRefresh={() => void query.refetch()}
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressBackgroundColor={colors.surface}
        />
      }
      showsVerticalScrollIndicator={false}
      // No `removeClippedSubviews`: on Android it blanks variable-height rows
      // as they scroll back in, and `windowSize` already bounds what is mounted.
      initialNumToRender={10}
      windowSize={11}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: { padding: spacing.md },
  grow: { flexGrow: 1 },
  separator: { height: spacing.sm },
  footerSpinner: { paddingVertical: spacing.md, alignItems: "center" },
  footerLabel: { paddingVertical: spacing.md, alignItems: "center" },
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
