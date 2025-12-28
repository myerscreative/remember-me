'use client';

import { useState, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, Check, MessageSquare } from 'lucide-react';
import { generateReconnectionScript } from '@/lib/ai/scriptGenerator';
import toast from 'react-hot-toast';

interface ReachOutPanelProps {
  isOpen: boolean;
  onClose: () => void;
  contact: {
    name: string;
    deep_lore?: string | null;
    why_stay_in_contact?: string | null;
    shared_memories?: Array<{ content: string }> | null;
    story?: {
        whyStayInContact?: string | null;
    };
  };
}

export function ReachOutPanel({ isOpen, onClose, contact }: ReachOutPanelProps) {
  const [script, setScript] = useState('');
  const [copied, setCopied] = useState(false);
  const [side, setSide] = useState<'right' | 'bottom'>('right');

  useEffect(() => {
    // Determine side based on screen width
    const handleResize = () => {
      setSide(window.innerWidth < 768 ? 'bottom' : 'right');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const latestMemory = contact.shared_memories?.[0]?.content || contact.deep_lore || null;
      const purpose = contact.why_stay_in_contact || contact.story?.whyStayInContact || null;
      
      const generated = generateReconnectionScript(
        contact.name, 
        latestMemory, 
        purpose
      );
      setScript(generated);
      setCopied(false);
    }
  }, [isOpen, contact]);

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side={side} 
        className={cn(
            "w-full border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-0 flex flex-col",
            side === 'right' ? "sm:max-w-md h-full" : "h-[70vh] rounded-t-[2rem]"
        )}
      >
        <div className="flex flex-col h-full">
           <SheetHeader className="p-6 border-b border-slate-200 dark:border-slate-800">
             <SheetTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 text-left">
               <Sparkles className="w-5 h-5 text-indigo-500" />
               Drafting a Reconnection based on Shared Memories
             </SheetTitle>
             <SheetDescription className="text-slate-500 dark:text-slate-400 text-left">
                Using your deepest lore with {contact.name.split(' ')[0]}.
             </SheetDescription>
           </SheetHeader>

           <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 relative group transition-all hover:border-indigo-500/30">
                 <div className="absolute -top-3 left-6 px-3 py-1 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 shadow-sm">
                    Reconnection Draft
                 </div>
                 
                 <p className="text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-medium mt-2">
                    {script || "Generating your script..."}
                 </p>
              </div>

              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Why this script?</h4>
                 <div className="grid gap-3">
                    <div className="flex gap-3 text-sm">
                       <div className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900/50">
                          <Check className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                       </div>
                       <p className="text-slate-600 dark:text-slate-400">Mentions your latest shared memory to spark warmth.</p>
                    </div>
                    <div className="flex gap-3 text-sm">
                       <div className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900/50">
                          <Check className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                       </div>
                       <p className="text-slate-600 dark:text-slate-400">Focuses on your personal reason for staying in contact.</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="p-6 border-t border-slate-200 dark:border-slate-800 mt-auto bg-slate-50/50 dark:bg-slate-900/30">
              <Button 
                onClick={handleCopy}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 h-12 rounded-xl text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-5 w-5" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
              <p className="text-center text-[11px] text-slate-400 mt-4">
                 Open your favorite messaging app and paste this draft.
              </p>
           </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
