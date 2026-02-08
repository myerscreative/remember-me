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
import { Leaf, X } from "lucide-react";
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
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getSeverityText = (days: number) => {
    if (days > 365) return "Over a year";
    if (days > 180) return `${Math.floor(days / 30)} months`;
    return `${days} days`;
  };

  return (
    <>
      {/* Collapsed View */}
      <Card className="border border-indigo-500/20 bg-slate-900/40 backdrop-blur-sm shadow-lg mb-6 overflow-hidden transition-all hover:bg-slate-900/60 group">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <Leaf className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {decayingRelationships.length > 3 
                  ? "Contact your next 3 people" 
                  : `${decayingRelationships.length} ${decayingRelationships.length === 1 ? "person needs" : "people need"} attention`}
              </h3>
              <p className="text-xs text-slate-400">
                Nurture your network today
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => setIsExpanded(true)}
            variant="default"
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 h-9 px-4 rounded-lg font-semibold shadow-md shadow-indigo-500/20"
          >
            View Suggestions
          </Button>
        </CardContent>
      </Card>

      {/* Expanded View (Sheet) */}
      <Sheet open={isExpanded} onOpenChange={setIsExpanded}>
        <SheetContent side="bottom" className="sm:max-w-none h-[85vh] bg-slate-950 border-0 p-0 rounded-t-[32px] overflow-hidden flex flex-col">
          <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto mt-3 mb-6 shrink-0" />
          
          <div className="px-6 flex-1 overflow-y-auto">
            <SheetHeader className="text-left space-y-1 mb-8">
              <SheetTitle className="text-2xl font-bold text-white flex items-center justify-between">
                Time to Reconnect
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-900 rounded-full"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </SheetTitle>
              <SheetDescription className="text-slate-400 text-base leading-relaxed">
                Nurture your network to keep it healthy. <br />
                <Leaf className="h-4 w-4 text-indigo-400 inline mt-1" />
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-3 pb-24">
              {decayingRelationships.slice(0, 10).map((relationship) => (
                <Link 
                  key={relationship.person_id} 
                  href={`/contacts/${relationship.person_id}`}
                  onClick={() => setIsExpanded(false)}
                >
                  <div className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all group">
                    <Avatar className="h-12 w-12 border-2 border-slate-800 group-hover:border-indigo-500/30">
                      <AvatarFallback className="bg-slate-800 text-slate-400 font-bold text-sm">
                        {getInitials(relationship.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-white truncate">
                        {relationship.name}
                      </h4>
                      {relationship.relationship_summary && (
                        <p className="text-[11px] text-slate-400 font-medium italic mb-1 line-clamp-1">
                          {relationship.relationship_summary}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 font-medium">
                        Last touch: {formatDate(relationship.last_interaction_date)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-800/80 text-slate-400 border-slate-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1">
                        {getSeverityText(relationship.last_contact_days)} AGO
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="p-6 bg-slate-950/80 backdrop-blur-md border-t border-slate-900">
            <div className="flex gap-3">
              <Link href="/insights" className="flex-1">
                <Button 
                  className="w-full bg-[#1a1c24] hover:bg-[#252835] text-white border border-slate-800 h-14 rounded-2xl font-bold text-base shadow-xl"
                  onClick={() => setIsExpanded(false)}
                >
                  View All Suggestions
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="bg-[#1a1c24]/50 hover:bg-[#252835] text-slate-400 h-14 rounded-2xl px-6 font-bold text-base"
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

