"use client";

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface LoreTooltipProps {
  children: React.ReactNode;
  lastContactDate?: string | null;
  lastContactMethod?: string | null;
  isFading?: boolean;
}

export function LoreTooltip({ children, lastContactDate, lastContactMethod, isFading }: LoreTooltipProps) {
  const timeInfo = lastContactDate 
    ? formatDistanceToNow(new Date(lastContactDate), { addSuffix: true }) 
    : "Never contacted";

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent className="bg-[#0F172A] border border-slate-700 text-slate-200 text-xs p-3 max-w-[200px] shadow-xl">
           <div className="flex flex-col gap-1.5">
               <div className="flex items-center gap-2">
                   <Clock className="h-3 w-3 text-[#38BDF8]" />
                   <span className="font-semibold">{timeInfo}</span>
               </div>
               
               {lastContactMethod && (
                   <p className="text-slate-400 pl-5">via {lastContactMethod}</p>
               )}
               
               {isFading && (
                   <div className="flex items-start gap-2 mt-1 text-orange-400">
                       <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                       <span className="leading-tight font-medium">Fading fast — reconnect to save streak</span>
                   </div>
               )}
           </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
