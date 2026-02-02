"use client";

import dynamic from "next/dynamic";

// Dynamic import of Swagger UI to reduce initial bundle size (~356KB)
const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin h-8 w-8 border-4 border-zinc-300 border-t-zinc-800 rounded-full" />
        <p className="text-zinc-600">Loading API documentation...</p>
      </div>
    </div>
  ),
});

// Import CSS separately - this is needed for Swagger UI styling
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SwaggerUI url="/openapi.json" />
    </div>
  );
}
