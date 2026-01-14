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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Speech Recognition Setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true; // Keep listening until manually stopped
        recognitionRef.current.interimResults = true; // Show results as user speaks
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          // Capture all results, not just the first one
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setInput(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          if (event.error !== 'no-speech') {
            toast.error('Voice capture failed. Please try again.');
          }
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
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent default new line
        handleSubmit();
    }
  };

  return (
    <div className="relative">
      {/* Centered AI Button */}
      <div className="flex flex-col items-center gap-4">
        {/* AI Button */}
        <Button
          size="lg"
          onClick={toggleListening}
          disabled={isProcessing}
          className={cn(
            "rounded-full w-20 h-20 md:w-16 md:h-16 transition-all shadow-lg hover:scale-105 active:scale-95",
            isListening
              ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
              : isProcessing
              ? "bg-indigo-400 text-white cursor-not-allowed"
              : "bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 md:w-7 md:h-7 animate-spin" />
          ) : (
            <Sparkles className="w-8 h-8 md:w-7 md:h-7" />
          )}
        </Button>

        {/* Label */}
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
          {isListening ? "Click again to stop" : isProcessing ? "Processing..." : "Add important info"}
        </p>

        {/* Text Display Area - Shows when there's input or listening */}
        {(input || isListening) && (
          <div className="w-full animate-in fade-in slide-in-from-top-2 duration-300">
            <textarea
              ref={inputRef as any}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening..." : "Type or edit..."}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 dark:border-indigo-900/50 bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none transition-all text-sm leading-relaxed"
              disabled={isProcessing || isListening}
              style={{ minHeight: '80px' }}
            />
            
            {/* Action Buttons */}
            {input && !isListening && !isProcessing && (
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput('')}
                  className="text-slate-600 dark:text-slate-400"
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Info Popover - Bottom right when no input */}
        {!input && !isListening && (
          <div className="absolute top-0 right-0">
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-2 text-slate-400 hover:text-indigo-500 transition-colors">
                  <Info className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4 bg-[#1E293B] border-[#334155] shadow-xl rounded-xl z-[9999]" align="end">
                <h3 className="text-slate-200 font-bold text-xs uppercase tracking-wider border-b border-slate-700/50 pb-2 mb-2">
                  AI Memory Capture
                </h3>
                <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
                  <span className="text-white font-bold">Click the AI button</span> to speak or type anything you want to remember.
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Our AI will automatically organize details into <span className="text-white font-bold">Story</span>, <span className="text-white font-bold">Family</span>, <span className="text-white font-bold">Interests</span>, and more.
                </p>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
}
