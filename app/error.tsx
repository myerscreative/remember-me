"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/error-fallback";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <ErrorFallback
        error={error}
        reset={reset}
        title="Something went wrong"
        message="An unexpected error occurred. Please try again or return home."
      />
    </div>
  );
}
