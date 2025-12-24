'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Send, Sparkles, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { processMemory } from '@/app/actions/process-memory';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface MemoryCaptureProps {
  contactId: string;
  onSuccess?: (field: string) => void;
}

export function MemoryCapture({ contactId, onSuccess }: MemoryCaptureProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Speech Recognition Setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(prev => prev ? `${prev} ${transcript}` : transcript);
          setIsListening(false);
          inputRef.current?.focus();
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          toast.error('Voice capture failed. Please try again.');
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
        toast.error('Voice input is not supported in this browser.');
        return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const result = await processMemory(contactId, input.trim());
      
      if (result.success) {
        toast.success(`Added result to ${result.field}`, {
            icon: '✨',
            style: {
                borderRadius: '10px',
                background: '#1E293B',
                color: '#fff',
            }
        });
        setInput('');
        onSuccess?.(result.field || 'Story');
        router.refresh();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
       toast.error('Failed to capture memory');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleSubmit();
    }
  };

  return (
    <div className="relative group">
       <div className={cn(
           "relative flex items-center gap-2 bg-white dark:bg-[#252931]/50 border-2 border-dashed border-[#d1d5db] dark:border-[#374151] rounded-2xl transition-all duration-300 focus-within:border-indigo-500/50 focus-within:bg-indigo-50/5 px-4 py-2",
           isProcessing ? "opacity-70 pointer-events-none" : "hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-50/5"
       )}>
           {/* Sparkle Icon */}
           <Sparkles className={cn("w-5 h-5 shrink-0 transition-colors", input ? "text-indigo-400" : "text-[#9ca3af] group-hover:text-indigo-500 dark:group-hover:text-indigo-400")} />

           {/* Input Field */}
           <Input 
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add important info to your memory..."
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-base placeholder:text-[#9ca3af] dark:placeholder:text-gray-500 h-10 px-2"
              disabled={isProcessing}
           />

           {/* Info Popover */}
           <Popover>
             <PopoverTrigger asChild>
               <Info className="w-4 h-4 shrink-0 text-slate-500 hover:text-blue-500 transition-colors cursor-pointer focus:outline-none" aria-label="Memory info" role="button" />
             </PopoverTrigger>
             <PopoverContent className="w-72 p-4 bg-[#1E293B] border-[#334155] shadow-xl rounded-xl z-[9999]" align="end">
                 <h3 className="text-slate-200 font-bold text-xs uppercase tracking-wider border-b border-slate-700/50 pb-2 mb-2">Relationship Memory Capture</h3>
                 <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
                     <span className="text-white font-bold">Type or speak</span> anything you want to remember about this contact.
                 </p>
                 <p className="text-slate-400 text-[11px] leading-relaxed">
                     Our AI will automatically categorize the details into <span className="text-white font-bold">The Story</span>, <span className="text-white font-bold">Tags</span>, or <span className="text-white font-bold">Interests</span> so you don&apos;t have to.
                 </p>
             </PopoverContent>
           </Popover>

           {/* Action Buttons */}
           {isProcessing ? (
               <div className="flex items-center gap-2 shrink-0">
                   <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                   <span className="text-xs font-medium text-indigo-500">Processing...</span>
               </div>
           ) : (
               <>
                   <Button 
                       variant="ghost" 
                       size="icon" 
                       onClick={handleSubmit}
                       className={cn("shrink-0 text-gray-400 hover:text-indigo-500 transition-colors h-9 w-9", !input.trim() && "opacity-0 pointer-events-none")}
                   >
                       <Send className="w-4 h-4" />
                   </Button>
                   <Button 
                       size="icon"
                       onClick={toggleListening}
                       className={cn(
                           "shrink-0 rounded-full w-9 h-9 transition-all shadow-md hover:scale-105 active:scale-95",
                           isListening 
                               ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                               : "bg-[#a855f7] hover:bg-[#9333ea] text-white"
                       )}
                   >
                       <Mic className="w-4 h-4" />
                   </Button>
               </>
           )}
       </div>
    </div>
  );
}
