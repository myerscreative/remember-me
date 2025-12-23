'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { INTERACTION_TYPES, type InteractionType } from '@/lib/relationship-health';
import { logInteraction } from '@/app/actions/logInteraction';
import toast from 'react-hot-toast';

interface LogInteractionModalProps {
  contact: {
    id: string;
    name: string;
    initials: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LogInteractionModal({ 
  contact, 
  isOpen, 
  onClose,
  onSuccess 
}: LogInteractionModalProps) {
  const [selectedType, setSelectedType] = useState<InteractionType>('in-person');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await logInteraction({
        personId: contact.id,
        type: selectedType,
        note: note.trim() || undefined,
      });

      if (result.success) {
        toast.success(`Logged interaction with ${contact.name}!`);
        setNote('');
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || 'Failed to log interaction');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-semibold">
              {contact.initials}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Log Connection
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                with {contact.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Interaction Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              How did you connect?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {INTERACTION_TYPES.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedType(value)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    selectedType === value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="text-2xl mb-1">{emoji}</div>
                  <div className={`text-xs font-medium ${
                    selectedType === value 
                      ? 'text-emerald-700 dark:text-emerald-400' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Story / Notes <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you talk about? Any memorable moments?"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Logging...
              </>
            ) : (
              <>
                🌱 Log Connection
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
