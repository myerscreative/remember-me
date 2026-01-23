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



  // Map legacy color logic to status for Logger
  const healthStatus = isOverdue ? 'neglected' : (isHealthy ? 'nurtured' : 'drifting');

  return (
    <div className="w-full md:w-[420px] bg-[#0f1419] border-b md:border-b-0 md:border-r border-[#1a1f2e] flex flex-col overflow-y-auto shrink-0 h-auto md:h-full">

      <div className="flex-1 p-6 md:p-8 flex flex-col">
          <InteractionLogger 
              contactId={contact.id} 
              contactName={contact.firstName || contact.first_name || contact.name}
              photoUrl={contact.photo_url || contact.avatar_url}
              healthStatus={healthStatus}
              className="h-full"
          />
      </div>
    </div>
  );
}
