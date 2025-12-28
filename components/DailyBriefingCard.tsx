'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coffee, Cake, Droplets, Heart, Sparkles, Star, Phone, Mail, MessageSquare, Flower2 } from 'lucide-react';
import { DailyBriefing } from '@/app/actions/get-daily-briefing';
import LogInteractionModal from '@/components/relationship-garden/LogInteractionModal';
import { getInitials, getGradient } from '@/lib/utils/contact-helpers';
import { LoreTooltip } from '@/components/dashboard/LoreTooltip';
import { UnifiedActionHub } from '@/components/dashboard/UnifiedActionHub';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface DailyBriefingCardProps {
  briefing: DailyBriefing;
  onActionComplete?: () => void;
}

export function DailyBriefingCard({ briefing, onActionComplete }: DailyBriefingCardProps) {
  const [selectedContact, setSelectedContact] = useState<{ id: string, name: string, template: string, [key: string]: any } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSharedMemoryOpen, setIsSharedMemoryOpen] = useState(false);

  const { milestones, thirstyTribes, priorityNurtures } = briefing;
  
  const totalActions = milestones.length + thirstyTribes.length + priorityNurtures.length;

  if (totalActions === 0) return null;

  const handleNurture = (id: string, name: string, template: string) => {
    setSelectedContact({ id, name, template });
    setIsModalOpen(true);
  };

  return (
    <>
      <Card className="border border-border bg-card shadow-xl relative overflow-hidden group">
        {/* Glass Header */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        
        <CardHeader className="relative pb-2 z-10">
          <div className="flex items-center justify-between">
            <div>
                 <h2 className="text-foreground font-bold text-lg mb-0.5">
                    Good Morning, Robert.
                 </h2>
                 <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                    You have <span className="text-primary font-bold">{totalActions} priority actions</span> today.
                 </p>
            </div>
            
            <div className="flex items-center gap-2 bg-primary/10 backdrop-blur-sm border border-primary/20 px-3 py-1.5 rounded-full">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary text-[10px] font-black uppercase tracking-widest">{totalActions} Actions</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-4 pb-6 overflow-x-auto">
          
          {/* Action Carousel */}
          {priorityNurtures.length > 0 ? (
              <div className="flex gap-4 pb-2 px-1">
                  {priorityNurtures.map((p, idx) => (
                      <div 
                        key={p.id} 
                        className={`
                            flex-shrink-0 w-40 flex flex-col items-center group relative
                            ${idx === 0 ? 'opacity-100' : 'opacity-90'}
                        `}
                      >
                          {/* Avatar ORB with Thirst Ring + Lore Tooltip */}
                          <LoreTooltip 
                             lastContactDate={p.last_interaction_date} 
                             lastContactMethod={p.last_contact_method} // Assuming this field exists or needs mapping
                             isFading={true} // Priority nurtures are by definition fading or thirsty
                          >
                              <div 
                                className="relative mb-3 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                                onClick={() => {
                                    setSelectedContact(p as any); 
                                    setIsSharedMemoryOpen(true);
                                }}
                              >
                                  {/* Glowing background for top priority */}
                                  {idx === 0 && (
                                      <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full" />
                                  )}
                                  
                                  {/* Thirst Ring (Dashed Orange) */}
                                  <div className="absolute -inset-1 rounded-full border-2 border-dashed border-orange-500/50 animate-[spin_10s_linear_infinite]" />
                                  
                                  
                                  <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-background bg-muted shadow-md">
                                       <Avatar className="h-full w-full">
                                            <AvatarImage src={p.photo_url || undefined} />
                                            <AvatarFallback className="text-lg font-bold text-white bg-slate-400 dark:bg-slate-600">
                                                {getInitials(p.first_name, p.last_name)}
                                            </AvatarFallback>
                                       </Avatar>
                                  </div>
                                  
                                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                                      <div className="bg-orange-500 h-3 w-3 rounded-full animate-pulse ring-1 ring-white dark:ring-transparent" />
                                  </div>
                              </div>
                          </LoreTooltip>

                          {/* Name & Shared Memories */}
                          <div 
                            className="text-center w-full mb-3 cursor-pointer hover:opacity-80"
                            onClick={() => {
                                setSelectedContact(p as any);
                                setIsSharedMemoryOpen(true);
                            }}
                          >
                              <h3 className="text-foreground font-bold text-sm truncate px-1">{p.name}</h3>
                              <p className="text-slate-600 dark:text-slate-400 text-[10px] font-medium truncate px-1 leading-tight">
                                  {p.deep_lore || p.relationship_summary || "Needs some love"}
                              </p>
                          </div>

                          {/* One-Tap Actions */}
                          <div className="flex items-center gap-2 justify-center w-full">
                               <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-all shadow-sm"
                                    onClick={() => handleNurture(p.id, p.name, `Call with ${p.first_name}`)}
                                >
                                   <Phone className="h-3.5 w-3.5" />
                               </Button>
                               <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-all shadow-sm"
                                    onClick={() => handleNurture(p.id, p.name, `Email to ${p.first_name}`)}
                               >
                                   <Mail className="h-3.5 w-3.5" />
                               </Button>
                               <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-all shadow-sm"
                                    onClick={() => handleNurture(p.id, p.name, `Message to ${p.first_name}`)}
                               >
                                   <MessageSquare className="h-3.5 w-3.5" />
                               </Button>
                          </div>
                      </div>
                  ))}
                  
                  {/* Milestones & Tribes mixed in? Or separate? 
                      Plan said remove boxes. Let's append Milestones to the end of carousel if needed 
                      or keep them subtle. For 'Action Carousel', let's focus on People for now.
                  */}
              </div>
          ) : (
             <div className="flex flex-col items-center justify-center py-6 opacity-50">
                 <Flower2 className="h-12 w-12 text-emerald-500 mb-2" />
                 <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Garden is Blooming</p>
             </div>
          )}
          
        </CardContent>
      </Card>

      {/* Log Interaction Modal (For direct action buttons) */}
      {selectedContact && (
        <LogInteractionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          contact={{
            id: selectedContact.id,
            name: selectedContact.name,
            initials: getInitials(selectedContact.name.split(' ')[0], selectedContact.name.split(' ')[1] || ''),
          }}
          initialNote={selectedContact.template}
          onSuccess={() => {
            onActionComplete?.();
          }}
        />
      )}

      {/* Shared Memory Modal (For clicking the person) */}
      {selectedContact && (
        <UnifiedActionHub 
            isOpen={isSharedMemoryOpen}
            onClose={() => setIsSharedMemoryOpen(false)}
            person={selectedContact as any}
            onAction={(type, note) => {
                setIsSharedMemoryOpen(false);
                // Open Action Modal logic
                const template = type === 'call' ? `Call with ${selectedContact.first_name}` :
                                 type === 'email' ? `Email to ${selectedContact.first_name}` :
                                 `Message to ${selectedContact.first_name}`;
                handleNurture(selectedContact.id, selectedContact.name, template);
            }}
        />
      )}
    </>
  );
}
