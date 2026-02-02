import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock environment variables
vi.stubEnv("TWO_FACTOR_ENCRYPTION_KEY", "test-encryption-key-32-bytes-12");

// Mock otplib before importing twoFactor
vi.mock("otplib", () => ({
  authenticator: {
    generateSecret: vi.fn(() => "JBSWY3DPEHPK3PXPTEST"),
    keyuri: vi.fn((email, issuer, secret) => `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`),
    verify: vi.fn(({ token, secret }) => {
      // Accept any 6-digit token for testing
      return /^\d{6}$/.test(token) && secret.length > 0;
    }),
  },
}));

// Mock qrcode
vi.mock("qrcode", () => ({
  toDataURL: vi.fn(async () => "data:image/png;base64,mockQRCodeData"),
}));

// Import after mocking
import {
  generateSecret,
  encryptSecret,
  decryptSecret,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  verifyTOTP,
  generateQRCodeDataURL,
} from "../twoFactor";

describe("twoFactor", () => {
  describe("generateSecret", () => {
    it("generates a secret via otplib", () => {
      const secret = generateSecret();
      expect(secret).toBeDefined();
      expect(typeof secret).toBe("string");
      expect(secret).toBe("JBSWY3DPEHPK3PXPTEST"); // Mocked value
    });
  });

  describe("encryptSecret and decryptSecret", () => {
    it("encrypts and decrypts a secret", () => {
      const original = "JBSWY3DPEHPK3PXP";
      const encrypted = encryptSecret(original);

      expect(encrypted).not.toBe(original);
      expect(encrypted).toContain(":"); // IV:encrypted format

      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(original);
    });

    it("produces different ciphertexts for same plaintext (due to random IV)", () => {
      const secret = "JBSWY3DPEHPK3PXP";
      const encrypted1 = encryptSecret(secret);
      const encrypted2 = encryptSecret(secret);

      expect(encrypted1).not.toBe(encrypted2);

      // But both decrypt to same value
      expect(decryptSecret(encrypted1)).toBe(secret);
      expect(decryptSecret(encrypted2)).toBe(secret);
    });

    it("handles empty string", () => {
      const encrypted = encryptSecret("");
      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe("");
    });

    it("handles special characters", () => {
      const original = "ABC123!@#$%^&*()";
      const encrypted = encryptSecret(original);
      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(original);
    });
  });

  describe("generateBackupCodes", () => {
    it("generates 10 backup codes by default", () => {
      const codes = generateBackupCodes();
      expect(codes).toHaveLength(10);
    });

    it("generates specified number of codes", () => {
      const codes = generateBackupCodes(5);
      expect(codes).toHaveLength(5);
    });

    it("generates codes in correct format (XXXX-XXXX)", () => {
      const codes = generateBackupCodes();
      for (const code of codes) {
        expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      }
    });

    it("generates unique codes", () => {
      const codes = generateBackupCodes(100);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(100);
    });
  });

  describe("hashBackupCode and verifyBackupCode", () => {
    it("hashes a backup code", () => {
      const code = "ABCD-1234";
      const hash = hashBackupCode(code);

      expect(hash).not.toBe(code);
      expect(hash.length).toBe(64); // SHA-256 produces 64 hex chars
    });

    it("verifies a backup code against hashed codes", () => {
      const codes = ["ABCD-1234", "EFGH-5678", "IJKL-9012"];
      const hashedCodes = codes.map(hashBackupCode);

      expect(verifyBackupCode("ABCD-1234", hashedCodes)).toBe(true);
      expect(verifyBackupCode("EFGH-5678", hashedCodes)).toBe(true);
      expect(verifyBackupCode("IJKL-9012", hashedCodes)).toBe(true);
    });

    it("rejects invalid backup code", () => {
      const codes = ["ABCD-1234", "EFGH-5678"];
      const hashedCodes = codes.map(hashBackupCode);

      expect(verifyBackupCode("XXXX-YYYY", hashedCodes)).toBe(false);
      expect(verifyBackupCode("ABCD-123", hashedCodes)).toBe(false);
    });

    it("normalizes case when verifying", () => {
      const hashedCodes = [hashBackupCode("ABCD-1234")];

      expect(verifyBackupCode("abcd-1234", hashedCodes)).toBe(true);
      expect(verifyBackupCode("AbCd-1234", hashedCodes)).toBe(true);
    });

    it("handles codes without dashes", () => {
      const hashedCodes = [hashBackupCode("ABCD-1234")];

      // Without dash should still work (normalization)
      expect(verifyBackupCode("ABCD1234", hashedCodes)).toBe(true);
    });
  });

  describe("verifyTOTP", () => {
    it("rejects invalid token format", () => {
      const secret = generateSecret();
      expect(verifyTOTP("12345", secret)).toBe(false); // 5 digits
      expect(verifyTOTP("1234567", secret)).toBe(false); // 7 digits
      expect(verifyTOTP("abcdef", secret)).toBe(false); // letters
      expect(verifyTOTP("", secret)).toBe(false); // empty
    });

    it("accepts 6-digit tokens", () => {
      // We can't easily test valid tokens without knowing the current time
      // But we can verify the function doesn't throw on valid format
      const secret = generateSecret();
      const result = verifyTOTP("123456", secret);
      expect(typeof result).toBe("boolean");
    });
  });

  describe("generateQRCodeDataURL", () => {
    it("generates a data URL", async () => {
      const secret = "JBSWY3DPEHPK3PXP";
      const email = "test@example.com";
      const dataURL = await generateQRCodeDataURL(secret, email);

      expect(dataURL).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe("integration", () => {
    it("backup code can only be used once (simulation)", () => {
      const codes = generateBackupCodes(3);
      const hashedCodes = codes.map(hashBackupCode);

      // Use first code
      expect(verifyBackupCode(codes[0], hashedCodes)).toBe(true);

      // Simulate removing used code
      const remainingHashes = hashedCodes.slice(1);

      // First code no longer works
      expect(verifyBackupCode(codes[0], remainingHashes)).toBe(false);

      // Other codes still work
      expect(verifyBackupCode(codes[1], remainingHashes)).toBe(true);
      expect(verifyBackupCode(codes[2], remainingHashes)).toBe(true);
    });
  });
});
