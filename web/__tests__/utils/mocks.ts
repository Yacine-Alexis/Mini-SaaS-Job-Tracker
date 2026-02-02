/**
 * Mock utilities for testing API routes and components
 */

import { vi } from "vitest";
import { NextRequest } from "next/server";

// ============================================
// PRISMA MOCK
// ============================================

export const mockPrismaClient = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  jobApplication: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  interview: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  document: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  note: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  task: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  contact: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  label: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  salaryOffer: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  attachmentLink: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  auditLog: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  emailPreferences: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  passwordResetToken: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $queryRaw: vi.fn(),
  $executeRaw: vi.fn(),
  $transaction: vi.fn((callback: (tx: typeof mockPrismaClient) => Promise<unknown>) => 
    callback(mockPrismaClient)
  ),
};

// Reset all mocks
export function resetPrismaMocks() {
  Object.values(mockPrismaClient).forEach((model) => {
    if (typeof model === "object" && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === "function" && "mockReset" in method) {
          (method as ReturnType<typeof vi.fn>).mockReset();
        }
      });
    } else if (typeof model === "function" && "mockReset" in model) {
      (model as ReturnType<typeof vi.fn>).mockReset();
    }
  });
}

// ============================================
// AUTH MOCK
// ============================================

export const mockUserId = "clu_test_user_123";

export function mockAuthenticatedUser(userId: string = mockUserId) {
  return {
    userId,
    error: null,
  };
}

export function mockAuthenticatedUserWithPlan(userId: string = mockUserId, plan: "FREE" | "PRO" = "PRO") {
  return {
    userId,
    plan,
    error: null,
  };
}

export function mockUnauthenticatedUser() {
  return {
    userId: null,
    error: new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }),
  };
}

export function mockUnauthenticatedUserWithPlan() {
  return {
    userId: null,
    plan: null,
    error: new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }),
  };
}

// ============================================
// REQUEST HELPERS
// ============================================

export function createMockRequest(
  method: string,
  url: string,
  options: {
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  const { body, headers = {}, searchParams = {} } = options;
  
  // Build URL with search params
  const urlObj = new URL(url, "http://localhost:3000");
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  const requestInit: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body && method !== "GET" && method !== "HEAD") {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(urlObj, requestInit);
}

export function createGETRequest(
  url: string,
  searchParams: Record<string, string> = {}
): NextRequest {
  return createMockRequest("GET", url, { searchParams });
}

export function createPOSTRequest(url: string, body: unknown): NextRequest {
  return createMockRequest("POST", url, { body });
}

export function createPATCHRequest(url: string, body: unknown): NextRequest {
  return createMockRequest("PATCH", url, { body });
}

export function createDELETERequest(
  url: string,
  searchParams: Record<string, string> = {}
): NextRequest {
  return createMockRequest("DELETE", url, { searchParams });
}

// ============================================
// RESPONSE HELPERS
// ============================================

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export function expectSuccessResponse(response: Response, expectedStatus: number = 200) {
  expect(response.status).toBe(expectedStatus);
  expect(response.headers.get("Content-Type")).toContain("application/json");
}

export function expectErrorResponse(response: Response, expectedStatus: number, expectedCode: string) {
  expect(response.status).toBe(expectedStatus);
  return response.json().then((data: { error?: { code: string } }) => {
    expect(data.error?.code).toBe(expectedCode);
    return data;
  });
}

// ============================================
// AUDIT MOCK
// ============================================

export const mockAudit = vi.fn().mockResolvedValue(undefined);

// ============================================
// RATE LIMIT MOCK
// ============================================

export const mockEnforceRateLimit = vi.fn().mockResolvedValue(null);

// ============================================
// SESSION MOCK FOR COMPONENTS
// ============================================

export function createMockSession(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      user: {
        id: mockUserId,
        email: "test@example.com",
        name: "Test User",
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      ...overrides,
    },
    status: "authenticated" as const,
  };
}

// ============================================
// FETCH MOCK
// ============================================

export function mockFetch(responses: Map<string, { status: number; data: unknown }>) {
  return vi.fn((url: string | URL | Request) => {
    const urlString = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
    const response = responses.get(urlString);
    
    if (response) {
      return Promise.resolve({
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        json: () => Promise.resolve(response.data),
        text: () => Promise.resolve(JSON.stringify(response.data)),
      });
    }
    
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: { code: "NOT_FOUND", message: "Not found" } }),
    });
  });
}

// ============================================
// TOAST MOCK
// ============================================

export const mockAddToast = vi.fn();
export const mockToastContext = {
  toasts: [],
  addToast: mockAddToast,
  removeToast: vi.fn(),
};
