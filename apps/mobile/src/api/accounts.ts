import { apiFetch } from "../lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Account {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  phone: string | null;
  notes: string | null;
  ownerUserId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  createdAt: string;
  updatedAt: string;
  contactCount: number;
  dealCount: number;
  leadCount: number;
}

export interface AccountPage {
  items: Account[];
  total: number;
  limit: number;
  offset: number;
}

export interface AccountInput {
  name: string;
  website?: string;
  industry?: string;
  phone?: string;
  notes?: string;
  ownerUserId?: string;
}

export interface PlantLocation {
  name: string;
  city: string;
  address?: string;
  spocName?: string;
  spocPhone?: string;
}

export interface HardwareSpecs {
  edgeProcessor?: string;
  cameraCount?: number;
  speakerCount?: number;
  nvrMake?: string;
}

export interface CompanyProfile {
  companyId: string;
  tagline: string | null;
  description: string | null;
  primaryColor: string;
  bannerUrl: string | null;
  plantLocations: PlantLocation[];
  aiDetections: string[];
  hardwareSpecs: HardwareSpecs;
  amcStatus: "active" | "pending_renewal" | "expired" | "none";
  amcStartDate: string | null;
  amcEndDate: string | null;
  amcValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedDeal {
  id: string;
  title: string;
  stage: string;
  amount: number;
  probability: number | null;
  siteAssessmentDate: string | null;
  siteAssessmentLocation: string | null;
  expectedCloseDate: string | null;
  remark?: string | null;
  leadId: string | null;
  totalCameras: number | null;
  location: string | null;
  products: string | null;
  createdAt: string;
}

export interface LinkedQuote {
  id: string;
  number: string | null;
  status: string;
  total: number;
  currency: string;
  currentVersion: number;
  validUntil: string | null;
  createdAt: string;
}

export interface LinkedInvoice {
  id: string;
  invoiceNumber: string | null;
  title: string | null;
  status: string;
  total: number;
  amountDue: number;
  amountPaid: number;
  dueDate: string | null;
  createdAt: string;
}

export interface LinkedContact {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
}

export interface LinkedLead {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  stage: string;
  value: number | null;
  createdAt: string;
}

export interface FullCompanyProfilePayload {
  account: Account;
  profile: CompanyProfile;
  deals: LinkedDeal[];
  quotes: LinkedQuote[];
  invoices: LinkedInvoice[];
  contacts: LinkedContact[];
  leads: LinkedLead[];
}

export interface ProfileInput {
  name: string;
  website?: string | null;
  industry?: string | null;
  phone?: string | null;
  notes?: string | null;
  ownerUserId?: string | null;
  tagline?: string | null;
  description?: string | null;
  primaryColor?: string | null;
  bannerUrl?: string | null;
  plantLocations?: PlantLocation[];
  aiDetections?: string[];
  hardwareSpecs?: HardwareSpecs;
  amcStatus?: string | null;
  amcStartDate?: string | null;
  amcEndDate?: string | null;
  amcValue?: number | null;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export const PAGE_SIZE = 25;

const BASE = "/api/v1/accounts";

export const accountsApi = {
  list: (offset = 0, limit = PAGE_SIZE, search = "", sort = "") => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    if (search.trim()) params.set("search", search.trim());
    if (sort) params.set("sort", sort);
    return apiFetch<AccountPage>(`${BASE}?${params}`);
  },

  get: (id: string) => apiFetch<Account>(`${BASE}/${id}`),

  create: (input: AccountInput) =>
    apiFetch<Account>(BASE, { method: "POST", body: JSON.stringify(input) }),

  update: (id: string, input: AccountInput) =>
    apiFetch<Account>(`${BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  remove: (id: string) => apiFetch<void>(`${BASE}/${id}`, { method: "DELETE" }),

  getProfile: (id: string) =>
    apiFetch<FullCompanyProfilePayload>(`${BASE}/${id}/profile`),

  updateProfile: (id: string, payload: ProfileInput) =>
    apiFetch<FullCompanyProfilePayload>(`${BASE}/${id}/profile`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};
