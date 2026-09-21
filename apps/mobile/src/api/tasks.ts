import { apiFetch } from "../lib/api";
import type { Tone } from "../theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Ordered most urgent first; that order is what sorts a card's task list. */
export const TASK_PRIORITIES = ["high", "medium", "normal"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/**
 * How each priority reads and paints. The web keeps the same three levels in
 * `apps/web/src/app/deals/tasks.ts` with Tailwind classes; here the colour
 * resolves through the shared tone palette so a "high" task is the same red on
 * both surfaces.
 */
export const TASK_PRIORITY_META: Record<
  TaskPriority,
  { label: string; tone: Tone }
> = {
  high: { label: "High", tone: "danger" },
  medium: { label: "Medium", tone: "warning" },
  normal: { label: "Normal", tone: "info" },
};

/** Mirrors dealtasks.Task (services/internal/dealtasks/store.go). */
export interface DealTask {
  id: string;
  dealId: string;
  text: string;
  priority: TaskPriority;
  position: number;
  /** The three people, denormalized by the server so a card needs no lookup. */
  assignedTo: string | null;
  assignedToName: string | null;
  createdBy: string | null;
  createdByName: string | null;
  completedBy: string | null;
  completedByName: string | null;
  done: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const BASE = "/api/v1/deal-tasks";

export const dealTasksApi = {
  /** Omit dealId for every deal's tasks — how the board loads the whole set. */
  list: (dealId?: string) =>
    apiFetch<DealTask[]>(dealId ? `${BASE}?dealId=${encodeURIComponent(dealId)}` : BASE),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A priority this client knows. A pre-migration row sends none at all. */
export function taskPriority(task: Pick<DealTask, "priority">): TaskPriority {
  const p = task.priority as TaskPriority | undefined;
  return p && TASK_PRIORITIES.includes(p) ? p : "normal";
}

/**
 * Most urgent first, with each priority band keeping its stored order — a
 * stable sort, so the list never reshuffles between refetches.
 */
export function byTaskPriority(tasks: readonly DealTask[]): DealTask[] {
  return [...tasks].sort(
    (a, b) =>
      TASK_PRIORITIES.indexOf(taskPriority(a)) - TASK_PRIORITIES.indexOf(taskPriority(b)),
  );
}

/** "Done by Nikhil" / "Added by Karan" — the audit line under a task. */
export function taskAuditLine(task: DealTask): string | null {
  if (task.done && task.completedByName) return `Done by ${task.completedByName}`;
  if (task.createdByName) return `Added by ${task.createdByName}`;
  return null;
}

/** Groups a flat task list by deal, so a list screen fetches once. */
export function groupTasksByDeal(tasks: readonly DealTask[]): Record<string, DealTask[]> {
  return tasks.reduce<Record<string, DealTask[]>>((acc, task) => {
    (acc[task.dealId] ??= []).push(task);
    return acc;
  }, {});
}
