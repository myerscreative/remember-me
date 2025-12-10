"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/error-fallback";

export default function InsightsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Insights page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <ErrorFallback
        error={error}
        reset={reset}
        title="Insights unavailable"
        message="We couldn't load your relationship insights. Please try again."
      />
    </div>
  );
}
