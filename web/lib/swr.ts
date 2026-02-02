/**
 * SWR Hooks for Data Fetching
 * 
 * Provides cached, auto-revalidating data fetching hooks
 * for all major API endpoints.
 */

import useSWR, { SWRConfiguration } from "swr";
import useSWRMutation from "swr/mutation";
import { fetcher, postFetcher, patchFetcher, FetchError } from "@/lib/fetcher";

// ============================================================================
// Types
// ============================================================================

export interface DashboardData {
  stageCounts: Record<string, number>;
  weeklyApplications: { weekStart: string; count: number }[];
  total: number;
  totalLastWeek: number;
  activityDates: string[];
  topTags: { tag: string; count: number }[];
}

export interface ApplicationListItem {
  id: string;
  company: string;
  position: string;
  stage: string;
  salary: string | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  location: string | null;
  locationType: string | null;
  url: string | null;
  tags: string[];
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    notes?: number;
    tasks?: number;
    contacts?: number;
    interviews?: number;
  };
}

export interface ApplicationsResponse {
  items: ApplicationListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApplicationDetail extends ApplicationListItem {
  notes: Array<{
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    dueAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  contacts: Array<{
    id: string;
    name: string;
    role: string | null;
    email: string | null;
    phone: string | null;
    notes: string | null;
    createdAt: string;
  }>;
  interviews: Array<{
    id: string;
    scheduledAt: string;
    type: string;
    location: string | null;
    notes: string | null;
    status: string;
  }>;
  attachmentLinks: Array<{
    id: string;
    label: string;
    url: string;
    type: string;
    createdAt: string;
  }>;
}

export interface UserData {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  createdAt: string;
}

// ============================================================================
// Configuration
// ============================================================================

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
};

// Longer cache for less frequently changing data
const slowConfig: SWRConfiguration = {
  ...defaultConfig,
  refreshInterval: 60000, // 1 minute
  dedupingInterval: 30000, // 30 seconds
};

// ============================================================================
// Dashboard Hook
// ============================================================================

export function useDashboard(config?: SWRConfiguration) {
  return useSWR<DashboardData, FetchError>(
    "/api/dashboard",
    fetcher,
    {
      ...slowConfig,
      ...config,
    }
  );
}

// ============================================================================
// Applications Hooks
// ============================================================================

export interface UseApplicationsParams {
  page?: number;
  limit?: number;
  search?: string;
  stage?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function useApplications(
  params: UseApplicationsParams = {},
  config?: SWRConfiguration
) {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.stage) searchParams.set("stage", params.stage);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const queryString = searchParams.toString();
  const url = `/api/applications${queryString ? `?${queryString}` : ""}`;

