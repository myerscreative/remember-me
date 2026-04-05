"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Wrench, Hammer, Briefcase, Stethoscope, Search, Settings, LucideIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getInitials, getGradient } from "@/lib/utils/contact-helpers";
import { IntroDrawer } from "./IntroDrawer";

interface DiscoveryCardProps {
  skill: string;
  bridgeName: string;
  bridgePhotoUrl: string | null;
  bridgeContactId: string;
}

const skillIconMap: Record<string, LucideIcon> = {
  carpenter: Hammer,
  designer: Search, // fallback for designer
  lawyer: Briefcase,
  accountant: Briefcase,
  mechanic: Settings,
  doctor: Stethoscope,
  plumber: Wrench,
};

export function DiscoveryCard({ 
  skill, 
  bridgeName, 
  bridgePhotoUrl, 
  bridgeContactId
}: DiscoveryCardProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const Icon = skillIconMap[skill.toLowerCase()] || Briefcase;

  return (
    <>
      <Card className="hover:shadow-lg transition-all border-2 border-dashed border-indigo-400/50 bg-indigo-50/30 overflow-hidden group">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Anonymous Contact Icon */}
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-surface border border-indigo-100 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Icon className="h-7 w-7 text-indigo-500" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <Badge variant="outline" className="mb-2 border-indigo-200 text-indigo-600 bg-surface/80">
                    Network Discovery
                  </Badge>
                  <h3 className="text-lg font-bold text-text-primary mb-0.5">
                    Verified {skill}
                  </h3>
                </div>
                <div className="h-8 w-8 rounded-full bg-surface border border-indigo-50 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border-default shadow-xs">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={bridgePhotoUrl || undefined} alt={bridgeName} />
                    <AvatarFallback className={cn("text-[8px] text-white", getGradient(bridgeName))}>
                      {getInitials(bridgeName)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-text-secondary">
                    <span className="font-semibold text-text-primary">{bridgeName.split(' ')[0]}</span> knows them
                  </p>
                </div>
                
                <p className="text-xs text-text-tertiary italic">
                  &quot;One degree away&quot;
                </p>
              </div>

              <div className="mt-5 flex gap-2">
                <Button 
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 group-hover:gap-3"
                >
                  Ask {bridgeName.split(' ')[0]} for an Intro
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <IntroDrawer 
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        bridgeName={bridgeName}
        bridgePhotoUrl={bridgePhotoUrl}
        skill={skill}
        bridgeContactId={bridgeContactId} // Pass it here to use it
      />
    </>
  );
}
