'use client';

import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, X, AlertCircle, RefreshCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { refineOutreachHook, savePivotedInteraction } from "@/app/actions/pivot-outreach";

interface PivotCardProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  originalHook: string;
  frictionScore: string;
}

interface AuditResult {
  diagnosis: string;
  optionA: { title: string; content: string };
  optionB: { title: string; content: string };
  contactName: string;
}

export function PivotCard({ 
  isOpen, 
  onOpenChange, 
  contactId, 
  originalHook,
  frictionScore
}: PivotCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [selectedContent, setSelectedContent] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen && contactId) {
      loadRefinement();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, contactId]);

  async function loadRefinement() {
    setIsLoading(true);
    try {
      const data = await refineOutreachHook(contactId, originalHook);
      setResult(data);
      setSelectedContent(data.optionA.content);
    } catch (error) {
      console.error("Failed to load refinement:", error);
      toast.error("Architect Intervention failed to load.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSend = async () => {
    setIsSending(true);
    try {
      await savePivotedInteraction(contactId, selectedContent);
      toast.success(`Success! Resonance restored with ${result?.contactName}.`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update timeline.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[100] transition-opacity duration-300 backdrop-blur-[2px]" />
        <Drawer.Content className="bg-slate-50 flex flex-col rounded-t-[32px] max-h-[92vh] fixed bottom-0 left-0 right-0 z-[101] outline-none border-t border-slate-200 shadow-2xl">
          <div className="p-6 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-slate-300 mb-8" />
            
            <div className="max-w-xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Human-First Pivot</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-black rounded uppercase tracking-widest border border-rose-200">
                        {frictionScore}
                      </span>
                      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        Intervention Required
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => onOpenChange(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="h-6 w-6 text-slate-400" />
                </button>
              </div>

              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <RefreshCcw className="h-8 w-8 text-indigo-600 animate-spin" />
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Auditing Social Friction...</p>
                </div>
              ) : result ? (
                <div className="space-y-6">
                  {/* Diagnosis */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Diagnosis</p>
                        <p className="text-slate-700 leading-relaxed font-medium">{result.diagnosis}</p>
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                      onClick={() => setSelectedContent(result.optionA.content)}
                      className={cn(
                        "p-5 rounded-2xl border-2 text-left transition-all duration-200 group relative",
                        selectedContent === result.optionA.content 
                          ? "bg-white border-indigo-600 shadow-xl shadow-indigo-100 ring-4 ring-indigo-50" 
                          : "bg-slate-100 border-transparent hover:border-slate-300"
                      )}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Option A: The Pivot</span>
                        {selectedContent === result.optionA.content && <div className="h-4 w-4 rounded-full bg-indigo-600 border-2 border-white shadow-sm" />}
                      </div>
                      <h3 className="font-bold text-slate-900 mb-2">{result.optionA.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed italic">&quot;{result.optionA.content}&quot;</p>
                    </button>

                    <button 
                      onClick={() => setSelectedContent(result.optionB.content)}
                      className={cn(
                        "p-5 rounded-2xl border-2 text-left transition-all duration-200 group relative",
                        selectedContent === result.optionB.content 
                          ? "bg-white border-indigo-600 shadow-xl shadow-indigo-100 ring-4 ring-indigo-50" 
                          : "bg-slate-100 border-transparent hover:border-slate-300"
                      )}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Option B: The Long-Game</span>
                        {selectedContent === result.optionB.content && <div className="h-4 w-4 rounded-full bg-indigo-600 border-2 border-white shadow-sm" />}
                      </div>
                      <h3 className="font-bold text-slate-900 mb-2">{result.optionB.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed italic">&quot;{result.optionB.content}&quot;</p>
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="pt-6 pb-10">
                    <Button 
                      onClick={handleSend}
                      disabled={isSending}
                      className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                    >
                      {isSending ? <RefreshCcw className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                      Replace & Send
                    </Button>
                    <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">
                      Updates timeline in Supabase to prevent relationship amnesia
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
