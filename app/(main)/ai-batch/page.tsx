"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sprout,
  Zap,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  DollarSign,
  Clock,
  ArrowRight,
  Brain,
  Flower2,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  batchGenerateSummaries,
  getContactsNeedingAI,
  getBatchProcessingSummary,
  hasEnoughContextForSummary,
  type BatchProcessProgress,
  type BatchProcessResult,
} from "@/lib/ai/batchProcessing";
import type { Person } from "@/types/database.types";

export default function AIBatchPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Person[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    withEnoughContext: number;
    needMoreContext: number;
    estimatedCost: number;
    estimatedTime: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchProcessProgress | null>(null);
  const [results, setResults] = useState<BatchProcessResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load contacts and summary on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [contactsData, summaryData] = await Promise.all([
        getContactsNeedingAI({ importedOnly: true }),
        getBatchProcessingSummary(),
      ]);

      setContacts(contactsData);
      setSummary(summaryData);
    } catch (err: unknown) {
      console.error("Error loading data:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load contacts";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const startBatchProcessing = async () => {
    if (contacts.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setResults([]);

    try {
      // Filter contacts with enough context
      const contactsToProcess = contacts.filter(hasEnoughContextForSummary);

      if (contactsToProcess.length === 0) {
        setError("No contacts have enough information to generate summaries");
        setIsProcessing(false);
        return;
      }

      // Process in batches
      const batchResults = await batchGenerateSummaries(
        contactsToProcess,
        (progressUpdate) => {
          setProgress(progressUpdate);
        },
        1000 // 1 second delay between requests
      );

      setResults(batchResults);

      // Reload data after completion
      if (batchResults.some((r) => r.success)) {
        await loadData();
      }
    } catch (err: unknown) {
      console.error("Error during batch processing:", err);
      const errorMessage = err instanceof Error ? err.message : "Batch processing failed";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <span className="text-gray-600 dark:text-gray-400">
            Loading contacts...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent pb-32">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="relative">
                <Sprout className="h-8 w-8 text-green-600" />
                <Brain className="h-4 w-4 text-purple-600 absolute -top-1 -right-1" />
              </div>
              AI Relationship Insight
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Automatically cultivate context and summaries for your imported seeds.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Card className="border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                      Error
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Card or Success State */}
          {summary && !isProcessing && results.length === 0 && (
            <>
              {summary.withEnoughContext > 0 ? (
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5 text-purple-600" />
                      Imported Contacts Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Total Imported
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {summary.total}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Ready to Process
                        </p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {summary.withEnoughContext}
                        </p>
                      </div>

                      <div 
                        className="space-y-1 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => router.push("/triage?mode=enrichment")}
                      >
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Need More Context
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {summary.needMoreContext}
                          </p>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-orange-600">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-[10px] text-orange-600/70 font-medium">Go to Garden Enrichment</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-800/10 pt-4 flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(summary.estimatedCost)}
                          </span>
                          <span className="text-xs text-gray-500">Est. Cost</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDuration(summary.estimatedTime)}
                          </span>
                          <span className="text-xs text-gray-500">Est. Time</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={loadData}
                        className="text-xs h-8"
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh Counts
                      </Button>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={startBatchProcessing}
                        className="w-full bg-purple-600 hover:bg-purple-700 h-10"
                        size="default"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Start AI Processing ({summary.withEnoughContext} contacts)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : summary.total > 0 ? (
                /* Success State (Enriched) */
                <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
                  <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                      <Flower2 className="h-10 w-10 text-green-600" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Garden is Enriched!</h2>
                      <p className="text-slate-600 dark:text-slate-400 max-w-md">
                        All your seeds have been analyzed and have the context they need to flourish. Your Relationship Garden is looking healthy.
                      </p>
                    </div>
                    <Button 
                      onClick={() => router.push("/garden")}
                      className="mt-4 bg-purple-600 hover:bg-purple-700 shadow-sm px-8"
                    >
                      View My Garden
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    No imported contacts found. Import contacts first to use
                    AI Relationship Insight.
                  </p>
                  <Button
                    onClick={() => router.push("/import")}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Go to Import
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Processing Progress */}
          {isProcessing && progress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
                  Processing Contacts...
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Progress
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {progress.processed} / {progress.total}
                    </span>
                  </div>
                  <Progress
                    value={(progress.processed / progress.total) * 100}
                    className="h-3"
                  />
                </div>

                {progress.currentContact && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-purple-900 dark:text-purple-200">
                      Currently processing:{" "}
                      <span className="font-semibold">
                        {progress.currentContact}
                      </span>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {progress.processed}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Processed
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {progress.successful}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Successful
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {progress.failed}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Failed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {results.length > 0 && !isProcessing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Processing Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {results.length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Total
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {results.filter((r) => r.success).length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Successful
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {results.filter((r) => !r.success).length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Failed
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => router.push("/")}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    View Contacts
                  </Button>
                  <Button
                    onClick={loadData}
                    variant="outline"
                    className="flex-1"
                  >
                    Process More
                  </Button>
                </div>

                {/* Failed Results */}
                {results.some((r) => !r.success) && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Failed Contacts
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {results
                        .filter((r) => !r.success)
                        .map((result) => (
                          <div
                            key={result.personId}
                            className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800"
                          >
                            <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                              {result.personName}
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                              {result.error}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    How AI Batch Processing Works
                  </h3>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                    <li>
                      Generates one-line summaries for imported contacts
                    </li>
                    <li>
                      Processes ~1 contact per second (rate limited for API
                      safety)
                    </li>
                    <li>
                      Costs approximately $0.0001 per contact (OpenAI gpt-4o-mini)
                    </li>
                    <li>
                      Contacts need some context (notes, where met, or email) to
                      generate summaries
                    </li>
                    <li>
                      All processed contacts are marked as &quot;has context&quot; in the
                      database
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
