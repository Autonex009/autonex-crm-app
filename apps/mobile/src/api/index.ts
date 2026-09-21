/**
 * Barrel export for every API module in the mobile app.
 *
 * Usage:
 *   import { leadsApi, dealsApi, dashboardApi } from "../api";
 */
export { leadsApi } from "./leads";
export type { Lead, LeadPage, LeadInput, AdvanceInput, ConvertInput } from "./leads";

export { dealsApi } from "./deals";
export type { Deal, Board, DealInput, DealStage } from "./deals";

export { accountsApi } from "./accounts";
export type {
  Account,
  AccountPage,
  AccountInput,
  CompanyProfile,
  FullCompanyProfilePayload,
  HardwareSpecs,
  LinkedContact,
  LinkedDeal,
  LinkedInvoice,
  LinkedLead,
  LinkedQuote,
  PlantLocation,
} from "./accounts";

export { contactsApi, contactName } from "./contacts";
export type { Contact, ContactPage, ContactInput } from "./contacts";

export { quotesApi } from "./quotes";
export type { Quote, QuotePage, QuoteInput } from "./quotes";

export { invoicesApi } from "./invoices";
export type { Invoice, InvoicePage, InvoiceInput, PaymentInput } from "./invoices";

export { dealTasksApi, byTaskPriority, groupTasksByDeal, taskAuditLine, taskPriority, TASK_PRIORITIES, TASK_PRIORITY_META } from "./tasks";
export type { DealTask, TaskPriority } from "./tasks";

export {
  actionsApi,
  actionPriority,
  byActionPriority,
  canSeeActions,
  dueLabel,
  groupActionsByDeal,
  isOverdue,
  ACTION_PRIORITIES,
  ACTION_PRIORITY_META,
  ACTION_STATUSES,
  ACTION_STATUS_LABEL,
} from "./actions";
export type { Action, ActionFilter, ActionPriority, ActionStatus } from "./actions";

export { activitiesApi } from "./activities";
export type { Activity, ActivityScope, ActivityInput } from "./activities";

export { dashboardApi } from "./dashboard";
export type { Summary, Pipeline, Attention, Recent } from "./dashboard";

export { orgApi } from "./org";
export type { Workspace, Member, Invitation } from "./org";

export { notificationsApi } from "./notifications";
export type { NotificationItem, NotificationsResponse } from "./notifications";

export { integrationsApi } from "./integrations";
export type { Connection } from "./integrations";

export { deliveryApi } from "./delivery";
export type { TrackerRow, TrackerInput, TrackerPage } from "./delivery";
