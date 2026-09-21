import { apiFetch } from "../lib/api";
import type { Tone } from "../theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Mirrors followups.Statuses (services/internal/followups/service.go). */
export const ACTION_STATUSES = ["open", "in_progress", "done"] as const;
export type ActionStatus = (typeof ACTION_STATUSES)[number];

export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  done: "Done",
};

/**
 * The same three levels as a deal task, deliberately: the two lists sit beside
 * each other in a deal's working view and one vocabulary across both is the
 * point.
 */
export const ACTION_PRIORITIES = ["high", "medium", "normal"] as const;
export type ActionPriority = (typeof ACTION_PRIORITIES)[number];

export const ACTION_PRIORITY_META: Record<
  ActionPriority,
  { label: string; tone: Tone }
> = {
  high: { label: "High", tone: "danger" },
  medium: { label: "Medium", tone: "warning" },
  normal: { label: "Normal", tone: "info" },
};

/** Mirrors followups.Action — one row on the Actions dashboard. */
export interface Action {
  id: string;
  title: string;
  dueAt: string;
  status: ActionStatus;
  priority: ActionPriority;
  assignedTo: string | null;
  accountId: string | null;
  leadId: string | null;
  dealId: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActionFilter {
  accountId?: string;
  leadId?: string;
  dealId?: string;
  assignedTo?: string;
  status?: ActionStatus;
  /** Drops completed actions, independent of `status`. */
  excludeDone?: boolean;
  /** ISO 8601. Both ends are inclusive on the server. */
  dueBefore?: string;
  dueAfter?: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const BASE = "/api/v1/actions";

/**
 * Who the gateway lets near /api/v1/actions. Mirrors `managerRoles` in
 * services/internal/followups/handler.go — a rep gets a 403, so the app checks
 * the role before asking rather than showing an error card for a section they
 * were never meant to see.
 */
const MANAGER_ROLES = ["owner", "admin", "account_manager"] as const;

export function canSeeActions(role?: string | null): boolean {
  return !!role && (MANAGER_ROLES as readonly string[]).includes(role);
}

function query(filter: ActionFilter): string {
  const params = new URLSearchParams();
  if (filter.accountId) params.set("accountId", filter.accountId);
  if (filter.leadId) params.set("leadId", filter.leadId);
  if (filter.dealId) params.set("dealId", filter.dealId);
  if (filter.assignedTo) params.set("assignedTo", filter.assignedTo);
  if (filter.status) params.set("status", filter.status);
  if (filter.excludeDone) params.set("excludeDone", "true");
  if (filter.dueBefore) params.set("dueBefore", filter.dueBefore);
  if (filter.dueAfter) params.set("dueAfter", filter.dueAfter);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const actionsApi = {
  list: (filter: ActionFilter = {}) => apiFetch<Action[]>(`${BASE}${query(filter)}`),

  get: (id: string) => apiFetch<Action>(`${BASE}/${id}`),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * An action's priority, as a level this client knows. A server that predates
 * the column sends none, and an undefined lookup is what crashed the web's
 * working view the first time it met a pre-migration API.
 */
export function actionPriority(action: Pick<Action, "priority">): ActionPriority {
  const p = action.priority as ActionPriority | undefined;
  return p && ACTION_PRIORITIES.includes(p) ? p : "normal";
}

/** Whole days from today to `iso`, negative once it is past. UTC-anchored. */
function daysUntil(iso: string | null): number {
  if (!iso) return 0;
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return 0;
  const now = new Date();
  const a = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const b = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((a - b) / 86_400_000);
}

/** Highest first, then by when it is due — what matters before what is next. */
export function byActionPriority(actions: readonly Action[]): Action[] {
  const rank = (a: Action) => ACTION_PRIORITIES.indexOf(actionPriority(a));
  return [...actions].sort(
    (a, b) => rank(a) - rank(b) || (a.dueAt ?? "").localeCompare(b.dueAt ?? ""),
  );
}

/** "3 days overdue" / "Due tomorrow" — same wording as the web's Actions table. */
export function dueLabel(action: Pick<Action, "dueAt" | "status">): {
  text: string;
  tone: Tone;
} {
  const days = daysUntil(action.dueAt);
  const finished = action.status === "done";

  if (days < 0) {
    const n = Math.abs(days);
    return {
      text: `${n} day${n === 1 ? "" : "s"} overdue`,
      tone: finished ? "neutral" : "danger",
    };
  }
  if (days === 0) return { text: "Due today", tone: finished ? "neutral" : "warning" };
  if (days === 1) return { text: "Due tomorrow", tone: "neutral" };
  return {
    text: `Due ${new Date(action.dueAt).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    })}`,
    tone: "neutral",
  };
}

/** Past its due day and not finished — the condition that reddens a row. */
export function isOverdue(action: Pick<Action, "dueAt" | "status">): boolean {
  return action.status !== "done" && daysUntil(action.dueAt) < 0;
}

/** Due on today's calendar day and not finished. */
export function isDueToday(action: Pick<Action, "dueAt" | "status">): boolean {
  return action.status !== "done" && daysUntil(action.dueAt) === 0;
}

/** Due within the next seven days, today included, and not finished. */
export function isDueThisWeek(action: Pick<Action, "dueAt" | "status">): boolean {
  const days = daysUntil(action.dueAt);
  return action.status !== "done" && days >= 0 && days <= 7;
}

/**
 * The saved views behind the Actions screen's chips.
 *
 * Mirrors `viewBounds` in apps/web/src/app/actions/ActionViews.tsx, but as a
 * predicate over an already-loaded list rather than a server filter patch: the
 * phone loads the org's actions once and slices them, so switching views is
 * instant and the counts on the chips cannot disagree with the lists they open.
 */
export type ActionView = "all" | "overdue" | "today" | "week" | "active" | "done";

export function matchesView(action: Action, view: ActionView): boolean {
  switch (view) {
    case "overdue":
      return isOverdue(action);
    case "today":
      return isDueToday(action);
    case "week":
      return isDueThisWeek(action);
    case "active":
      return action.status !== "done";
    case "done":
      return action.status === "done";
    default:
      return true;
  }
}

/** Each count is the size of the list its chip opens. */
export function actionMetrics(all: readonly Action[]) {
  return {
    total: all.length,
    overdue: all.filter(isOverdue).length,
    today: all.filter(isDueToday).length,
    week: all.filter(isDueThisWeek).length,
    active: all.filter((a) => a.status !== "done").length,
    done: all.filter((a) => a.status === "done").length,
  };
}

/** Groups a flat action list by deal, so a list screen fetches once. */
export function groupActionsByDeal(actions: readonly Action[]): Record<string, Action[]> {
  return actions.reduce<Record<string, Action[]>>((acc, action) => {
    if (action.dealId) (acc[action.dealId] ??= []).push(action);
    return acc;
  }, {});
}
