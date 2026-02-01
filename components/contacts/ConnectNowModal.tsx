'use client';

import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Person } from "@/types/database.types";
import { generateConversationStarters, ConversationStarter, formatLastContacted } from "@/lib/conversation-helpers";
import { MessageSquare, Mail, Phone, Heart, Sparkles, Copy, ExternalLink, ArrowRight } from "lucide-react";
import { useState, useMemo } from "react";
import { getInitialsFromFullName, getGradient } from "@/lib/utils/contact-helpers";
import toast from "react-hot-toast";
import { logHeaderInteraction } from '@/app/actions/log-header-interaction';
import { showNurtureToast } from '@/components/ui/nurture-toast';
import { DatePicker } from "@/components/ui/date-picker";

interface ConnectNowModalProps {
  person: Person;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectNowModal({ person, isOpen, onOpenChange }: ConnectNowModalProps) {
  const starters = useMemo(() => generateConversationStarters(person), [person]);
  const [selectedMethod, setSelectedMethod] = useState<'text' | 'email' | 'call' | 'whatsapp' | null>(null);
  const [quickNote, setQuickNote] = useState("");
  const [interactionDate, setInteractionDate] = useState<Date | undefined>(new Date());
  const [isLogging, setIsLogging] = useState(false);
  const router = useRouter();

  const handleCopyStarter = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };
  
  const handleUseStarter = (text: string) => {
      // Logic to open respective app with text if possible, for now copy + toast
      handleCopyStarter(text);
      // In a real app complexity, we might try to construct a `sms:` or `mailto:` link with body
      if (person.phone) {
           window.location.href = `sms:${person.phone}?body=${encodeURIComponent(text)}`;
      }
  };

  const handleLogInteraction = async (type: 'connection' | 'attempt') => {
    setIsLogging(true);
    try {
        const result = await logHeaderInteraction(person.id, type, quickNote, interactionDate?.toISOString());
        if (result.success) {
            if (type === 'connection') {
                showNurtureToast(person.name);
            } else {
                toast.success("Interaction logged");
            }
            setQuickNote("");
            setInteractionDate(new Date()); // Reset date to today
            onOpenChange(false); // Close modal
            router.refresh(); // Refresh client data
        } else {
            toast.error(result.error || "Failed to log interaction");
        }
    } catch (error) {
        toast.error("Something went wrong");
    } finally {
        setIsLogging(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md p-0 gap-0 bg-[#1a1a24] border-gray-800 text-white overflow-hidden flex flex-col max-h-[85vh]"
        showCloseButton={false} 
      >
        
        {/* Header */}
        <div className="p-5 border-b border-gray-800 bg-[#1a1a24] sticky top-0 z-10">
          <div className="w-10 h-1 bg-gray-700/30 rounded-full mx-auto mb-4" /> {/* Drag Handle visual */}
          <div className="flex items-center gap-3">
             <Avatar className="h-12 w-12 border border-gray-700">
                <AvatarImage src={person.photo_url || undefined} />
                <AvatarFallback className={cn("text-white font-medium", getGradient(person.name))}>
                   {getInitialsFromFullName(person.name)}
                </AvatarFallback>
             </Avatar>
             <div>
                <h3 className="font-semibold text-lg leading-tight text-white">{person.name}</h3>
                <p className="text-sm text-gray-400">
                    Last contacted: {formatLastContacted(person.last_interaction_date)}
                </p>
             </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
            
            {/* Contact Methods */}
            <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Choose how to connect</h4>
                <div className="grid grid-cols-2 gap-3">
                    <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#1e1e2d]/60 border border-gray-700/30 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all group">
                        <MessageSquare className="h-7 w-7 text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">Text</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#1e1e2d]/60 border border-gray-700/30 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all group">
                         <Mail className="h-7 w-7 text-purple-400 group-hover: scale-110 transition-transform" />
                         <span className="text-sm font-medium text-gray-300 group-hover:text-white">Email</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#1e1e2d]/60 border border-gray-700/30 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all group">
                         <Phone className="h-7 w-7 text-green-400 group-hover:scale-110 transition-transform" />
                         <span className="text-sm font-medium text-gray-300 group-hover:text-white">Call</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#1e1e2d]/60 border border-gray-700/30 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all group">
                         <Heart className="h-7 w-7 text-rose-400 group-hover:scale-110 transition-transform" />
                         <span className="text-sm font-medium text-gray-300 group-hover:text-white">WhatsApp</span>
                    </button>
                </div>
            </section>

            {/* AI Starters */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Conversation Starters</h4>
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI
                    </span>
                </div>
                
                <div className="space-y-3">
                    {starters.map((starter, i) => (
                        <div key={i} className="group p-4 rounded-xl bg-[#1e1e2d]/60 border border-gray-700/30 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all">
                             <p className="text-sm text-gray-200 leading-relaxed mb-2">
                                "{starter.text}"
                             </p>
                             <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                                <Sparkles className="w-3 h-3 opacity-50" />
                                {starter.context}
                             </div>
                             <div className="flex gap-2">
                                 <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleCopyStarter(starter.text)}
                                    className="flex-1 h-8 text-xs border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-500/20 bg-transparent"
                                 >
                                    Copy
                                 </Button>
                                 <Button 
                                    size="sm"
                                    onClick={() => handleUseStarter(starter.text)}
                                    className="flex-1 h-8 text-xs bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0"
                                 >
                                    Use This <ArrowRight className="w-3 h-3 ml-1" />
                                 </Button>
                             </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Connection Logging */}
            <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Log Interaction</h4>
                <div className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-gray-400 ml-1">Date</label>
                        <DatePicker 
                            date={interactionDate} 
                            setDate={setInteractionDate} 
                            className="w-full bg-[#1e1e2d]/60 border-gray-700/30 text-gray-200 hover:bg-[#1e1e2d]/80 hover:text-white"
                        />
                    </div>

                    {/* Note Input */}
                    <input
                        type="text"
                        placeholder="Add a quick note..."
                        value={quickNote}
                        onChange={(e) => setQuickNote(e.target.value)}
                        className="w-full bg-[#1e1e2d]/60 border border-gray-700/30 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            onClick={() => handleLogInteraction('attempt')}
                            disabled={isLogging}
                            className="h-10 border-amber-500/20 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30"
                        >
                            Log Attempt
                        </Button>
                        <Button
                            onClick={() => handleLogInteraction('connection')}
                            disabled={isLogging}
                            className="h-10 bg-indigo-600 hover:bg-indigo-500 text-white border-0"
                        >
                            Log Connection
                        </Button>
                    </div>
                </div>
            </section>
        </div>
        
        <div className="p-4 border-t border-gray-800 bg-[#1a1a24]">
             <Button 
                variant="ghost" 
                className="w-full text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={() => onOpenChange(false)}
             >
                Close
             </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}

