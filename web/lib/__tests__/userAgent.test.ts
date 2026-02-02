/**
 * Tests for user agent parsing
 */

import { describe, it, expect } from "vitest";
import { parseUserAgent, getDeviceDescription, getDeviceIcon } from "@/lib/userAgent";

describe("userAgent", () => {
  describe("parseUserAgent", () => {
    it("handles null user agent", () => {
      const result = parseUserAgent(null);
      expect(result.deviceType).toBe("unknown");
      expect(result.browser).toBe("Unknown");
      expect(result.os).toBe("Unknown");
    });

    it("handles empty user agent", () => {
      const result = parseUserAgent("");
      expect(result.deviceType).toBe("unknown");
    });

    describe("browser detection", () => {
      it("detects Chrome", () => {
        const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        expect(parseUserAgent(ua).browser).toBe("Chrome");
      });

      it("detects Firefox", () => {
        const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0";
        expect(parseUserAgent(ua).browser).toBe("Firefox");
      });

      it("detects Safari", () => {
        const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15";
        expect(parseUserAgent(ua).browser).toBe("Safari");
      });

      it("detects Edge", () => {
        const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
        expect(parseUserAgent(ua).browser).toBe("Edge");
      });

      it("detects Opera", () => {
        const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0";
        expect(parseUserAgent(ua).browser).toBe("Opera");
      });
    });

    describe("OS detection", () => {
      it("detects Windows 10/11", () => {
        const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
        expect(parseUserAgent(ua).os).toBe("Windows 10/11");
      });

      it("detects macOS", () => {
        const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";
        expect(parseUserAgent(ua).os).toBe("macOS");
      });

      it("detects iOS", () => {
        const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15";
        expect(parseUserAgent(ua).os).toBe("iOS");
      });

      it("detects Android", () => {
        const ua = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36";
        expect(parseUserAgent(ua).os).toBe("Android");
      });

      it("detects Linux", () => {
        const ua = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36";
        expect(parseUserAgent(ua).os).toBe("Linux");
      });
    });

    describe("device type detection", () => {
      it("detects desktop by default", () => {
        const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
        expect(parseUserAgent(ua).deviceType).toBe("desktop");
      });

      it("detects mobile from iPhone", () => {
        const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X)";
        expect(parseUserAgent(ua).deviceType).toBe("mobile");
      });

      it("detects mobile from Android mobile", () => {
        const ua = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
        expect(parseUserAgent(ua).deviceType).toBe("mobile");
      });

      it("detects tablet from iPad", () => {
        const ua = "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15";
        expect(parseUserAgent(ua).deviceType).toBe("tablet");
      });

      it("detects tablet from Android tablet", () => {
        const ua = "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36";
        expect(parseUserAgent(ua).deviceType).toBe("tablet");
      });
    });

    it("preserves raw user agent", () => {
      const ua = "Test User Agent String";
      expect(parseUserAgent(ua).raw).toBe(ua);
    });
  });

  describe("getDeviceDescription", () => {
    it("formats desktop description", () => {
      const parsed = {
        deviceType: "desktop" as const,
        browser: "Chrome",
        os: "Windows 10/11",
        raw: "",
      };
      expect(getDeviceDescription(parsed)).toBe("Chrome on Windows 10/11");
    });

    it("formats mobile description with device type", () => {
      const parsed = {
        deviceType: "mobile" as const,
        browser: "Safari",
        os: "iOS",
        raw: "",
      };
      expect(getDeviceDescription(parsed)).toBe("Safari on iOS (mobile)");
    });

    it("handles unknown values", () => {
      const parsed = {
        deviceType: "unknown" as const,
        browser: "Unknown",
        os: "Unknown",
        raw: "",
      };
      expect(getDeviceDescription(parsed)).toBe("Unknown device");
    });

    it("handles partial info", () => {
      const parsed = {
        deviceType: "desktop" as const,
        browser: "Chrome",
        os: "Unknown",
        raw: "",
      };
      expect(getDeviceDescription(parsed)).toBe("Chrome");
    });
  });

  describe("getDeviceIcon", () => {
    it("returns smartphone for mobile", () => {
      expect(getDeviceIcon("mobile")).toBe("smartphone");
    });

    it("returns tablet for tablet", () => {
      expect(getDeviceIcon("tablet")).toBe("tablet");
    });

    it("returns monitor for desktop", () => {
      expect(getDeviceIcon("desktop")).toBe("monitor");
    });

    it("returns help-circle for unknown", () => {
      expect(getDeviceIcon("unknown")).toBe("help-circle");
    });
  });
});
