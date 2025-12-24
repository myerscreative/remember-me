'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radar, Cake, Rocket, Calendar } from 'lucide-react';
import { getMilestones, type Milestone } from '@/lib/dashboard/dashboardUtils';
import LogInteractionModal from '@/components/relationship-garden/LogInteractionModal';
import { getInitials } from '@/lib/utils/contact-helpers';

export function MilestoneRadar() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadMilestones() {
      const { data, error } = await getMilestones();
      if (!error && data) {
        setMilestones(data);
      }
      setIsLoading(false);
    }
    loadMilestones();
  }, []);

  const getIcon = (type: Milestone['type']) => {
    switch (type) {
      case 'birthday': return <Cake className="h-4 w-4 text-pink-500" />;
      case 'professional': return <Rocket className="h-4 w-4 text-blue-500" />;
      case 'anniversary': return <Calendar className="h-4 w-4 text-orange-500" />;
      default: return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTemplate = (milestone: Milestone) => {
    const firstName = milestone.contactName.split(' ')[0];
    switch (milestone.type) {
      case 'birthday': return `Happy Birthday, ${firstName}! Hope it's a great one. 🎂`;
      case 'professional': return `Congrats on the milestone, ${firstName}! 🚀`;
      case 'anniversary': return `Happy anniversary, ${firstName}! Celebrating with you. 🥂`;
      default: return `Happy Celebration! Thinking of you on this special day, ${firstName}! ✨`;
    }
  };

  return (
    <>
      <Card className="bg-[#0F172A] border-[#1E293B] shadow-none rounded-none">
        <CardHeader className="border-b border-[#1E293B] pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-400 flex items-center gap-2 uppercase font-black tracking-tighter text-sm">
              <Radar className="h-4 w-4" />
              Milestone Radar
            </CardTitle>
            <Badge variant="outline" className="border-slate-700 text-slate-500 font-black rounded-none">NEXT 30D</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 px-0">
          <div className="divide-y divide-[#1E293B]">
            {milestones.length > 0 ? (
              milestones.map((milestone, idx) => {
                const isToday = milestone.daysRemaining === 0;
                return (
                  <div key={`${milestone.contactId}-${idx}`} className="p-4 flex items-center justify-between group hover:bg-[#1E293B]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center">
                         {getIcon(milestone.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-slate-300 font-bold text-xs uppercase tracking-tight">{milestone.contactName}</p>
                          {milestone.isThirsty && (
                            <span title="This relationship needs attention! 🌱" className="text-amber-500 animate-pulse">
                              ⚠️
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold uppercase mt-0.5 flex items-center gap-1.5">
                          <span className="text-slate-500">{milestone.label}</span>
                          <span className="text-slate-600">•</span>
                          <span style={{ color: isToday ? '#FF4D4D' : '#38BDF8' }}>
                            {isToday ? 'TODAY' : `IN ${milestone.daysRemaining}D`}
                          </span>
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedMilestone(milestone);
                        setIsModalOpen(true);
                      }}
                      className="h-8 w-20 bg-[#1E293B] hover:bg-emerald-500 hover:text-[#0F172A] flex items-center justify-center transition-all border border-[#334155] rounded-none text-[10px] font-black uppercase"
                    >
                      Nurture
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                {isLoading ? 'Scanning Radar...' : 'Any Important Date or Birthday that is attached to a contact shows here.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedMilestone && (
        <LogInteractionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          contact={{
            id: selectedMilestone.contactId,
            name: selectedMilestone.contactName,
            initials: getInitials(selectedMilestone.contactName.split(' ')[0], selectedMilestone.contactName.split(' ')[1] || '')
          }}
          initialNote={getTemplate(selectedMilestone)}
          onSuccess={() => {
            // Optional: refresh milestones if needed
          }}
        />
      )}
    </>
  );
}
