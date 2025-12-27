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

  const getSeverityText = (days: number | undefined | null) => {
    // Handle undefined/null specifically as "Not yet contacted" or "Long time"
    if (days === undefined || days === null) return "Ready for a first hello"; 
    
    if (days > 365) return "Over a year";
    if (days > 180) return `${Math.floor(days / 30)} months`;
    return `${days} days`;
  };

  return (
    <Card className="border border-[var(--nurture-banner-border,rgba(59,130,246,0.3))] bg-[var(--nurture-banner-bg,rgba(59,130,246,0.1))] dark:border-[var(--nurture-banner-border,rgba(59,130,246,0.3))] dark:bg-[var(--nurture-banner-bg,rgba(59,130,246,0.1))] backdrop-blur-sm shadow-xl mb-6 relative overflow-hidden">
        {/* Subtle decorative gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
      <CardContent className="p-4 md:p-5 relative z-10">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
               {/* Leaf icon for "Garden/Growth" metaphor */}
              <Users className="h-5 w-5 text-[var(--nurture-banner-text)]" />
            </div>
          </div>
 
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base md:text-lg font-bold text-[var(--nurture-banner-text)]">
                Time to Reconnect
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDismissed(true)}
                className="h-6 w-6 text-[var(--nurture-banner-text)] opacity-50 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
 
            <p className="text-sm text-[var(--nurture-banner-text)] opacity-80 mb-4 leading-relaxed">
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
              {" "}Nurture your network to keep it healthy. 🌱
            </p>

            {/* Show top decaying relationships */}
            <div className="space-y-2 mb-4">
              {decayingRelationships.slice(0, 3).map((relationship) => (
                <Link key={relationship.person_id} href={`/contacts/${relationship.person_id}`}>
                  <div className="flex items-center justify-between p-2.5 bg-slate-900/50 border border-slate-700/50 rounded-lg hover:border-indigo-500/50 hover:bg-slate-800 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-2 w-2 rounded-full bg-indigo-500 group-hover:shadow-[0_0_8px_rgba(99,102,241,0.6)] transition-shadow" />
                      <span className="text-sm font-medium text-slate-200 group-hover:text-white truncate">
                        {relationship.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={cn("text-[10px] bg-indigo-500/10 text-indigo-300 border-indigo-500/20")}>
                        {getSeverityText(relationship.last_contact_days)} {relationship.last_contact_days ? 'ago' : ''}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/insights">
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-indigo-500/20">
                  View All
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDismissed(true)}
                className="text-slate-400 hover:text-white hover:bg-white/5"
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
