
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, X, ArrowRight, Merge, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import { type Database } from '@/types/database.types';

type Person = Database['public']['Tables']['persons']['Row'];

interface MergeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  keeper: Person;
  duplicate: Person;
  onSuccess: () => void;
}

export function MergeWizard({ isOpen, onClose, keeper, duplicate, onSuccess }: MergeWizardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState<'forward' | 'backward'>('forward'); // forward = merge dup INTO keeper

  // Which ID is the final "Master"?
  // If forward: keeper is Master.
  // If backward: duplicate is Master (swap roles).
  const finalMaster = selectedDirection === 'forward' ? keeper : duplicate;
  const finalVictim = selectedDirection === 'forward' ? duplicate : keeper;

  // We only allow choosing who is the MASTER record. 
  // The merge logic in PostgreSQL will non-destructively fill in blanks and append notes.
  // It effectively PRESERVES the Master's core identity (name, etc) unless fields are missing.
  // So "swap" is the primary way to choose "which name/job title do I want?" -> Choose the record that has it correct.

  const handleMerge = async () => {
    if (!confirm(`Are you sure you want to merge these contacts? matches will be combined and ${finalVictim.name} will be deleted.`)) return;

    setIsProcessing(true);
    const supabase = createClient();

    try {
      // Logic: keeper_id is the one that STAYS. duplicate_id is the one that GOES.
      const { error } = await (supabase as any).rpc('merge_contacts', {
        keeper_id: finalMaster.id,
        duplicate_id: finalVictim.id
      });

      if (error) throw error;

      toast.success("Contacts merged successfully");
      onSuccess();
      onClose();
    } catch (e: any) {
      console.error("Merge failed", e);
      toast.error(`Merge failed: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="w-5 h-5 text-indigo-600" />
            Merge Contacts
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <div className="bg-amber-50 text-amber-800 p-4 rounded-lg mb-6 flex items-start gap-3 text-sm">
             <AlertTriangle className="w-5 h-5 shrink-0" />
             <p>
               Select the <strong>Primary Record</strong> you want to keep. 
               The other record will be deleted, but its notes, interactions, and missing info will be moved to the Primary record first.
             </p>
          </div>

          <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-stretch">
            {/* Left Option (Keeper) */}
            <div 
              className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedDirection === 'forward' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300'}`}
              onClick={() => setSelectedDirection('forward')}
            >
              <div className="flex justify-between items-start mb-4">
                 <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${selectedDirection === 'forward' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {selectedDirection === 'forward' ? 'Primary (Keep)' : 'Duplicate (Merge From)'}
                 </span>
                 {selectedDirection === 'forward' && <Check className="w-5 h-5 text-indigo-600" />}
              </div>
              <ContactCard contact={keeper} />
            </div>

            {/* Center / Action */}
            <div className="flex flex-col items-center justify-center text-gray-400">
               {selectedDirection === 'forward' ? (
                 <div className="flex flex-col items-center gap-2">
                   <span className="text-xs font-medium text-indigo-600">Merging Into</span>
                   <ArrowRight className="w-8 h-8 text-indigo-600" />
                 </div>
               ) : (
                 <div className="flex flex-col items-center gap-2">
                   <ArrowRight className="w-8 h-8 text-indigo-600 rotate-180" />
                   <span className="text-xs font-medium text-indigo-600">Merging Into</span>
                 </div>
               )}
            </div>

            {/* Right Option (Duplicate) */}
            <div 
              className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedDirection === 'backward' ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300'}`}
              onClick={() => setSelectedDirection('backward')}
            >
              <div className="flex justify-between items-start mb-4">
                 <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${selectedDirection === 'backward' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {selectedDirection === 'backward' ? 'Primary (Keep)' : 'Duplicate (Merge From)'}
                 </span>
                 {selectedDirection === 'backward' && <Check className="w-5 h-5 text-indigo-600" />}
              </div>
              <ContactCard contact={duplicate} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleMerge} disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-700">
            {isProcessing ? 'Merging...' : 'Confirm Merge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContactCard({ contact }: { contact: Person }) {
  return (
    <div className="space-y-4">
       <div className="flex items-center gap-3">
          {contact.photo_url ? (
            <img src={contact.photo_url} alt={contact.name} className="w-12 h-12 rounded-full object-cover bg-gray-200" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
               {contact.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-bold text-gray-900">{contact.name}</div>
            <div className="text-xs text-gray-500">{contact.job_title || 'No Job Title'}</div>
          </div>
       </div>
       
       <div className="space-y-2 text-sm">
         <InfoRow label="Email" value={contact.email} />
         <InfoRow label="Phone" value={contact.phone} />
         <InfoRow label="Last Contact" value={contact.last_contact ? new Date(contact.last_contact).toLocaleDateString() : null} />
         <InfoRow label="Interactions" value={contact.interaction_count?.toString()} />
         <div className="pt-2">
            <span className="text-xs text-gray-500 block mb-1">Preview Notes:</span>
            <div className="bg-white p-2 rounded border border-gray-100 text-xs text-gray-600 line-clamp-3">
              {contact.notes || "No notes"}
            </div>
         </div>
       </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string, value?: string | null }) {
  return (
     <div className="flex justify-between py-1 border-b border-gray-100/50 last:border-0">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-900 text-right truncate max-w-[150px]" title={value || ''}>
          {value || <span className="text-gray-300 italic">Empty</span>}
        </span>
     </div>
  );
}
