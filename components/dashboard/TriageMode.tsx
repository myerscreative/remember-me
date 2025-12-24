"use client";

import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Droplets, Clock, ChevronRight, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getInitials, getGradient } from "@/lib/utils/contact-helpers";
import { logInteraction } from "@/app/actions/logInteraction";
import { toast } from "react-hot-toast";

interface TriageContact {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  days_since_contact: number;
  importance?: "high" | "medium" | "low";
}

interface TriageModeProps {
  contacts: TriageContact[];
  onActionComplete: () => void;
}

export function TriageMode({ contacts, onActionComplete }: TriageModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cards = contacts.slice(0, 5);
  const [isWatering, setIsWatering] = useState(false);

  const activeCard = cards[currentIndex];

  const handleSnooze = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      toast("All caught up for now!", { icon: "✨" });
      onActionComplete();
    }
  };

  const handleWater = async () => {
    if (!activeCard || isWatering) return;
    setIsWatering(true);

    try {
      const result = await logInteraction({
        personId: activeCard.id,
        type: "text", // Default for quick water
        note: "Quick water from Triage Mode",
      });

      if (result.success) {
        toast.success(`Watering ${activeCard.name}... 🌱`);
        handleSnooze(); // Move to next card
      } else {
        toast.error(result.error || "Failed to water relationship");
      }
    } catch (err) {
      console.error("Triage Error:", err);
      toast.error("Failed to log interaction");
    } finally {
      setIsWatering(false);
    }
  };

  if (!activeCard) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <Star className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold">Your Garden is Fresh!</h3>
        <p className="text-gray-500">No contacts need immediate attention at the moment.</p>
        <Button onClick={onActionComplete} variant="outline" className="mt-4">
            Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-8 w-full max-w-md mx-auto py-4 px-4 overflow-hidden">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-orange-600 dark:text-orange-400">
          Quick Triage
        </h2>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            {cards.length - currentIndex} Thirsty Contacts Remaining
        </p>
      </div>

      <div className="relative w-full aspect-4/5 flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {cards.slice(currentIndex, currentIndex + 2).reverse().map((contact, index) => {
            const isTop = index === (cards.slice(currentIndex, currentIndex + 2).length - 1);
            return (
              <TriageCard
                key={contact.id}
                contact={contact}
                isTop={isTop}
                onSwipeLeft={handleSnooze}
                onSwipeRight={handleSnooze} // Snooze on either horizontal swipe for now
                onTap={handleWater}
              />
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-6 w-full justify-center">
        <Button 
          variant="outline" 
          size="lg" 
          onClick={handleSnooze}
          className="h-16 w-16 rounded-full border-2 border-gray-200 dark:border-gray-800"
        >
          <Clock className="h-6 w-6 text-gray-400" />
        </Button>
        <Button 
          size="lg" 
          onClick={handleWater}
          disabled={isWatering}
          className="h-20 w-20 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-white border-none"
        >
          <Droplets className={cn("h-8 w-8", isWatering && "animate-bounce")} />
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
           onClick={() => window.location.href = `/contacts/${activeCard.id}`}
          className="h-16 w-16 rounded-full border-2 border-gray-200 dark:border-gray-800"
        >
          <ChevronRight className="h-6 w-6 text-gray-400" />
        </Button>
      </div>
    </div>
  );
}

function TriageCard({ contact, isTop, onSwipeLeft, onSwipeRight, onTap }: { 
    contact: TriageContact; 
    isTop: boolean;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    onTap: () => void;
}) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);
  const rotate = useTransform(x, [-150, 150], [-15, 15]);

  if (!isTop) {
      return (
          <motion.div 
            className="absolute inset-0 bg-white dark:bg-gray-800 rounded-[2.5rem] border-2 border-gray-100 dark:border-gray-700 shadow-xl p-8 flex flex-col items-center justify-center text-center scale-95 opacity-50 z-0"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 0.95, opacity: 0.5 }}
          >
             <Avatar className="h-32 w-32 mb-6 border-4 border-white dark:border-gray-900 shadow-sm">
                <AvatarFallback className={cn("bg-linear-to-br text-white text-4xl font-black", getGradient(contact.name))}>
                   {getInitials(contact.first_name, contact.last_name)}
                </AvatarFallback>
             </Avatar>
             <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight truncate w-full px-4">
                {contact.name}
             </h3>
          </motion.div>
      )
  }

  return (
    <motion.div
      style={{ x, opacity, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x < -100) {
          onSwipeLeft();
        } else if (info.offset.x > 100) {
          onSwipeRight();
        }
      }}
      onClick={onTap}
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ x: x.get() < 0 ? -300 : 300, opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
      className="absolute inset-0 bg-white dark:bg-gray-800 rounded-[2.5rem] border-2 border-orange-200 dark:border-orange-900/50 shadow-2xl p-8 flex flex-col items-center justify-center text-center cursor-grab active:cursor-grabbing z-10"
    >
      <div className="absolute top-6 right-6">
          <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
              {contact.days_since_contact}d
          </div>
      </div>

      {contact.importance === 'high' && (
          <div className="absolute top-6 left-6">
            <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
          </div>
      )}

      <Avatar className="h-40 w-40 mb-8 border-4 border-white dark:border-gray-900 shadow-md ring-4 ring-orange-50 dark:ring-orange-900/20">
        <AvatarImage src={contact.photo_url} />
        <AvatarFallback className={cn("bg-linear-to-br text-white text-5xl font-black", getGradient(contact.name))}>
           {getInitials(contact.first_name, contact.last_name)}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-2 w-full px-4">
        <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none truncate">
            {contact.name}
        </h3>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            Needs attention
        </p>
      </div>

      <div className="mt-12 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 animate-pulse">
              <Droplets className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tap to Water</span>
          </div>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Swipe either way to snooze</p>
      </div>
    </motion.div>
  );
}
