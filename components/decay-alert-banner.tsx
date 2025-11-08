"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, X, Archive, Users, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DecayingRelationship {
  person_id: string;
  name: string;
  last_contact_days: number;
  interaction_count: number;
  decay_severity: "mild" | "moderate" | "severe";
}

export function DecayAlertBanner() {
  const [decayingRelationships, setDecayingRelationships] = useState<DecayingRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function fetchDecayingRelationships() {
      try {
        const response = await fetch("/api/decay-alerts?days=180");
        if (response.ok) {
          const data = await response.json();
          setDecayingRelationships(data.relationships || []);
        }
      } catch (error) {
        console.error("Error fetching decaying relationships:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDecayingRelationships();
  }, []);

  if (loading || dismissed || decayingRelationships.length === 0) {
    return null;
  }

  const severeCount = decayingRelationships.filter((r) => r.decay_severity === "severe").length;
  const moderateCount = decayingRelationships.filter((r) => r.decay_severity === "moderate").length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "severe":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      case "moderate":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    }
  };

  const getSeverityText = (days: number) => {
    if (days > 365) return "Over a year";
    if (days > 180) return `${Math.floor(days / 30)} months`;
    return `${days} days`;
  };

  return (
    <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 mb-6">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base md:text-lg font-bold text-orange-900 dark:text-orange-100">
                Relationships Needing Attention
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDismissed(true)}
                className="h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
              {severeCount > 0 && (
                <span className="font-medium">
                  {severeCount} relationship{severeCount > 1 ? "s" : ""} haven't been contacted in over a year.
                </span>
              )}
              {severeCount === 0 && moderateCount > 0 && (
                <span className="font-medium">
                  {moderateCount} relationship{moderateCount > 1 ? "s" : ""} haven't been contacted in 6+ months.
                </span>
              )}
              {" "}Consider reconnecting or archiving to keep your list focused.
            </p>

            {/* Show top decaying relationships */}
            <div className="space-y-2 mb-4">
              {decayingRelationships.slice(0, 3).map((relationship) => (
                <Link key={relationship.person_id} href={`/contacts/${relationship.person_id}`}>
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors cursor-pointer border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Users className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {relationship.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={cn("text-xs", getSeverityColor(relationship.decay_severity))}>
                        {getSeverityText(relationship.last_contact_days)} ago
                      </Badge>
                      <Calendar className="h-3 w-3 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {decayingRelationships.length > 3 && (
              <p className="text-xs text-orange-700 dark:text-orange-300 mb-3">
                + {decayingRelationships.length - 3} more relationship{decayingRelationships.length - 3 > 1 ? "s" : ""}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Link href="/insights">
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                  View All
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDismissed(true)}
                className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
