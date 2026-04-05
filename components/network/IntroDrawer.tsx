"use client";

import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getInitials, getGradient } from "@/lib/utils/contact-helpers";
import toast from "react-hot-toast";

interface IntroDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  bridgeName: string;
  bridgePhotoUrl: string | null;
  skill: string;
  bridgeContactId: string;
}

export function IntroDrawer({ 
  isOpen, 
  onOpenChange, 
  bridgeName, 
  bridgePhotoUrl, 
  skill,
  bridgeContactId
}: IntroDrawerProps) {
  const [message, setMessage] = useState(
    `Hey ${bridgeName.split(' ')[0]}, I saw in my network that you know a ${skill}. Would you be open to introducing us? I'm looking for some help with ${skill}.`
  );

  const handleSend = () => {
    toast.success(`Message sent to ${bridgeName}!`);
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 transition-opacity duration-300" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[20px] h-fit mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none border-t border-border-default">
          <div className="p-4 bg-surface rounded-t-[20px] flex-1">
            <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-border-strong mb-6" />
            
            <div className="max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-full bg-indigo-100">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                </div>
                <Drawer.Title className="font-semibold text-xl text-text-primary">
                  Request an Intro
                </Drawer.Title>
              </div>

              <div className="bg-subtle rounded-2xl p-4 border border-border-default mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10 border border-surface">
                    <AvatarImage src={bridgePhotoUrl || undefined} alt={bridgeName} />
                    <AvatarFallback className={cn("text-white text-xs", getGradient(bridgeName))}>
                      {getInitials(bridgeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{bridgeName}</p>
                    <p className="text-xs text-text-tertiary">Your mutual connection</p>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    className="w-full bg-surface border-0 rounded-xl p-4 text-sm text-text-primary min-h-[120px] focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-[10px] text-text-tertiary font-medium bg-surface/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    <MessageSquare className="w-3 h-3" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pb-8">
                <Button 
                  onClick={handleSend}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Request
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => onOpenChange(false)}
                  className="w-full h-12 text-text-tertiary hover:text-text-primary"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
