
"use client";

import React, { useState } from "react";
import { Person } from "@/types/database.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getBirthdayDisplayInfo, getLastContactText, getStatusConfig, getFrequencyLabel } from "@/lib/utils/date-helpers";
import { getInitials } from "@/lib/utils/contact-helpers";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FREQUENCY_PRESETS } from "@/lib/relationship-health";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ContactRowProps {
  contact: Person;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export function ContactRow({ contact, onToggleFavorite }: ContactRowProps) {
  const router = useRouter();
  const [isUpdatingFrequency, setIsUpdatingFrequency] = useState(false);
  const [currentFrequency, setCurrentFrequency] = useState(contact.target_frequency_days);

  // Avatar Initials
  const initials = getInitials(contact.first_name, contact.last_name);
  
  // Relationship Badge
  const getRelationshipBadge = () => {
    if (contact.is_favorite) return "⭐";
    if (contact.importance === "high" || contact.importance === "medium") return "👤"; 
    return "🪪"; // Contacts (Low / None)
  };

  const birthdayInfo = getBirthdayDisplayInfo(contact.birthday);
  const lastContactText = getLastContactText(contact.last_contact); 
  
  const frequencyLabel = getFrequencyLabel(currentFrequency);
  const statusConfig = getStatusConfig(contact.last_contact, currentFrequency);

  const handleClick = () => {
    router.push(`/contacts/${contact.id}`);
  };

  const handleUpdateFrequency = async (days: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (days === currentFrequency) return;

    setIsUpdatingFrequency(true);
    const oldFrequency = currentFrequency;
    setCurrentFrequency(days);

    try {
      const response = await fetch("/api/update-frequency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.id, frequencyDays: days }),
      });

      if (!response.ok) throw new Error("Failed to update frequency");
      
      toast.success("Follow-up frequency updated");
    } catch (error) {
      console.error("Error updating frequency:", error);
      toast.error("Failed to update frequency");
      setCurrentFrequency(oldFrequency);
    } finally {
      setIsUpdatingFrequency(false);
    }
  };

  return (
    <>
      {/* DESKTOP LAYOUT (Grid) */}
      <div 
        onClick={handleClick}
        className="hidden md:grid grid-cols-[auto_1fr_180px_150px_140px] gap-6 items-center px-6 py-[18px] border-b border-[#1a1f2e] hover:bg-[#1a1f2e] cursor-pointer transition-colors group"
      >
        {/* Avatar */}
        <div className="relative">
          <Avatar className="h-12 w-12 border-2 border-[#3d4758]">
            <AvatarImage src={contact.photo_url || undefined} className="object-cover" />
            <AvatarFallback className="bg-[#2d3748] text-white font-semibold text-[17px]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] bg-[#0a0e1a] rounded-full flex items-center justify-center text-[11px] border-2 border-[#0a0e1a]">
            {getRelationshipBadge()}
          </div>
        </div>

        {/* Name & Birthday */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-semibold text-slate-200 truncate">{contact.name}</span>
            {/* Birthday Badge (Today/Upcoming) */}
            {birthdayInfo.state === 'today' && (
               <span className="text-[13px] font-semibold text-[#ef4444] whitespace-nowrap">🎂 {birthdayInfo.text}</span>
            )}
            {birthdayInfo.state === 'upcoming' && (
               <span className="text-[13px] font-medium text-[#f59e0b] whitespace-nowrap">🎂 {birthdayInfo.text}</span>
            )}
          </div>
          {/* Distant Birthday */}
          {birthdayInfo.state === 'distant' && (
            <span className="text-[12px] text-slate-500 whitespace-nowrap">🎂 {birthdayInfo.text}</span>
          )}
        </div>

        {/* Last Contact */}
        <div className={cn("text-[14px] font-medium", !contact.last_contact ? "text-slate-500" : "text-slate-300")}>
          {lastContactText}
        </div>

        {/* Frequency */}
        <div className="text-[14px] text-slate-400">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div 
                className="hover:text-indigo-400 cursor-pointer flex items-center gap-1 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {isUpdatingFrequency ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : null}
                {frequencyLabel}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {FREQUENCY_PRESETS.map((preset) => (
                <DropdownMenuItem 
                  key={preset.days}
                  onClick={(e) => handleUpdateFrequency(preset.days, e)}
                  className={cn(currentFrequency === preset.days && "bg-indigo-50 dark:bg-indigo-900/30 font-bold")}
                >
                  {preset.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status */}
        <div className="flex items-center justify-end gap-2.5">
          <span className={cn("text-[14px] font-semibold text-right", statusConfig.colorClass)}>
            {statusConfig.text}
          </span>
          <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", statusConfig.dotClass)} />
        </div>
      </div>


      {/* MOBILE LAYOUT (Card) */}
      <div 
         onClick={handleClick}
         className="md:hidden flex flex-col gap-3 p-4 bg-[#1a1f2e] rounded-2xl active:scale-[0.98] active:bg-[#242938] transition-all border border-transparent active:border-violet-600 cursor-pointer"
      >
        {/* Row 1: Avatar + Name + Status */}
        <div className="flex items-center gap-3">
           <div className="relative shrink-0">
              <Avatar className="h-12 w-12 border-2 border-[#3d4758]">
                <AvatarImage src={contact.photo_url || undefined} className="object-cover" />
                <AvatarFallback className="bg-[#2d3748] text-white font-semibold text-[17px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#1a1f2e] rounded-full flex items-center justify-center text-[10px] border-2 border-[#1a1f2e]">
                {getRelationshipBadge()}
              </div>
           </div>

           <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                 <h3 className="font-semibold text-[18px] text-[#e2e8f0] leading-none">{contact.name}</h3>
                 {/* Mobile Birthday Badge - Inline if Today/Upcoming */}
                 {birthdayInfo.state === 'today' && (
                    <span className="text-[13px] font-semibold text-[#ef4444] whitespace-nowrap">🎂 {birthdayInfo.text}</span>
                 )}
                 {birthdayInfo.state === 'upcoming' && (
                    <span className="text-[13px] font-medium text-[#f59e0b] whitespace-nowrap">🎂 {birthdayInfo.text}</span>
                 )}
              </div>
              {/* Distant Birthday - Subtitle */}
              {birthdayInfo.state === 'distant' && (
                 <div className="text-[12px] text-[#64748b]">🎂 {birthdayInfo.text}</div>
              )}
           </div>

           <div className="flex items-center gap-2 shrink-0">
              <span className={cn("text-[13px] font-semibold whitespace-nowrap", statusConfig.colorClass)}>{statusConfig.text}</span>
              <div className={cn("w-2 h-2 rounded-full", statusConfig.dotClass)} />
           </div>
        </div>

        {/* Row 2: Bottom Info (Aligned with Name) */}
        <div className="pl-[60px] flex items-center gap-2 text-[13px] text-[#94a3b8]">
           <div className={cn(!contact.last_contact ? "text-[#64748b]" : "")}>
              <span className="text-[#64748b] mr-1">Last:</span>
              {lastContactText}
           </div>
           <span className="text-[#3d4758] text-[13px]">/</span>
           <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div 
                    className="hover:text-indigo-400 cursor-pointer flex items-center gap-1 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isUpdatingFrequency ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : null}
                    {frequencyLabel}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {FREQUENCY_PRESETS.map((preset) => (
                    <DropdownMenuItem 
                      key={preset.days}
                      onClick={(e) => handleUpdateFrequency(preset.days, e)}
                      className={cn(currentFrequency === preset.days && "bg-indigo-50 dark:bg-indigo-900/30 font-bold")}
                    >
                      {preset.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
           </div>
        </div>
      </div>
    </>
  );
}
