"use client";

import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ErrorFallbackProps {
  error?: Error;
  reset?: () => void;
  title?: string;
  message?: string;
  showHomeLink?: boolean;
}

export function ErrorFallback({
  error,
  reset,
  title = "Something went wrong",
  message = "We encountered an unexpected error. Please try again.",
  showHomeLink = true,
}: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {title}
        </h2>

        {/* Message */}
        <p className="text-text-secondary mb-6">
          {message}
        </p>

        {/* Error details (development only) */}
        {error && process.env.NODE_ENV === "development" && (
          <div className="mb-6 p-4 bg-subtle rounded-lg text-left">
            <p className="text-xs font-mono text-text-secondary break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {reset && (
            <Button
              onClick={reset}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {showHomeLink && (
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
