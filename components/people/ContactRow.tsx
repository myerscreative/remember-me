
"use client";

import React from "react";
import { Person } from "@/types/database.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getBirthdayDisplayInfo, getLastContactText, getStatusConfig, getFrequencyLabel } from "@/lib/utils/date-helpers";
import { getInitials } from "@/lib/utils/contact-helpers";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ContactRowProps {
  contact: Person;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export function ContactRow({ contact, onToggleFavorite }: ContactRowProps) {
  const router = useRouter();

  // Avatar Initials
  const initials = getInitials(contact.first_name, contact.last_name);
  
  // Relationship Badge
  const getRelationshipBadge = () => {
    if (contact.is_favorite) return "⭐";
    if (contact.importance === "high") return "👤"; // Friends? Prompt said Friends=👤
    return "🪪"; // Contacts
  };

  const birthdayInfo = getBirthdayDisplayInfo(contact.birthday);
  const lastContactText = getLastContactText(contact.last_contact); // using last_contact based on type, or last_interaction_date? 
  // Database type has 'last_contact' and 'last_interaction_date'. Prompt says "last_contact_date (timestamp)". 
  // Let's check existing code. existing code usually uses `last_interaction_date` for recent interactions.
  // But type def has `last_contact`.
  // I will use `last_contact` field from the Person object as per the prompt instructions "last_contact_date" which probably maps to `last_contact`.
  // Actually, let's use `contact.last_contact` as primary.

  const frequencyLabel = getFrequencyLabel(contact.target_frequency_days);
  const statusConfig = getStatusConfig(contact.last_contact, contact.target_frequency_days);

  const handleClick = () => {
    router.push(`/contacts/${contact.id}`);
  };

  return (
    <>
      {/* DESKTOP LAYOUT (Grid) */}
      <div 
        onClick={handleClick}
        className="hidden md:grid grid-cols-[auto_1fr_200px_180px_160px] gap-6 items-center px-6 py-[18px] border-b border-[#1a1f2e] hover:bg-[#1a1f2e] cursor-pointer transition-colors group"
      >
        {/* Avatar */}
        <div className="relative">
          <Avatar className="h-12 w-12 border-2 border-[#3d4758]">
            <AvatarImage src={contact.photo_url || undefined} className="object-cover" />
            <AvatarFallback className="bg-[#2d3748] text-white font-semibold text-[17px]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] bg-[#0a0e1a] rounded-full flex items-center justify-center text-[11px] border-[2px] border-[#0a0e1a]">
            {getRelationshipBadge()}
          </div>
        </div>

        {/* Name & Birthday */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[16px] font-semibold text-slate-200 truncate">{contact.name}</span>
            {/* Birthday Badge (Today/Upcoming) */}
            {birthdayInfo.state === 'today' && (
               <span className="text-[13px] font-semibold text-[#ef4444]">🎂 {birthdayInfo.text}</span>
            )}
            {birthdayInfo.state === 'upcoming' && (
               <span className="text-[13px] font-medium text-[#f59e0b]">🎂 {birthdayInfo.text}</span>
            )}
          </div>
          {/* Distant Birthday */}
          {birthdayInfo.state === 'distant' && (
            <span className="text-[12px] text-slate-500">🎂 {birthdayInfo.text}</span>
          )}
        </div>

        {/* Last Contact */}
        <div className={cn("text-[14px] font-medium", !contact.last_contact ? "text-slate-500" : "text-slate-300")}>
          {lastContactText}
        </div>

        {/* Frequency */}
        <div className="text-[14px] text-slate-400">
          {frequencyLabel}
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
         className="md:hidden flex flex-col gap-3 p-4 bg-[#1a1f2e] rounded-2xl active:scale-[0.98] active:bg-[#242938] transition-all border border-transparent active:border-violet-600"
      >
        {/* Row 1: Avatar + Name + Status */}
        <div className="flex items-start gap-3">
           <div className="relative shrink-0">
              <Avatar className="h-11 w-11 border-2 border-[#3d4758]">
                <AvatarImage src={contact.photo_url || undefined} className="object-cover" />
                <AvatarFallback className="bg-[#2d3748] text-white font-semibold text-[16px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#1a1f2e] rounded-full flex items-center justify-center text-[10px] border-[2px] border-[#1a1f2e]">
                {getRelationshipBadge()}
              </div>
           </div>

           <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                 <h3 className="font-semibold text-base text-slate-200">{contact.name}</h3>
                 {/* Mobile Birthday Badge */}
                 {birthdayInfo.state === 'today' && (
                    <span className="text-[13px] font-semibold text-[#ef4444] whitespace-nowrap">🎂 {birthdayInfo.text}</span>
                 )}
                 {birthdayInfo.state === 'upcoming' && (
                    <span className="text-[13px] font-medium text-[#f59e0b] whitespace-nowrap">🎂 {birthdayInfo.text}</span>
                 )}
              </div>
              {birthdayInfo.state === 'distant' && (
                 <p className="text-xs text-slate-500 mt-0.5">🎂 {birthdayInfo.text}</p>
              )}
           </div>

           <div className="flex items-center gap-2 shrink-0">
              <span className={cn("text-[13px] font-semibold", statusConfig.colorClass)}>{statusConfig.text}</span>
              <div className={cn("w-2 h-2 rounded-full", statusConfig.dotClass)} />
           </div>
        </div>

        {/* Row 2: Last Contact & Frequency */}
        <div className="pl-[56px] flex flex-col gap-1.5">
           <div className={cn("text-[13px]", !contact.last_contact ? "text-slate-500" : "text-slate-400")}>
              <span className="text-slate-500 mr-1">Last:</span>
              {lastContactText}
           </div>
           <div className="text-[13px] text-slate-400">
              <span className="text-slate-500 mr-1">Frequency:</span>
              {frequencyLabel}
           </div>
        </div>
      </div>
    </>
  );
}
