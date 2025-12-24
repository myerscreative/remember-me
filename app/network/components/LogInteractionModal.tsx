'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label"; // Assuming Label exists or use standard label
import { useState } from "react";
import { SubTribe } from "./NetworkDataService";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
// Note: You'll need to implement the actual server action for bulk logging
import { logGroupInteraction } from "@/app/actions/log-group-interaction"; 

interface LogInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tribe: SubTribe | null;
}

export function LogInteractionModal({ isOpen, onClose, tribe }: LogInteractionModalProps) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!tribe) return;

    setIsSubmitting(true);
    try {
      // Assuming logGroupInteraction takes an array of ids and regular interaction fields
      const result = await logGroupInteraction({
        contactIds: tribe.members.map(m => m.id),
        type: 'text', // Default to text/message for "Nurture"
        note: notes || `Nurtured tribe: ${tribe.name}`,
      });

      if (result.success) {
        toast.success(`Nurtured ${tribe.memberCount} people in ${tribe.name}!`);
        onClose();
        setNotes('');
      } else {
        toast.error('Failed to log interaction');
      }
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!tribe) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nurture Tribe: {tribe.name}</DialogTitle>
          <DialogDescription>
            Log an interaction for all {tribe.memberCount} members of this tribe.
            This will update their last contact date.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes / Message sent
            </label>
            <Textarea
              id="notes"
              placeholder="e.g. Sent group update about the summer trip..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log Interaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
