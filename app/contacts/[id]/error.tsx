"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/error-fallback";

export default function ContactError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Contact page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <ErrorFallback
        error={error}
        reset={reset}
        title="Contact not found"
        message="We couldn't load this contact. It may have been deleted or you may not have access."
      />
    </div>
  );
}
