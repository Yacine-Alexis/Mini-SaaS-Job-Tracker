/**
 * User agent parsing utilities for session management.
 * Extracts device type, browser, and OS from user agent strings.
 * 
 * @module lib/userAgent
 */

export interface ParsedUserAgent {
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
  browser: string;
  os: string;
  raw: string;
}

/**
 * Parse a user agent string to extract device info
 */
export function parseUserAgent(userAgent: string | null): ParsedUserAgent {
  if (!userAgent) {
    return { deviceType: "unknown", browser: "Unknown", os: "Unknown", raw: "" };
  }

  const ua = userAgent.toLowerCase();

  // Detect device type
  let deviceType: ParsedUserAgent["deviceType"] = "desktop";
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) {
    deviceType = "mobile";
  } else if (/tablet|ipad|android(?!.*mobile)/i.test(ua)) {
    deviceType = "tablet";
  }

  // Detect browser
  let browser = "Unknown";
  if (ua.includes("edg/") || ua.includes("edge/")) {
    browser = "Edge";
  } else if (ua.includes("opr/") || ua.includes("opera")) {
    browser = "Opera";
  } else if (ua.includes("chrome/") && !ua.includes("chromium")) {
    browser = "Chrome";
  } else if (ua.includes("firefox/")) {
    browser = "Firefox";
  } else if (ua.includes("safari/") && !ua.includes("chrome")) {
    browser = "Safari";
  } else if (ua.includes("msie") || ua.includes("trident/")) {
    browser = "Internet Explorer";
  }

  // Detect OS
  let os = "Unknown";
  if (ua.includes("windows nt 10")) {
    os = "Windows 10/11";
  } else if (ua.includes("windows nt 6.3")) {
    os = "Windows 8.1";
  } else if (ua.includes("windows nt 6.2")) {
    os = "Windows 8";
  } else if (ua.includes("windows nt 6.1")) {
    os = "Windows 7";
  } else if (ua.includes("windows")) {
    os = "Windows";
  } else if (ua.includes("iphone") || ua.includes("ipad")) {
    os = "iOS";
  } else if (ua.includes("mac os x")) {
    os = "macOS";
  } else if (ua.includes("android")) {
    os = "Android";
  } else if (ua.includes("linux")) {
    os = "Linux";
  } else if (ua.includes("cros")) {
    os = "Chrome OS";
  }

  return { deviceType, browser, os, raw: userAgent };
}

/**
 * Get a user-friendly device description
 */
export function getDeviceDescription(parsed: ParsedUserAgent): string {
  const parts = [];
  
  if (parsed.browser !== "Unknown") {
    parts.push(parsed.browser);
  }
  
  if (parsed.os !== "Unknown") {
    parts.push(`on ${parsed.os}`);
  }
  
  if (parsed.deviceType !== "unknown" && parsed.deviceType !== "desktop") {
    parts.push(`(${parsed.deviceType})`);
  }
  
  return parts.length > 0 ? parts.join(" ") : "Unknown device";
}

/**
 * Get an icon name for the device type
 */
export function getDeviceIcon(deviceType: ParsedUserAgent["deviceType"]): string {
  switch (deviceType) {
    case "mobile":
      return "smartphone";
    case "tablet":
      return "tablet";
    case "desktop":
      return "monitor";
    default:
      return "help-circle";
  }
}
