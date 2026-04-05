"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { Leaf } from "lucide-react";
import Link from "next/link";

interface DecayingRelationship {
  person_id: string;
  name: string;
  last_contact_days: number;
  interaction_count: number;
  decay_severity: "mild" | "moderate" | "severe";
  last_interaction_date?: string;
  relationship_summary?: string;
}

export function DecayAlertBanner() {
  const [decayingRelationships, setDecayingRelationships] = useState<DecayingRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function fetchDecayingRelationships() {
      try {
        const response = await fetch("/api/decay-alerts?days=180");
        if (response.ok) {
          const data = await response.json();
          const processed = (data.relationships || []).map((p: {
            id: string;
            name: string;
            last_interaction_date?: string;
            created_at: string;
            interaction_count?: number;
            relationship_summary?: string;
          }) => {
            const lastDate = p.last_interaction_date || p.created_at;
            const days = Math.floor((new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
            
            let severity: "mild" | "moderate" | "severe" = "mild";
            if (days > 365) severity = "severe";
            else if (days > 180) severity = "moderate";

            return {
              person_id: p.id,
              name: p.name,
              last_contact_days: days,
              interaction_count: p.interaction_count || 0,
              decay_severity: severity,
              last_interaction_date: p.last_interaction_date,
              relationship_summary: p.relationship_summary
            };
          });
          setDecayingRelationships(processed);
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getSeverityText = (days: number) => {
    if (days > 365) return "Over a year";
    if (days > 180) return `${Math.floor(days / 30)} months`;
    return `${days} days`;
  };

  // Limit to top 3 suggestions
  const topSuggestions = decayingRelationships.slice(0, 3);
  const firstNames = topSuggestions.map(s => s.name.split(' ')[0]);
  

  return (
    <>
      {/* Collapsed View */}
      <Card 
        className="border border-indigo-500/30 bg-surface/40 backdrop-blur-sm shadow-xl mb-4 overflow-hidden transition-all hover:bg-surface/60 hover:scale-[1.01] hover:shadow-indigo-500/10 group cursor-pointer"
        onClick={() => setIsExpanded(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Leaf className="h-5 w-5 text-text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg md:text-xl font-black text-text-primary tracking-tight group-hover:text-indigo-300 transition-colors leading-tight">
                  Reconnect with{" "}
                  {firstNames.length > 0 ? (
                    firstNames.map((name, i) => (
                      <span key={`${name}-${i}`} className="text-indigo-400">
                        {name}{i < firstNames.length - 1 ? (i === firstNames.length - 2 ? " & " : ", ") : ""}
                      </span>
                    ))
                  ) : "your network"}
                </h3>
                <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mt-1 opacity-70">
                  Nurture your network today
                </p>
              </div>
            </div>
            
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              variant="secondary"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 text-xs font-bold px-4 rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95 ml-4"
            >
              View Suggestions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expanded View (Sheet) */}
      <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
        <SheetContent side="bottom" className="sm:max-w-none h-[85vh] bg-canvas border-0 p-0 rounded-t-[32px] overflow-hidden flex flex-col">
          <div className="w-12 h-1 bg-surface rounded-full mx-auto mt-3 mb-6 shrink-0" />
          
          <div className="px-6 flex-1 overflow-y-auto">
            <SheetHeader className="text-left space-y-1 mb-8">
              <SheetTitle className="text-2xl font-bold text-text-primary">
                Time to Reconnect
              </SheetTitle>
              <SheetDescription className="text-text-secondary text-base leading-relaxed">
                Nurture your network to keep it healthy. <br />
                <Leaf className="h-4 w-4 text-text-accent inline mt-1" />
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 pb-24">
              {topSuggestions.map((relationship) => (
                <Link 
                  key={relationship.person_id} 
                  href={`/contacts/${relationship.person_id}`}
                  onClick={() => setIsExpanded(false)}
                  className="block"
                >
                  <div className="flex flex-col gap-3 p-5 bg-surface border border-border-default rounded-2xl hover:border-indigo-500/50 hover:bg-surface/80 transition-all group shadow-sm">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 border-2 border-border-default group-hover:border-indigo-500/30 shadow-inner">
                        <AvatarFallback className="bg-surface text-text-secondary font-bold text-lg">
                          {getInitials(relationship.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-text-primary truncate group-hover:text-indigo-300 transition-colors">
                          {relationship.name}
                        </h4>
                        <p className="text-sm text-text-secondary font-medium mt-0.5">
                          Last contact: <span className="text-text-tertiary">{formatDate(relationship.last_interaction_date)}</span>
                        </p>
                      </div>

                      <Badge className="bg-indigo-500/10 text-text-accent border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider px-2 py-1 h-fit shrink-0">
                        {getSeverityText(relationship.last_contact_days)} AGO
                      </Badge>
                    </div>

                    {relationship.relationship_summary ? (
                      <div className="mt-2 p-3 bg-canvas/50 rounded-xl border border-border-default/50 italic">
                        <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                          &quot;{relationship.relationship_summary}&quot;
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2 p-3 bg-canvas/50 rounded-xl border border-border-default/50">
                        <p className="text-sm text-text-secondary italic">
                          No reach-out suggestion available yet. Start a memory dump to get AI insights.
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="p-6 bg-canvas/80 backdrop-blur-md border-t border-surface">
            <div className="flex gap-3">
              <Link href="/insights" className="flex-1">
                <Button 
                  className="w-full bg-surface hover:bg-elevated text-text-primary border border-border-default h-14 rounded-2xl font-bold text-base shadow-xl"
                  onClick={() => setIsExpanded(false)}
                >
                  View All Suggestions
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="bg-surface/50 hover:bg-elevated text-text-secondary h-14 rounded-2xl px-6 font-bold text-base"
                onClick={() => {
                  setDismissed(true);
                  setIsExpanded(false);
                }}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

