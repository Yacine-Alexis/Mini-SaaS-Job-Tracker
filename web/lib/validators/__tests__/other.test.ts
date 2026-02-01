import { describe, it, expect } from "vitest";
import { noteCreateSchema, noteUpdateSchema } from "@/lib/validators/notes";
import { taskCreateSchema, taskUpdateSchema } from "@/lib/validators/tasks";
import { contactCreateSchema, contactUpdateSchema } from "@/lib/validators/contacts";
import {
  attachmentLinkCreateSchema,
  attachmentLinkUpdateSchema
} from "@/lib/validators/attachmentLinks";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validators/passwordReset";

describe("noteCreateSchema", () => {
  it("validates a valid note", () => {
    const result = noteCreateSchema.safeParse({
      applicationId: "app-123",
      content: "This is a note"
    });
    expect(result.success).toBe(true);
  });

  it("requires applicationId", () => {
    const result = noteCreateSchema.safeParse({
      content: "Note without app"
    });
    expect(result.success).toBe(false);
  });

  it("requires content", () => {
    const result = noteCreateSchema.safeParse({
      applicationId: "app-123",
      content: ""
    });
    expect(result.success).toBe(false);
  });
});

describe("noteUpdateSchema", () => {
  it("validates content update", () => {
    const result = noteUpdateSchema.safeParse({
      content: "Updated content"
    });
    expect(result.success).toBe(true);
  });

  it("requires non-empty content", () => {
    const result = noteUpdateSchema.safeParse({
      content: ""
    });
    expect(result.success).toBe(false);
  });
});

describe("taskCreateSchema", () => {
  it("validates a valid task", () => {
    const result = taskCreateSchema.safeParse({
      applicationId: "app-123",
      title: "Follow up",
      dueDate: "2024-12-31T00:00:00.000Z",
      status: "OPEN"
    });
    expect(result.success).toBe(true);
  });

  it("requires applicationId and title", () => {
    const result = taskCreateSchema.safeParse({
      title: "Task without app"
    });
    expect(result.success).toBe(false);
  });

  it("validates status enum", () => {
    const result = taskCreateSchema.safeParse({
      applicationId: "app-123",
      title: "Task",
      status: "INVALID"
    });
    expect(result.success).toBe(false);
  });

  it("allows optional dueDate", () => {
    const result = taskCreateSchema.safeParse({
      applicationId: "app-123",
      title: "Task"
    });
    expect(result.success).toBe(true);
  });
});

describe("taskUpdateSchema", () => {
  it("allows partial updates", () => {
    const result = taskUpdateSchema.safeParse({
      title: "Updated title"
    });
    expect(result.success).toBe(true);
  });

  it("allows status update", () => {
    const result = taskUpdateSchema.safeParse({
      status: "DONE"
    });
    expect(result.success).toBe(true);
  });
});

describe("contactCreateSchema", () => {
  it("validates a valid contact", () => {
    const result = contactCreateSchema.safeParse({
      applicationId: "app-123",
      name: "John Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      role: "Recruiter"
    });
    expect(result.success).toBe(true);
  });

  it("requires applicationId and name", () => {
    const result = contactCreateSchema.safeParse({
      email: "john@example.com"
    });
    expect(result.success).toBe(false);
  });

  it("validates email format", () => {
    const result = contactCreateSchema.safeParse({
      applicationId: "app-123",
      name: "John",
      email: "invalid-email"
    });
    expect(result.success).toBe(false);
  });

  it("allows optional fields", () => {
    const result = contactCreateSchema.safeParse({
      applicationId: "app-123",
      name: "John"
    });
    expect(result.success).toBe(true);
  });
});

describe("contactUpdateSchema", () => {
  it("allows partial updates", () => {
    const result = contactUpdateSchema.safeParse({
      name: "Jane Doe"
    });
    expect(result.success).toBe(true);
  });

  it("validates email on update", () => {
    const result = contactUpdateSchema.safeParse({
      email: "invalid"
    });
    expect(result.success).toBe(false);
  });
});

describe("attachmentLinkCreateSchema", () => {
  it("validates a valid attachment link", () => {
    const result = attachmentLinkCreateSchema.safeParse({
      applicationId: "app-123",
      url: "https://drive.google.com/file/123",
      label: "Resume"
    });
    expect(result.success).toBe(true);
  });

  it("requires applicationId and url", () => {
    const result = attachmentLinkCreateSchema.safeParse({
      label: "Resume"
    });
    expect(result.success).toBe(false);
  });

  it("validates URL format", () => {
    const result = attachmentLinkCreateSchema.safeParse({
      applicationId: "app-123",
      url: "not-a-url"
    });
    expect(result.success).toBe(false);
  });

  it("allows optional label", () => {
    const result = attachmentLinkCreateSchema.safeParse({
      applicationId: "app-123",
      url: "https://example.com/doc.pdf"
    });
    expect(result.success).toBe(true);
  });
});

describe("attachmentLinkUpdateSchema", () => {
  it("allows partial updates", () => {
    const result = attachmentLinkUpdateSchema.safeParse({
      label: "Updated Label"
    });
    expect(result.success).toBe(true);
  });

  it("validates URL on update", () => {
    const result = attachmentLinkUpdateSchema.safeParse({
      url: "invalid-url"
    });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("validates a valid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "user@example.com"
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "invalid"
    });
    expect(result.success).toBe(false);
  });

  it("validates email max length", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "a".repeat(250) + "@example.com"
    });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("validates a valid reset request", () => {
    const result = resetPasswordSchema.safeParse({
      token: "valid-token-12345",
      newPassword: "SecurePass123!"
    });
    expect(result.success).toBe(true);
  });

  it("requires token min length", () => {
    const result = resetPasswordSchema.safeParse({
      token: "short",
      newPassword: "SecurePass123!"
    });
    expect(result.success).toBe(false);
  });

  it("requires password min length (8 chars)", () => {
    const result = resetPasswordSchema.safeParse({
      token: "valid-token-12345",
      newPassword: "short"
    });
    expect(result.success).toBe(false);
  });

  it("enforces password max length (72 chars for bcrypt)", () => {
    const result = resetPasswordSchema.safeParse({
      token: "valid-token-12345",
      newPassword: "a".repeat(73)
    });
    expect(result.success).toBe(false);
  });
});
