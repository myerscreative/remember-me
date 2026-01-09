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
  const [nextGoal, setNextGoal] = useState(''); // New state
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
        nextGoalNote: nextGoal.trim() || null, // Insert next goal
      });

      if (result.success) {
        toast.success(`Nurtured ${tribe.memberCount} people in ${tribe.name}!`);
        onClose();
        setNotes('');
        setNextGoal(''); // Clear nextGoal after successful submission
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
      <DialogContent 
        className="sm:max-w-[425px]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Nurture Tribe: {tribe.name}</DialogTitle>
          <DialogDescription>
            Log an interaction for all {tribe.memberCount} members of this tribe.
            This will update their last contact date.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes / Message sent
            </Label>
            <Textarea
              id="notes"
              placeholder="e.g. Sent group update about the summer trip..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Next Goal */}
          <div className="grid gap-2">
             <Label htmlFor="nextGoal" className="text-sm font-medium">Next Goal (Strategy)</Label>
             <Textarea 
               id="nextGoal"
               value={nextGoal}
               onChange={(e) => setNextGoal(e.target.value)}
               placeholder="e.g. Follow up about the new role..."
               className="min-h-[60px] border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/20 focus:ring-indigo-500/20"
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
