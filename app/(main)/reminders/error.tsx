"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/error-fallback";

export default function RemindersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Reminders page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <ErrorFallback
        error={error}
        reset={reset}
        title="Reminders unavailable"
        message="We couldn't load your contact reminders. Please try again."
      />
    </div>
  );
}
