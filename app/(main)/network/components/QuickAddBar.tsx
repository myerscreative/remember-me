'use client';

import { useState, useRef } from 'react';
import { UserPlus, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { addContact } from '@/app/actions/add-contact';
import { toast } from 'sonner';

export function QuickAddBar() {
  const [name, setName] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await addContact(name);
      
      if (result.success) {
        toast.success('Seed planted!', {
          description: `Added ${name} to your garden.`
        });
        setName('');
        inputRef.current?.blur();
      } else {
        toast.error('Failed to add contact', {
          description: result.error
        });
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
      setName('');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4">
      <div 
        className={`relative flex items-center bg-white dark:bg-slate-800/80 rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden ${
          isFocused 
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 dark:ring-indigo-500/30' 
            : 'border-gray-200 dark:border-slate-700/60 hover:border-gray-300 dark:hover:border-slate-600'
        }`}
      >
        <div className="pl-4 pr-2 flex items-center justify-center text-gray-400">
          <UserPlus className="w-5 h-5 shrink-0" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Quick add.. (e.g., Sarah Jenkins)"
          className="flex-1 bg-transparent border-none focus:ring-0 py-4 px-2 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-[16px]"
          disabled={isSubmitting}
        />

        <AnimatePresence>
          {name.trim() && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="pr-2"
            >
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="p-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mx-2 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {isFocused && !name && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400"
          >
            Press <kbd className="px-1.5 py-0.5 rounded-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-mono mx-1">Enter</kbd> to add instantly. You can fill out their story later.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
