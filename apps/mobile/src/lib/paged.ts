import { useMemo } from "react";
import {
  keepPreviousData,
  useInfiniteQuery,
  type QueryKey,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query";

/**
 * The envelope every paginated gateway endpoint returns. Leads adds `counts`
 * and `stages` on top; only these four fields matter for paging.
 *
 * `items` is nullable because the gateway marshals a Go slice that was never
 * appended to, and a nil slice encodes as JSON `null` rather than `[]`. Every
 * read of it goes through `rows()` below.
 */
export interface Page<T> {
  items: T[] | null;
  total: number;
  limit: number;
  offset: number;
}

/**
 * A page's rows, as an array.
 *
 * The gateway leaves `items` off a response entirely when a page is empty
 * rather than sending `[]`, so every read of it goes through here. JSON `null`
 * arrives the same way, and both have to behave as "no rows" rather than
 * throwing on `.length`.
 */
function rows<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export interface PagedList<T> {
  /** Every row loaded so far, in order. */
  items: T[];
  /** Server-reported total, not the number loaded. */
  total: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** Safe to call on every onEndReached; it no-ops when there is nothing left. */
  fetchNextPage: () => void;
  query: UseInfiniteQueryResult<unknown>;
}

/**
 * Offset pagination over a `Page<T>` endpoint, wired for a FlatList.
 *
 * The gateway pages by `limit`/`offset` and reports `total`, so the next cursor
 * is simply how many rows we already hold — and "there is more" is that count
 * being short of the total. Deriving both from the server's own numbers rather
 * than from "the last page came back full" means a page boundary that lands
 * exactly on `total` does not cost one extra empty request.
 */
export function usePagedList<T>({
  queryKey,
  fetchPage,
  pageSize,
  enabled = true,
}: {
  queryKey: QueryKey;
  fetchPage: (offset: number, limit: number) => Promise<Page<T>>;
  pageSize: number;
  enabled?: boolean;
}): PagedList<T> {
  const query = useInfiniteQuery({
    queryKey,
    enabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchPage(pageParam as number, pageSize),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || !Array.isArray(allPages)) return undefined;
      const loaded = allPages.reduce((n, page) => n + rows(page?.items).length, 0);
      if (rows(lastPage.items).length === 0 || loaded >= (lastPage.total ?? 0)) return undefined;
      return loaded;
    },
    // Keeps the current rows on screen while a changed filter or search term
    // resolves, so the list doesn't blank out on every keystroke.
    placeholderData: keepPreviousData,
  });

  const pages = useMemo(
    () => (Array.isArray(query.data?.pages) ? query.data.pages : []),
    [query.data],
  );

  const items = useMemo(
    () => pages.flatMap((page) => rows(page?.items)),
    [pages],
  );

  return {
    items,
    total: pages[0]?.total ?? 0,
    hasNextPage: !!query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
    query,
  };
}

/**
 * Client-side paging for an endpoint that has none.
 *
 * The deals board is one request for the whole pipeline — there is no offset to
 * ask for. Rendering 400 cards at once is what actually costs on a phone, so
 * the list grows a window at a time exactly as a server-paged one does.
 */
export function windowed<T>(
  all: readonly T[],
  visible: number,
): { items: T[]; hasNextPage: boolean } {
  return {
    items: all.length <= visible ? [...all] : all.slice(0, visible),
    hasNextPage: all.length > visible,
  };
}

/**
 * Offset pagination over an endpoint that reports no total.
 *
 * Notifications is the one such envelope: it carries the unread count but not
 * how many rows exist, so "there is more" can only be inferred from the last
 * page arriving full. That costs one empty request when the feed length is an
 * exact multiple of the page size, which is the price of not having a total.
 */
export function useUncountedList<T, R>({
  queryKey,
  fetchPage,
  select,
  pageSize,
  enabled = true,
  refetchInterval,
}: {
  queryKey: QueryKey;
  fetchPage: (offset: number, limit: number) => Promise<R>;
  /** Pulls the rows out of the response envelope. */
  select: (response: R) => T[];
  pageSize: number;
  enabled?: boolean;
  refetchInterval?: number;
}): Omit<PagedList<T>, "total"> & { pages: R[] } {
  const query = useInfiniteQuery({
    queryKey,
    enabled,
    refetchInterval,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchPage(pageParam as number, pageSize),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || !Array.isArray(allPages)) return undefined;
      const count = rows(select(lastPage)).length;
      if (count < pageSize) return undefined;
      return allPages.reduce((n, page) => n + rows(select(page)).length, 0);
    },
    placeholderData: keepPreviousData,
  });

  const pages = useMemo(
    () => (Array.isArray(query.data?.pages) ? query.data.pages : []),
    [query.data],
  );
  const items = useMemo(
    () => pages.flatMap((page) => rows(select(page))),
    [pages, select],
  );

  return {
    items,
    pages,
    hasNextPage: !!query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
    query,
  };
}
