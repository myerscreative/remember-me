"use client";

import { Drawer } from "vaul";
import { MessageCircle, Phone, Sparkles } from "lucide-react";
import { NurtureContext } from "@/types/nurture";
import { Button } from "@/components/ui/button";

interface NurtureDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data: NurtureContext;
  onAction?: (channel: string) => void;
}

export function NurtureDrawer({ isOpen, onOpenChange, data, onAction }: NurtureDrawerProps) {
  const handleAction = (channel: string) => {
    onAction?.(channel);
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 backdrop-blur-sm" />
        <Drawer.Content className="bg-slate-900 flex flex-col rounded-t-3xl h-fit mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none border-t border-slate-700 shadow-2xl">
          <div className="p-6 pb-8 space-y-6 flex-1">
            {/* Handle/Grabber */}
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-2" />
            
            {/* Header */}
            <header className="text-center relative">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
                Nurture {data.name} <Sparkles size={18} className="text-indigo-400" />
              </h2>
            </header>

            <div className="space-y-4">
              {/* The Lore Spark */}
              <section className="bg-indigo-950/30 border border-indigo-500/30 p-4 rounded-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                <h3 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-2 flex items-center gap-1.5 z-10 relative">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                  Remember Why
                </h3>
                <p className="text-slate-200 italic font-serif leading-relaxed z-10 relative px-1">&quot;{data.whyStayInContact}&quot;</p>
              </section>

              {/* Suggested Starter */}
              {data.lastSharedMemory && (
                <section className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Conversation Starter
                  </h3>
                  <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-slate-300 font-medium">
                    &quot;Hey! Was just thinking about {data.lastSharedMemory.content}...&quot;
                  </div>
                </section>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button 
                onClick={() => handleAction('Message')}
                className="h-14 flex items-center justify-center gap-2 bg-linear-to-br from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/30 w-full text-base"
              >
                <MessageCircle size={20} />
                Message
              </Button>
              <Button 
                onClick={() => handleAction('Call')}
                variant="outline"
                className="h-14 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border-slate-700 rounded-xl font-bold transition-all w-full text-base"
              >
                <Phone size={20} className="text-slate-300" />
                Call
              </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
