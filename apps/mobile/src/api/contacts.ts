import { apiFetch } from "../lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Contact {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  accountId: string | null;
  createdAt: string;
}

export interface ContactPage {
  items: Contact[];
  total: number;
  limit: number;
  offset: number;
}

export interface ContactInput {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  accountId?: string;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const PAGE_SIZE = 25;

const BASE = "/api/v1/contacts";

export const contactsApi = {
  list: (offset = 0, limit = PAGE_SIZE) =>
    apiFetch<ContactPage>(`${BASE}?limit=${limit}&offset=${offset}`),

  get: (id: string) => apiFetch<Contact>(`${BASE}/${id}`),

  create: (input: ContactInput) =>
    apiFetch<Contact>(BASE, { method: "POST", body: JSON.stringify(input) }),

  update: (id: string, input: ContactInput) =>
    apiFetch<Contact>(`${BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  remove: (id: string) => apiFetch<void>(`${BASE}/${id}`, { method: "DELETE" }),
};

/** "Ada Lovelace", or just "Ada" when there's no surname on file. */
export function contactName(contact: Pick<Contact, "firstName" | "lastName">): string {
  return contact.lastName ? `${contact.firstName} ${contact.lastName}` : contact.firstName;
}
