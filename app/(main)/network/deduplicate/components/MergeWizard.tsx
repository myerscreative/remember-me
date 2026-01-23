'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Merge, AlertTriangle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import { type Database } from '@/types/database.types';

type Person = Database['public']['Tables']['persons']['Row'];

interface MergeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  keeper: Person;
  duplicates: Person[]; // Now accepts ALL duplicates
  onSuccess: () => void;
}

export function MergeWizard({ isOpen, onClose, keeper, duplicates, onSuccess }: MergeWizardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedKeeperId, setSelectedKeeperId] = useState<string>(keeper.id);

  // All contacts in this group
  const allContacts = [keeper, ...duplicates];
  
  // The selected keeper
  const finalMaster = allContacts.find(c => c.id === selectedKeeperId) || keeper;
  // All others will be merged into the master and deleted
  const finalVictims = allContacts.filter(c => c.id !== selectedKeeperId);

  const handleMerge = async () => {
    if (!confirm(`Are you sure you want to merge ${allContacts.length} contacts? All data will be combined into "${finalMaster.name}" and the other ${finalVictims.length} record(s) will be deleted.`)) return;

    setIsProcessing(true);
    const supabase = createClient();

    try {
      // Get current user ID for security verification
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Merge each victim into the master, one at a time
      for (const victim of finalVictims) {
        const { error } = await (supabase as any).rpc('merge_contacts', {
          keeper_id: finalMaster.id,
          duplicate_id: victim.id,
          p_user_id: user.id
        });

        if (error) throw error;
      }

      toast.success(`Successfully merged ${allContacts.length} contacts into "${finalMaster.name}"`);
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
            Merge {allContacts.length} Contacts
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 p-4 rounded-lg mb-6 flex items-start gap-3 text-sm">
             <AlertTriangle className="w-5 h-5 shrink-0" />
             <p>
               Select the <strong>Primary Record</strong> you want to keep. 
               All other records will be merged into it - their notes, interactions, and any missing info will be copied first, then they will be deleted.
             </p>
          </div>

          {/* All contacts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allContacts.map((contact) => (
              <div 
                key={contact.id}
                onClick={() => setSelectedKeeperId(contact.id)}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  selectedKeeperId === contact.id 
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                   <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                     selectedKeeperId === contact.id 
                       ? 'bg-indigo-600 text-white' 
                       : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                   }`}>
                      {selectedKeeperId === contact.id ? 'PRIMARY (Keep)' : 'Will Merge'}
                   </span>
                   {selectedKeeperId === contact.id && <Check className="w-5 h-5 text-indigo-600" />}
                </div>
                <ContactCard contact={contact} />
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Merging <strong className="text-gray-900 dark:text-white">{finalVictims.length}</strong> contact(s) into
            </div>
            <div className="text-lg font-bold text-indigo-600 mt-1">
              {finalMaster.name}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleMerge} disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-700">
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Merging...
              </>
            ) : (
              `Merge ${allContacts.length} Contacts`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContactCard({ contact }: { contact: Person }) {
  return (
    <div className="space-y-3">
       <div className="flex items-center gap-3">
          {contact.photo_url ? (
            <img src={contact.photo_url} alt={contact.name} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-sm">
               {contact.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-bold text-gray-900 dark:text-white truncate">{contact.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{contact.job_title || 'No Job Title'}</div>
          </div>
       </div>
       
       <div className="space-y-1 text-xs">
         <InfoRow label="Email" value={contact.email} />
         <InfoRow label="Phone" value={contact.phone} />
         <InfoRow label="Company" value={contact.company} />
         <InfoRow label="Last Contact" value={contact.last_contact ? new Date(contact.last_contact).toLocaleDateString() : null} />
         <InfoRow label="Interactions" value={contact.interaction_count?.toString()} />
       </div>
       
       {contact.notes && (
         <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="text-[10px] text-gray-400 mb-1">Notes Preview:</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {contact.notes}
            </div>
         </div>
       )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string, value?: string | null }) {
  if (!value) return null; // Don't show empty rows - cleaner UI
  return (
     <div className="flex justify-between py-0.5">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white text-right truncate max-w-[120px]" title={value}>
          {value}
        </span>
     </div>
  );
}
