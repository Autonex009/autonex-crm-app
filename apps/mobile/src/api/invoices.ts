import { apiFetch } from "../lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const INVOICE_STATUSES = ["draft", "sent", "paid", "void"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface InvoiceItem {
  id: string;
  position: number;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  lineTotal: number;
}

export interface Payment {
  id: string;
  amount: number;
  paidOn: string;
  method: string | null;
  reference: string | null;
  note: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  title: string | null;
  status: InvoiceStatus;
  currency: string;
  quoteId: string | null;
  quoteNumber: string | null;
  accountId: string | null;
  accountName: string | null;
  contactId: string | null;
  contactName: string | null;
  dealId: string | null;
  dealTitle: string | null;
  ownerUserId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  notes: string | null;
  issueDate: string | null;
  dueDate: string | null;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  balance: number;
  overdue: boolean;
  sentAt: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItem[];
  payments?: Payment[];
  itemCount: number;
}

export interface InvoicePage {
  items: Invoice[];
  total: number;
  limit: number;
  offset: number;
}

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
}

export interface InvoiceInput {
  title?: string;
  accountId?: string;
  contactId?: string;
  dealId?: string;
  ownerUserId?: string;
  notes?: string;
  issueDate?: string;
  dueDate?: string;
  items: InvoiceItemInput[];
}

export interface PaymentInput {
  amount: number;
  paidOn?: string;
  method?: string;
  reference?: string;
  note?: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const PAGE_SIZE = 25;

const BASE = "/api/v1/invoices";

export const invoicesApi = {
  list: (offset = 0, status = "", limit = PAGE_SIZE) =>
    apiFetch<InvoicePage>(
      `${BASE}?limit=${limit}&offset=${offset}${status ? `&status=${status}` : ""}`,
    ),

  get: (id: string) => apiFetch<Invoice>(`${BASE}/${id}`),

  create: (input: InvoiceInput) =>
    apiFetch<Invoice>(BASE, { method: "POST", body: JSON.stringify(input) }),

  fromQuote: (quoteId: string, dueDate?: string) =>
    apiFetch<Invoice>(`${BASE}/from-quote`, {
      method: "POST",
      body: JSON.stringify({ quoteId, dueDate }),
    }),

  update: (id: string, input: InvoiceInput) =>
    apiFetch<Invoice>(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(input) }),

  setStatus: (id: string, status: InvoiceStatus) =>
    apiFetch<Invoice>(`${BASE}/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  recordPayment: (id: string, input: PaymentInput) =>
    apiFetch<Invoice>(`${BASE}/${id}/payments`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  remove: (id: string) => apiFetch<void>(`${BASE}/${id}`, { method: "DELETE" }),
};
