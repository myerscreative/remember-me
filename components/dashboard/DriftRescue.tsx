'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getDriftingContacts, rescueContact, DriftingContact } from '@/app/actions/drift-rescue-actions';
import { toast } from 'react-hot-toast';

interface DriftRescueProps {
  initialContacts?: DriftingContact[];
  defaultOpen?: boolean;
}

export function DriftRescue({ initialContacts, defaultOpen = false }: DriftRescueProps) {
  const [contacts, setContacts] = useState<DriftingContact[]>(initialContacts || []);
  const [loading, setLoading] = useState(false);
  const [isRescuing, setIsRescuing] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const fetchContacts = async () => {
    if (initialContacts && initialContacts.length > 0) return;
    setLoading(true);
    try {
      const data = await getDriftingContacts();
      setContacts(data);
    } catch {
      console.error("Failed to load drift rescue contacts");
      toast.error("Failed to load rescue candidates");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (contact: DriftingContact) => {
    setIsRescuing(contact.id);
    try {
      await rescueContact(contact.id, contact.suggestedHook);
      setCompleted(prev => new Set(prev).add(contact.id));
      toast.success(`Rescued ${contact.name}!`, {
          icon: '✨',
          style: {
              background: '#4f46e5',
              color: '#fff',
              fontWeight: 'bold'
          }
      });
    } catch {
      toast.error("Rescue attempt failed");
    } finally {
      setIsRescuing(null);
    }
  };

  const handleSkip = (contactId: string) => {
    setContacts(prev => {
        const item = prev.find(c => c.id === contactId);
        if (!item) return prev;
        const filtered = prev.filter(c => c.id !== contactId);
        return [...filtered, item]; // Move to bottom
    });
  };

  const activeContacts = contacts.filter(c => !completed.has(c.id));

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (open) fetchContacts();
    }}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-full transition-all group">
          <Heart className="h-5 w-5 text-rose-500 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest hidden sm:inline">
            {initialContacts ? "Start Rescue" : "Drift Rescue"}
          </span>
          {activeContacts.length > 0 && (
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-0">
        <div className="flex flex-col h-full">
            <SheetHeader className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-rose-500/10 rounded-lg">
                        <Heart className="h-5 w-5 text-rose-500" />
                    </div>
                    <SheetTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Relationship Rescue</SheetTitle>
                </div>
                <SheetDescription className="text-slate-500 font-medium">
                    {activeContacts.length} connections currently drifting. Send a &quot;Low-Stakes Ping&quot; to reset the decay timer.
                </SheetDescription>
            </SheetHeader>

            <div className="flex-1 p-5 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Scanning Shared Lore...</p>
                    </div>
                ) : activeContacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="p-6 bg-emerald-500/10 rounded-full mb-4">
                            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Garden is Nurtured</h3>
                        <p className="text-sm text-slate-500 max-w-xs mt-1">
                            No drifting contacts found. Your core relationships are currently stable.
                        </p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {activeContacts.map((contact, index) => (
                            <motion.div
                                key={contact.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <Card className="p-5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-lg font-black text-slate-900 dark:text-white leading-none mb-1">{contact.name}</h4>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                <Clock className="h-3 w-3" />
                                                Last interacted: {contact.lastInteractionDate ? new Date(contact.lastInteractionDate).toLocaleDateString() : 'Unknown'}
                                            </div>
                                        </div>
                                        <div className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 rounded text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-tighter border border-indigo-100 dark:border-indigo-800">
                                            {contact.memoryDensity} Shared Memories
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 mb-6 relative group">
                                        <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <p className="text-sm text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed">
                                            &quot;{contact.suggestedHook}&quot;
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button 
                                            disabled={isRescuing === contact.id}
                                            onClick={() => handleSend(contact)}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                                        >
                                            {isRescuing === contact.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                                            Send & Rescue
                                        </Button>
                                        <Button 
                                            variant="outline"
                                            onClick={() => handleSkip(contact.id)}
                                            className="border-slate-200 dark:border-slate-700 text-slate-500 font-black uppercase tracking-widest"
                                        >
                                            Skip
                                        </Button>
                                    </div>
                                    
                                    <div className="absolute top-0 right-0 h-full w-1 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                    AI generated hooks are optimized for resonance and zero-burden response.
                </p>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
