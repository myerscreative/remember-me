"use client";

import { CheckCircle2, AlertCircle, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportProgressProps {
  stage: 'idle' | 'parsing' | 'importing' | 'complete' | 'error';
  total: number;
  imported: number;
  failed: number;
  currentContact?: string;
  errorMessage?: string;
}

export function ImportProgress({
  stage,
  total,
  imported,
  failed,
  currentContact,
  errorMessage,
}: ImportProgressProps) {
  const percentage = total > 0 ? Math.round((imported / total) * 100) : 0;
  const isComplete = stage === 'complete';
  const hasError = stage === 'error';

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {stage === 'parsing' && 'Parsing contacts...'}
            {stage === 'importing' && 'Importing contacts...'}
            {stage === 'complete' && 'Import complete!'}
            {stage === 'error' && 'Import failed'}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {imported} / {total}
          </span>
        </div>

        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              hasError ? "bg-red-500" : isComplete ? "bg-green-500" : "bg-purple-600"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{percentage}%</span>
          {failed > 0 && (
            <span className="text-red-600 dark:text-red-400">
              {failed} failed
            </span>
          )}
        </div>
      </div>

      {/* Current Status */}
      <div className="space-y-3">
        {stage === 'parsing' && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Reading file...
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                Parsing contact data from file
              </p>
            </div>
          </div>
        )}

        {stage === 'importing' && currentContact && (
          <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <Loader2 className="h-5 w-5 text-purple-600 dark:text-purple-400 animate-spin shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                Importing contacts...
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5 truncate">
                Current: {currentContact}
              </p>
            </div>
          </div>
        )}

        {stage === 'complete' && (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                Successfully imported {imported} contact{imported !== 1 ? 's' : ''}!
              </p>
              {failed > 0 && (
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  {failed} contact{failed !== 1 ? 's' : ''} could not be imported
                </p>
              )}
              <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                All contacts are marked as "imported" - you can add context to them later!
              </p>
            </div>
          </div>
        )}

        {stage === 'error' && errorMessage && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                Import failed
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                {errorMessage}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary (shown during import or after completion) */}
      {(stage === 'importing' || stage === 'complete') && (
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Users className="h-5 w-5 text-gray-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">{total}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          </div>

          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-900 dark:text-green-100">{imported}</p>
            <p className="text-xs text-green-700 dark:text-green-300">Imported</p>
          </div>

          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-red-900 dark:text-red-100">{failed}</p>
            <p className="text-xs text-red-700 dark:text-red-300">Failed</p>
          </div>
        </div>
      )}
    </div>
  );
}
