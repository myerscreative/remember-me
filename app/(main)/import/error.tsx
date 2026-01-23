"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/error-fallback";

export default function ImportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Import page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <ErrorFallback
        error={error}
        reset={reset}
        title="Import failed"
        message="We couldn't complete the import. Please check your file and try again."
      />
    </div>
  );
}
