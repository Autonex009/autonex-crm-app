import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { create } from "zustand";

import { orgApi } from "../api";

interface WorkspaceState {
  name: string;
  /** ISO 4217 code. "USD" until the real value loads. */
  currency: string;
  set: (workspace: { name: string; currency: string }) => void;
}

/**
 * Workspace settings, mirroring apps/web/src/app/org/workspace.ts.
 *
 * Every card that shows an amount needs the currency. A zustand selector
 * returning a primitive is a far cheaper subscription than a TanStack query per
 * card, and a list only re-renders when the code itself changes.
 */
export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  name: "",
  currency: "USD",
  set: ({ name, currency }) => set({ name, currency }),
}));

/** Cheap primitive selector for the ~every screen that formats money. */
export function useCurrency(): string {
  return useWorkspaceStore((s) => s.currency);
}

/** Fetches the workspace once and hydrates the store. Mounted by the tabs. */
export function useWorkspaceSync(): void {
  const set = useWorkspaceStore((s) => s.set);

  const { data } = useQuery({
    queryKey: ["workspace"],
    queryFn: orgApi.workspace,
    staleTime: 10 * 60_000,
  });

  useEffect(() => {
    if (data) set({ name: data.name, currency: data.currency });
  }, [data, set]);
}
