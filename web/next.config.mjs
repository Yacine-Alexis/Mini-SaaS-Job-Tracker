import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Suppress source map upload logs in build output
  silent: true,
  
  // Organization and project for Sentry
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Auth token for uploading source maps (from env)
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Only upload source maps in production builds
  dryRun: process.env.NODE_ENV !== "production",
  
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  
  // Automatically tree-shake Sentry logger statements
  disableLogger: true,
  
  // Transpile SDK to be compatible with IE11
  transpileClientSDK: false,
};

// Wrap with Sentry if DSN is configured, otherwise export plain config
const exportedConfig = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;

export default exportedConfig;
