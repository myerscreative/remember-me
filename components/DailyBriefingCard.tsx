'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coffee, Cake, Droplets, Heart, Sparkles, Star } from 'lucide-react';
import { DailyBriefing } from '@/app/actions/get-daily-briefing';
import LogInteractionModal from '@/components/relationship-garden/LogInteractionModal';
import { getInitials } from '@/lib/utils/contact-helpers';

interface DailyBriefingCardProps {
  briefing: DailyBriefing;
  onActionComplete?: () => void;
}

export function DailyBriefingCard({ briefing, onActionComplete }: DailyBriefingCardProps) {
  const [selectedContact, setSelectedContact] = useState<{ id: string, name: string, template: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { milestones, thirstyTribes, priorityNurtures } = briefing;
  
  const totalActions = milestones.length + thirstyTribes.length + priorityNurtures.length;

  if (totalActions === 0) return null;

  const handleNurture = (id: string, name: string, template: string) => {
    setSelectedContact({ id, name, template });
    setIsModalOpen(true);
  };

  return (
    <>
      <Card className="border-2 border-[#38BDF8] bg-[#0F172A] shadow-[0_0_20px_rgba(56,189,248,0.1)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Coffee className="h-24 w-24 text-[#38BDF8]" />
        </div>
        
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#38BDF8] flex items-center gap-2 font-black uppercase text-lg tracking-tighter">
              <Sparkles className="h-5 w-5" />
              Morning Briefing
            </CardTitle>
            <Badge className="bg-[#38BDF8] text-[#0F172A] font-black rounded-none">
              {totalActions} ACTIONS
            </Badge>
          </div>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-tight mt-1">
            Good morning! You have {milestones.length} milestones today and {thirstyTribes.length} tribes that need water.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-2">
          {/* Milestones Sections */}
          {milestones.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Cake className="h-3 w-3" /> Today&apos;s Milestones
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {milestones.map((m) => (
                  <div key={m.contactId} className="flex items-center justify-between p-2 bg-[#1E293B] border border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-white text-xs font-bold uppercase">{m.contactName}</span>
                      <span className="text-[#FF4D4D] text-[10px] font-black">{m.label.toUpperCase()}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-[10px] font-black uppercase border-[#38BDF8] text-[#38BDF8] hover:bg-[#38BDF8] hover:text-[#0F172A] rounded-none"
                      onClick={() => handleNurture(m.contactId, m.contactName, `Happy ${m.label}, ${m.contactName.split(' ')[0]}! Hope you have a wonderful day! 🎂`)}
                    >
                      Celebrate
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tribes Sections */}
          {thirstyTribes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Droplets className="h-3 w-3" /> Thirsty Tribes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {thirstyTribes.map((t) => (
                  <div key={t.name} className="flex items-center justify-between p-2 bg-[#1E293B] border border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-white text-xs font-bold uppercase">{t.name}</span>
                      <span className="text-[#38BDF8] text-[10px] font-black">{t.maxDaysSince}D OVERDUE</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-[10px] font-black uppercase border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black rounded-none"
                      onClick={() => handleNurture('tribe', t.name, `Checking in with the ${t.name} crew! 🌱 Hope everyone is doing well.`)}
                    >
                      Water
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priority Nurtures Section */}
          {priorityNurtures.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Heart className="h-3 w-3" /> Priority Nurtures
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {priorityNurtures.map((p) => (
                  <div key={p.id} className="flex flex-col gap-2 p-2 bg-[#1E293B] border border-slate-800">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white text-xs font-bold uppercase truncate">{p.name}</span>
                        {p.importance === 'high' && <Star className="h-2 w-2 text-red-500" fill="currentColor" />}
                      </div>
                      <span className="text-rose-400 text-[10px] font-black truncate">FADING FROM GARDEN</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-[10px] font-black uppercase border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white rounded-none w-full"
                      onClick={() => handleNurture(p.id, p.name, `Thinking of you, ${p.first_name}! It's been a while since we caught up. Hope you're doing well! ✨`)}
                    >
                      Reconnect
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
    </>
  );
}
