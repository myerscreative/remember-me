'use client';

import { useState, useEffect } from 'react';
import { getInitials } from '@/lib/utils/contact-helpers';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MessageSquare } from 'lucide-react';
import { InteractionLogger } from './InteractionLogger';

interface PersonPanelProps {
  contact: any;
}

export function PersonPanel({ contact }: PersonPanelProps) {

  // Calculate health status
  const lastContactDate = contact.last_interaction_date ? new Date(contact.last_interaction_date) : null;
  const daysSinceContact = lastContactDate 
    ? Math.floor((new Date().getTime() - lastContactDate.getTime()) / (1000 * 3600 * 24))
    : Infinity;
  
  const frequency = contact.target_frequency_days || 30;
  const isOverdue = daysSinceContact > frequency;
  const isHealthy = daysSinceContact <= frequency * 0.5; // Green if contacted recently
  
  const healthColor = isOverdue 
    ? '#ef4444' // red-500
    : isHealthy 
      ? '#10b981' // emerald-500
      : '#f59e0b'; // amber-500



  return (
    <div className="w-full md:w-[420px] bg-[#0f1419] border-b md:border-b-0 md:border-r border-[#1a1f2e] flex flex-col overflow-y-auto flex-shrink-0 h-auto md:h-full">
      {/* DEPLOYMENT CHECK BANNER */}
      <div className="bg-pink-600 text-white text-xs font-black text-center py-2 uppercase tracking-widest animate-pulse">
        ⚠️ Verifying Deployment v3.0 ⚠️<br/>
        {new Date().toLocaleTimeString()}
      </div>

      {/* HEADER */}
      <div className="p-6 md:p-7 text-center border-b border-[#1a1f2e]">
        <div className="relative inline-block mb-4">
          <div 
            className="w-24 h-24 md:w-[100px] md:h-[100px] rounded-full bg-[#2d3748] flex items-center justify-center text-3xl md:text-[40px] font-semibold text-white overflow-hidden border-[3px]"
            style={{ borderColor: healthColor }}
          >
            {contact.photo_url || contact.avatar_url ? (
              <img src={contact.photo_url || contact.avatar_url} alt={contact.name} className="w-full h-full object-cover" />
            ) : (
              getInitials(contact.firstName || contact.first_name || contact.name)
            )}
          </div>
          <div 
            className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 rounded-full border-[3px] border-[#0f1419]"
            style={{ backgroundColor: healthColor }}
          />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-100 mb-1.5" style={{ textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
          {contact.firstName || contact.first_name || contact.name}
        </h1>
        
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mb-5">
          <span>🎂 Birthday:</span>
          <span>{contact.birthday || 'Not set'}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-2.5">
          {contact.phone ? (
            <Button 
              variant="outline" 
              className="bg-[#1a1f2e] border-[#2d3748] hover:bg-[#2d3748] hover:text-white text-gray-300 h-auto py-3 flex flex-col gap-1.5 rounded-xl border-opacity-50"
              asChild
            >
              <a href={`tel:${contact.phone}`}>
                <Phone className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-xs font-medium">Call</span>
              </a>
            </Button>
          ) : (
             <Button 
              variant="outline" 
              className="bg-[#1a1f2e] border-[#2d3748] text-gray-500 h-auto py-3 flex flex-col gap-1.5 rounded-xl border-opacity-50 cursor-not-allowed"
              disabled
            >
              <Phone className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-xs font-medium">Call</span>
            </Button>
          )}

          {contact.email ? (
            <Button 
              variant="outline" 
              className="bg-[#1a1f2e] border-[#2d3748] hover:bg-[#2d3748] hover:text-white text-gray-300 h-auto py-3 flex flex-col gap-1.5 rounded-xl border-opacity-50"
              asChild
            >
              <a href={`mailto:${contact.email}`}>
                <Mail className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-xs font-medium">Email</span>
              </a>
            </Button>
          ) : (
             <Button 
              variant="outline" 
              className="bg-[#1a1f2e] border-[#2d3748] text-gray-500 h-auto py-3 flex flex-col gap-1.5 rounded-xl border-opacity-50 cursor-not-allowed"
              disabled
            >
              <Mail className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-xs font-medium">Email</span>
            </Button>
          )}

          {contact.phone ? (
            <Button 
              variant="outline" 
              className="bg-[#1a1f2e] border-[#2d3748] hover:bg-[#2d3748] hover:text-white text-gray-300 h-auto py-3 flex flex-col gap-1.5 rounded-xl border-opacity-50"
              asChild
            >
              <a href={`sms:${contact.phone}`}>
                <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-xs font-medium">Text</span>
              </a>
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="bg-[#1a1f2e] border-[#2d3748] text-gray-500 h-auto py-3 flex flex-col gap-1.5 rounded-xl border-opacity-50 cursor-not-allowed"
              disabled
            >
              <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-xs font-medium">Text</span>
            </Button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5 md:p-6 flex flex-col gap-4 md:gap-5">
        
        {/* Log Interaction Card */}
        <div className="bg-[#1a1f2e] rounded-xl p-4 md:p-[18px]">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-3">
                Log Interaction
            </h3>
            <InteractionLogger 
                contactId={contact.id} 
                contactName={contact.firstName || contact.first_name || contact.name}
            />
        </div>



      </div>
    </div>
  );
}
