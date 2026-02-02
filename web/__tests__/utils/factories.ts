/**
 * Test factories for generating mock data
 * Uses @faker-js/faker for realistic test data
 */

import { faker } from "@faker-js/faker";
import type {
  ApplicationStage,
  TaskStatus,
  Plan,
  Priority,
  RemoteType,
  JobType,
  InterviewType,
  InterviewResult,
  DocumentType,
  AuditAction,
  DigestFrequency,
} from "@prisma/client";

// Type definitions for factory outputs
export interface MockUser {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  plan: Plan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  planUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MockJobApplication {
  id: string;
  userId: string;
  company: string;
  title: string;
  description: string | null;
  url: string | null;
  location: string | null;
  stage: ApplicationStage;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  appliedDate: Date | null;
  followUpDate: Date | null;
  priority: Priority;
  remoteType: RemoteType;
  jobType: JobType;
  tags: string[];
  labels: string[];
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MockInterview {
  id: string;
  userId: string;
  applicationId: string;
  scheduledAt: Date;
  duration: number | null;
  type: InterviewType;
  location: string | null;
  interviewers: string[];
  notes: string | null;
  feedback: string | null;
  result: InterviewResult;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MockDocument {
  id: string;
  userId: string;
  applicationId: string | null;
  name: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string | null;
  fileContent: string | null;
  version: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MockNote {
  id: string;
  userId: string;
  applicationId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MockTask {
  id: string;
  userId: string;
  applicationId: string;
  title: string;
  dueDate: Date | null;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MockContact {
  id: string;
  userId: string;
  applicationId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  company: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MockLabel {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MockSalaryOffer {
  id: string;
  userId: string;
  applicationId: string;
  type: "INITIAL_OFFER" | "COUNTER_OFFER" | "REVISED_OFFER" | "FINAL_OFFER";
  baseSalary: number;
  bonus: number | null;
  equity: string | null;
  signingBonus: number | null;
  benefits: string | null;
  notes: string | null;
  offerDate: Date;
  isAccepted: boolean | null;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Counter for generating unique CUID-like IDs
let idCounter = 0;

function generateCuid(): string {
  idCounter++;
  return `clu${faker.string.alphanumeric(21)}${idCounter}`;
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  const now = new Date();
  return {
    id: generateCuid(),
    email: faker.internet.email().toLowerCase(),
    name: faker.person.fullName(),
    passwordHash: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4x5/2/qGhJ6/YL9m", // "password123"
    plan: "FREE" as Plan,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    planUpdatedAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function createMockJobApplication(
  overrides: Partial<MockJobApplication> = {}
): MockJobApplication {
  const now = new Date();
  return {
    id: generateCuid(),
    userId: generateCuid(),
    company: faker.company.name(),
    title: faker.person.jobTitle(),
    description: faker.lorem.paragraphs(2),
    url: faker.internet.url(),
    location: `${faker.location.city()}, ${faker.location.state()}`,
    stage: "SAVED" as ApplicationStage,
    salaryMin: faker.number.int({ min: 50000, max: 100000 }),
    salaryMax: faker.number.int({ min: 100000, max: 200000 }),
    currency: "USD",
    appliedDate: null,
    followUpDate: null,
    priority: "MEDIUM" as Priority,
    remoteType: "HYBRID" as RemoteType,
    jobType: "FULL_TIME" as JobType,
    tags: [faker.word.noun(), faker.word.noun()],
    labels: [],
    source: faker.helpers.arrayElement(["LinkedIn", "Indeed", "Referral", "Company Website"]),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function createMockInterview(
  overrides: Partial<MockInterview> = {}
): MockInterview {
  const now = new Date();
  const scheduledAt = faker.date.future({ years: 0.1 });
  return {
    id: generateCuid(),
    userId: generateCuid(),
    applicationId: generateCuid(),
    scheduledAt,
    duration: faker.helpers.arrayElement([30, 45, 60, 90]),
    type: faker.helpers.arrayElement([
      "PHONE",
      "VIDEO",
      "ONSITE",
      "TECHNICAL",
      "BEHAVIORAL",
      "FINAL",
    ]) as InterviewType,
    location: faker.internet.url(),
    interviewers: [faker.person.fullName(), faker.person.fullName()],
    notes: faker.lorem.paragraph(),
    feedback: null,
    result: "PENDING" as InterviewResult,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function createMockDocument(
  overrides: Partial<MockDocument> = {}
): MockDocument {
  const now = new Date();
  const type = faker.helpers.arrayElement([
    "RESUME",
    "COVER_LETTER",
    "PORTFOLIO",
    "OTHER",
  ]) as DocumentType;
  return {
    id: generateCuid(),
    userId: generateCuid(),
    applicationId: null,
    name: `${type === "RESUME" ? "Resume" : type === "COVER_LETTER" ? "Cover Letter" : "Document"} - ${faker.word.adjective()}`,
    type,
    fileName: `${faker.system.commonFileName("pdf")}`,
    fileUrl: faker.internet.url(),
    fileContent: null,
    version: faker.helpers.arrayElement(["v1", "v2", "Final", null]),
    isDefault: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function createMockNote(overrides: Partial<MockNote> = {}): MockNote {
  const now = new Date();
  return {
    id: generateCuid(),
    userId: generateCuid(),
    applicationId: generateCuid(),
    content: faker.lorem.paragraphs(1),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function createMockTask(overrides: Partial<MockTask> = {}): MockTask {
  const now = new Date();
  return {
    id: generateCuid(),
    userId: generateCuid(),
    applicationId: generateCuid(),
    title: faker.hacker.phrase(),
    dueDate: faker.date.future({ years: 0.1 }),
    status: "OPEN" as TaskStatus,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function createMockContact(
  overrides: Partial<MockContact> = {}
): MockContact {
  const now = new Date();
  return {
    id: generateCuid(),
    userId: generateCuid(),
    applicationId: generateCuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    role: faker.helpers.arrayElement([
      "Recruiter",
      "Hiring Manager",
      "Technical Lead",
      "HR",
    ]),
    company: faker.company.name(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function createMockLabel(overrides: Partial<MockLabel> = {}): MockLabel {
  const now = new Date();
  return {
    id: generateCuid(),
    userId: generateCuid(),
    name: faker.word.adjective(),
    color: faker.color.rgb({ format: 'hex' }),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function createMockSalaryOffer(
  overrides: Partial<MockSalaryOffer> = {}
): MockSalaryOffer {
  const now = new Date();
  const baseSalary = faker.number.int({ min: 80000, max: 200000 });
  return {
    id: generateCuid(),
    userId: generateCuid(),
    applicationId: generateCuid(),
    type: faker.helpers.arrayElement([
      "INITIAL_OFFER",
      "COUNTER_OFFER",
      "REVISED_OFFER",
      "FINAL_OFFER",
    ]) as MockSalaryOffer["type"],
    baseSalary,
    bonus: faker.helpers.maybe(() => faker.number.int({ min: 5000, max: 50000 })) ?? null,
    equity: faker.helpers.maybe(() => `${faker.number.int({ min: 1000, max: 50000 })} RSUs`) ?? null,
    signingBonus: faker.helpers.maybe(() => faker.number.int({ min: 5000, max: 30000 })) ?? null,
    benefits: faker.helpers.maybe(() => "Health, Dental, Vision, 401k") ?? null,
    notes: faker.helpers.maybe(() => faker.lorem.sentence()) ?? null,
    offerDate: faker.date.recent({ days: 30 }),
    isAccepted: null,
    currency: "USD",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

// ============================================
// BATCH FACTORY FUNCTIONS
// ============================================

export function createMockUsers(count: number, overrides: Partial<MockUser> = {}): MockUser[] {
  return Array.from({ length: count }, () => createMockUser(overrides));
}

export function createMockJobApplications(
  count: number,
  overrides: Partial<MockJobApplication> = {}
): MockJobApplication[] {
  return Array.from({ length: count }, () => createMockJobApplication(overrides));
}

export function createMockInterviews(
  count: number,
  overrides: Partial<MockInterview> = {}
): MockInterview[] {
  return Array.from({ length: count }, () => createMockInterview(overrides));
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function resetIdCounter(): void {
  idCounter = 0;
}

// Create a user with related applications
export function createMockUserWithApplications(
  applicationCount: number = 5,
  userOverrides: Partial<MockUser> = {},
  appOverrides: Partial<MockJobApplication> = {}
) {
  const user = createMockUser(userOverrides);
  const applications = createMockJobApplications(applicationCount, {
    userId: user.id,
    ...appOverrides,
  });
  return { user, applications };
}

// Create an application with full related data
export function createMockApplicationWithRelations(
  userIdOverride?: string,
  options: {
    notes?: number;
    tasks?: number;
    contacts?: number;
    interviews?: number;
  } = {}
) {
  const userId = userIdOverride || generateCuid();
  const application = createMockJobApplication({ userId });

  const notes = Array.from({ length: options.notes || 2 }, () =>
    createMockNote({ userId, applicationId: application.id })
  );

  const tasks = Array.from({ length: options.tasks || 2 }, () =>
    createMockTask({ userId, applicationId: application.id })
  );

  const contacts = Array.from({ length: options.contacts || 1 }, () =>
    createMockContact({ userId, applicationId: application.id })
  );

  const interviews = Array.from({ length: options.interviews || 1 }, () =>
    createMockInterview({ userId, applicationId: application.id })
  );

  return { application, notes, tasks, contacts, interviews };
}
