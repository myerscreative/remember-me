"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/error-fallback";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
      <ErrorFallback
        error={error}
        reset={reset}
        title="Authentication error"
        message="Something went wrong during sign in. Please try again."
        showHomeLink={false}
      />
      <Link href="/login">
        <Button variant="outline">Back to Sign In</Button>
      </Link>
    </div>
  );
}
