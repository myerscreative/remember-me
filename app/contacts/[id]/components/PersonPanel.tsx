'use client';

import { useState, useEffect } from 'react';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MessageSquare, Star, User, IdCard, Loader2 } from 'lucide-react';
import { InteractionLogger } from './InteractionLogger';
import { updatePersonImportance } from '@/app/actions/update-person-importance';
import { updatePersonFrequency } from '@/app/actions/update-person-frequency';
import toast from 'react-hot-toast';

interface PersonPanelProps {
  contact: any;
  onFrequencyChange?: (days: number) => void;
  onImportanceChange?: (importance: 'high' | 'medium' | 'low') => void;
}

export function PersonPanel({ contact, onFrequencyChange, onImportanceChange }: PersonPanelProps) {
  const [importance, setImportance] = useState<'high' | 'medium' | 'low'>(contact.importance || 'medium');
  const [frequency, setFrequency] = useState<number>(contact.target_frequency_days || 30);
  const [isUpdating, setIsUpdating] = useState(false);

  // Calculate health status
  const lastContactDate = contact.last_interaction_date ? new Date(contact.last_interaction_date) : null;
  const daysSinceContact = lastContactDate 
    ? Math.floor((new Date().getTime() - lastContactDate.getTime()) / (1000 * 3600 * 24))
    : Infinity;
  
  const isOverdue = daysSinceContact > frequency;
  const isHealthy = daysSinceContact <= frequency * 0.5; // Green if contacted recently
  
  const healthColor = isOverdue 
    ? '#ef4444' // red-500
    : isHealthy 
      ? '#10b981' // emerald-500
      : '#f59e0b'; // amber-500

  const handleImportanceUpdate = async (newImportance: 'high' | 'medium' | 'low') => {
    setImportance(newImportance);
    setIsUpdating(true);
    try {
      const result = await updatePersonImportance(contact.id, newImportance);
      if (!result.success) throw new Error(result.error);
      if (onImportanceChange) onImportanceChange(newImportance);
      toast.success('Relationship level updated');
    } catch (error) {
      console.error('Failed to update importance:', error);
      toast.error('Failed to update relationship level');
      setImportance(contact.importance || 'medium'); // Revert
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFrequencyUpdate = async (days: number) => {
    setFrequency(days);
    setIsUpdating(true);
    try {
      const result = await updatePersonFrequency(contact.id, days);
      if (!result.success) throw new Error(result.error);
      if (onFrequencyChange) onFrequencyChange(days);
      toast.success('Cadence updated');
    } catch (error) {
      console.error('Failed to update frequency:', error);
      toast.error('Failed to update cadence');
      setFrequency(contact.target_frequency_days || 30); // Revert
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-full md:w-[420px] bg-[#0f1419] border-b md:border-b-0 md:border-r border-[#1a1f2e] flex flex-col overflow-y-auto flex-shrink-0 h-auto md:h-full">
      {/* HEADER */}
      <div className="p-6 md:p-7 text-center border-b border-[#1a1f2e]">
        <div className="relative inline-block mb-4">
          <div 
            className="w-24 h-24 md:w-[100px] md:h-[100px] rounded-full bg-[#2d3748] flex items-center justify-center text-3xl md:text-[40px] font-semibold text-white overflow-hidden border-[3px]"
            style={{ borderColor: healthColor }}
          >
            {contact.avatar_url ? (
              <img src={contact.avatar_url} alt={contact.name} className="w-full h-full object-cover" />
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
          <Button 
            variant="outline" 
            className="bg-[#1a1f2e] border-[#2d3748] hover:bg-[#2d3748] hover:text-white text-gray-300 h-auto py-3 flex flex-col gap-1.5 rounded-xl border-opacity-50"
          >
            <Phone className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-xs font-medium">Call</span>
          </Button>
          <Button 
            variant="outline" 
            className="bg-[#1a1f2e] border-[#2d3748] hover:bg-[#2d3748] hover:text-white text-gray-300 h-auto py-3 flex flex-col gap-1.5 rounded-xl border-opacity-50"
          >
            <Mail className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-xs font-medium">Email</span>
          </Button>
          <Button 
            variant="outline" 
            className="bg-[#1a1f2e] border-[#2d3748] hover:bg-[#2d3748] hover:text-white text-gray-300 h-auto py-3 flex flex-col gap-1.5 rounded-xl border-opacity-50"
          >
            <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-xs font-medium">Text</span>
          </Button>
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

        {/* Details Card */}
        <div className="bg-[#1a1f2e] rounded-xl p-4 md:p-[18px]">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-3">
            Details
          </h3>
          
          <div className="mb-4">
            <span className="block text-[13px] font-medium text-gray-300 mb-2.5">Relationship Level</span>
            <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => handleImportanceUpdate('high')}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-[10px] border-2 transition-all",
                    importance === 'high' 
                      ? "bg-[#3b4a6b] border-[#93c5fd] text-[#93c5fd]" 
                      : "bg-[#0f1419] border-[#2d3748] text-[#94a3b8] hover:border-[#7c3aed]"
                  )}
                >
                  <Star className={cn("w-5 h-5 mb-1", importance === 'high' ? "fill-current" : "")} />
                  <span className="text-[9px] font-bold uppercase tracking-wide">Favorites</span>
                </button>
                
                <button 
                  onClick={() => handleImportanceUpdate('medium')}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-[10px] border-2 transition-all",
                    importance === 'medium' 
                      ? "bg-[#3b4a6b] border-[#93c5fd] text-[#93c5fd]" 
                      : "bg-[#0f1419] border-[#2d3748] text-[#94a3b8] hover:border-[#7c3aed]"
                  )}
                >
                  <User className="w-5 h-5 mb-1" />
                  <span className="text-[9px] font-bold uppercase tracking-wide">Friends</span>
                </button>
                
                <button 
                  onClick={() => handleImportanceUpdate('low')}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-[10px] border-2 transition-all",
                    importance === 'low' 
                      ? "bg-[#3b4a6b] border-[#93c5fd] text-[#93c5fd]" 
                      : "bg-[#0f1419] border-[#2d3748] text-[#94a3b8] hover:border-[#7c3aed]"
                  )}
                >
                  <IdCard className="w-5 h-5 mb-1" />
                  <span className="text-[9px] font-bold uppercase tracking-wide">Contacts</span>
                </button>
            </div>
          </div>

          <div>
            <span className="block text-[13px] font-medium text-gray-300 mb-2.5">Contact Cadence</span>
            <select 
              value={frequency}
              onChange={(e) => handleFrequencyUpdate(Number(e.target.value))}
              className="w-full bg-[#0f1419] border-2 border-[#2d3748] rounded-[10px] p-3 text-sm text-gray-200 focus:outline-none focus:border-[#7c3aed] cursor-pointer appearance-none"
            >
              <option value="7">Weekly (7 days)</option>
              <option value="14">Bi-Weekly (14 days)</option>
              <option value="30">Monthly (30 days)</option>
              <option value="90">Quarterly (90 days)</option>
              <option value="180">Semi-Annually (180 days)</option>
              <option value="365">Yearly (365 days)</option>
            </select>
          </div>
        </div>

      </div>
    </div>
  );
}