  return useSWR<ApplicationsResponse, FetchError>(
    url,
    fetcher,
    {
      ...defaultConfig,
      ...config,
    }
  );
}

export function useApplication(id: string | null, config?: SWRConfiguration) {
  return useSWR<{ application: ApplicationDetail }, FetchError>(
    id ? `/api/applications/${id}` : null,
    fetcher,
    {
      ...defaultConfig,
      ...config,
    }
  );
}

// ============================================================================
// Application Mutations
// ============================================================================

export interface CreateApplicationData {
  company: string;
  position: string;
  stage?: string;
  salary?: string | null;
  salaryCurrency?: string | null;
  salaryPeriod?: string | null;
  location?: string | null;
  locationType?: string | null;
  url?: string | null;
  tags?: string[];
  appliedAt?: string | null;
}

export function useCreateApplication() {
  return useSWRMutation<
    { application: ApplicationListItem },
    FetchError,
    string,
    CreateApplicationData
  >("/api/applications", postFetcher);
}

export function useUpdateApplication(id: string) {
  return useSWRMutation<
    { application: ApplicationListItem },
    FetchError,
    string,
    Partial<CreateApplicationData>
  >(`/api/applications/${id}`, patchFetcher);
}

// ============================================================================
// User Hook
// ============================================================================

export function useUser(config?: SWRConfiguration) {
  return useSWR<UserData, FetchError>(
    "/api/me",
    fetcher,
    {
      ...slowConfig,
      ...config,
    }
  );
}

// ============================================================================
// Notes Hooks
// ============================================================================

export interface Note {
  id: string;
  content: string;
  applicationId: string;
  createdAt: string;
  updatedAt: string;
}

export function useNotes(applicationId: string | null, config?: SWRConfiguration) {
  return useSWR<{ notes: Note[] }, FetchError>(
    applicationId ? `/api/notes?applicationId=${applicationId}` : null,
    fetcher,
    {
      ...defaultConfig,
      ...config,
    }
  );
}

export function useCreateNote(applicationId: string) {
  return useSWRMutation<
    { note: Note },
    FetchError,
    string,
    { content: string }
  >(`/api/notes?applicationId=${applicationId}`, postFetcher);
}

// ============================================================================
// Tasks Hooks
// ============================================================================

export interface Task {
  id: string;
  title: string;
  status: string;
  dueAt: string | null;
  applicationId: string;
  createdAt: string;
  updatedAt: string;
}

export function useTasks(applicationId: string | null, config?: SWRConfiguration) {
  return useSWR<{ tasks: Task[] }, FetchError>(
    applicationId ? `/api/tasks?applicationId=${applicationId}` : null,
    fetcher,
    {
      ...defaultConfig,
      ...config,
    }
  );
}

export function useCreateTask(applicationId: string) {
  return useSWRMutation<
    { task: Task },
    FetchError,
    string,
    { title: string; dueAt?: string | null }
  >(`/api/tasks?applicationId=${applicationId}`, postFetcher);
}

// ============================================================================
// Contacts Hooks
// ============================================================================

export interface Contact {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  applicationId: string;
  createdAt: string;
}

export function useContacts(applicationId: string | null, config?: SWRConfiguration) {
  return useSWR<{ contacts: Contact[] }, FetchError>(
    applicationId ? `/api/contacts?applicationId=${applicationId}` : null,
    fetcher,
    {
      ...defaultConfig,
      ...config,
    }
  );
}

// ============================================================================
// Interviews Hooks
// ============================================================================

export interface Interview {
  id: string;
  scheduledAt: string;
  type: string;
  location: string | null;
  notes: string | null;
  status: string;
  applicationId: string;
  createdAt: string;
}

export function useInterviews(applicationId: string | null, config?: SWRConfiguration) {
  return useSWR<{ interviews: Interview[] }, FetchError>(
    applicationId ? `/api/interviews?applicationId=${applicationId}` : null,
    fetcher,
    {
      ...defaultConfig,
      ...config,
    }
  );
}

// ============================================================================
// Labels/Tags Hooks
// ============================================================================

export interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export function useLabels(config?: SWRConfiguration) {
  return useSWR<{ labels: Label[] }, FetchError>(
    "/api/labels",
    fetcher,
    {
      ...slowConfig,
      ...config,
    }
  );
}

// ============================================================================
// Analytics Hooks
// ============================================================================

export interface AnalyticsData {
  applicationsByMonth: { month: string; count: number }[];
  responseRate: number;
  averageTimeToResponse: number;
  topCompanies: { company: string; count: number }[];
  stageConversion: { from: string; to: string; rate: number }[];
}

export function useAnalytics(config?: SWRConfiguration) {
  return useSWR<AnalyticsData, FetchError>(
    "/api/analytics",
    fetcher,
    {
      ...slowConfig,
      refreshInterval: 300000, // 5 minutes
      ...config,
    }
  );
}

// ============================================================================
// Cache Utilities
// ============================================================================

export { mutate } from "swr";

/**
 * Invalidate all application-related caches
 */
export function invalidateApplicationCaches() {
  const { mutate } = require("swr");
  mutate((key: string) => 
    typeof key === "string" && 
    (key.startsWith("/api/applications") || key === "/api/dashboard")
  );
}
