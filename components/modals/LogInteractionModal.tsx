'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Phone, Mail, MessageSquare, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface LogInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  initialType: 'call' | 'email' | 'text' | 'meeting';
}

export function LogInteractionModal({ isOpen, onClose, contactId, initialType }: LogInteractionModalProps) {
  const [type, setType] = useState(initialType);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      // Insert interaction
      const { error: insertError } = await (supabase as any)
        .from('interactions')
        .insert({
          user_id: user.id,
          person_id: contactId,
          type,
          date: new Date(date).toISOString(),
          notes: notes.trim() || null
        });

      if (insertError) {
        console.error("Error inserting interaction:", insertError);
        throw new Error(insertError.message);
      }

      // Update person's last_interaction_date and last_contact
      // We update both to ensure compatibility with different parts of the app
      const { error: updateError } = await (supabase as any)
        .from('persons')
        .update({
             last_interaction_date: new Date(date).toISOString(),
             last_contact: new Date(date).toISOString(),
             last_contacted_date: date // Store YYYY-MM-DD string if that's the format for this column
        })
        .eq('id', contactId);
        
      if (updateError) {
        console.warn("Failed to update person last_contact:", updateError);
        // We don't throw here to avoid blocking the modal close if interaction was saved
      }

      toast.success("Interaction logged");
      onClose();
    } catch (error) {
       console.error("Error logging interaction:", error);
       toast.error("Failed to log interaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a1d24] rounded-xl w-full max-w-md shadow-lg border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
               {type === 'call' && <Phone className="w-4 h-4" />}
               {type === 'email' && <Mail className="w-4 h-4" />}
               {type === 'text' && <MessageSquare className="w-4 h-4" />}
               {type === 'meeting' && <Calendar className="w-4 h-4" />}
            </span>
            Log Interaction
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          
          {/* Type & Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#252931] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="text">Text</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
               <label className="text-xs font-medium text-gray-500">Date</label>
               <input 
                 type="date"
                 value={date}
                 onChange={(e) => setDate(e.target.value)}
                 className="w-full h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#252931] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
               />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
             <label className="text-xs font-medium text-gray-500">Notes (Optional)</label>
             <textarea 
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               placeholder="What did you talk about?"
               className="w-full min-h-[100px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#252931] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
             />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
           <Button variant="ghost" onClick={onClose}>Cancel</Button>
           <Button onClick={handleSubmit} disabled={isSubmitting}>
             {isSubmitting ? 'Saving...' : 'Save Log'}
           </Button>
        </div>

      </div>
    </div>
  );
}
