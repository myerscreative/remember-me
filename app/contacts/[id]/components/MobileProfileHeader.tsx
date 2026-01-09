import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InteractionType, FREQUENCY_PRESETS } from "@/lib/relationship-health";
import { ContactImportance } from "@/types/database.types";
import { ArrowLeft, Star, Edit, Check, Camera, Phone, Mail, RefreshCw, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";

interface MobileProfileHeaderProps {
  contact: any;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onSaveName: (firstName: string, lastName: string) => void;
  onToggleFavorite: () => void;
  onAvatarClick: () => void;
  onFrequencyChange: (days: number) => void;
}

export function MobileProfileHeader({
  contact,
  isEditMode,
  onToggleEditMode,
  onSaveName,
  onToggleFavorite,
  onAvatarClick,
  onFrequencyChange
}: MobileProfileHeaderProps) {
  const [firstName, setFirstName] = useState(contact.firstName);
  const [lastName, setLastName] = useState(contact.lastName);

  const handleSave = () => {
    onSaveName(firstName, lastName);
  };

  return (
    <div className="md:hidden bg-[#6366f1] text-white shadow-xl relative overflow-hidden transition-all duration-300">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      
      <div className="px-4 pt-2 pb-3 relative z-10">
        {/* Top Row: Nav & Actions */}
        <div className="flex justify-between items-center mb-3">
            <Link href="/">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-8 w-8 -ml-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
            
            <div className="flex gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-8 w-8 hover:bg-white/20 rounded-full transition-all duration-200",
                        contact.importance === 'high' ? "text-amber-300" : "text-white/80"
                    )}
                    onClick={onToggleFavorite}
                >
                    <Star className={cn("h-5 w-5", contact.importance === 'high' && "fill-amber-300")} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/80 hover:bg-white/20 rounded-full"
                    onClick={onToggleEditMode}
                >
                    {isEditMode ? <Check className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
                </Button>
            </div>
        </div>

        {/* Content Row: Compact Layout */}
        <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0" onClick={onAvatarClick}>
                 <Avatar className="h-16 w-16 border-2 border-white/30 shadow-md">
                    <AvatarImage src={contact.photo_url} className="object-cover" />
                    <AvatarFallback className="bg-indigo-700 text-white/70 text-lg">
                        {(contact.firstName?.[0] || "")}
                    </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/20 opacity-0 active:opacity-100 transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                </div>
            </div>

            {/* Info & Actions */}
            <div className="flex-1 min-w-0">
                {isEditMode ? (
                     <div className="flex gap-2 mb-2">
                        <Input 
                            value={firstName} 
                            onChange={e => setFirstName(e.target.value)} 
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-8 text-sm" 
                            placeholder="First" 
                        />
                        <Input 
                            value={lastName} 
                            onChange={e => setLastName(e.target.value)} 
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-8 text-sm" 
                            placeholder="Last" 
                        />
                        <Button size="icon" onClick={handleSave} className="bg-white text-[#6366f1] h-8 w-8 shrink-0"><Check className="h-3 w-3" /></Button>
                     </div>
                ) : (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-xl font-bold text-white truncate leading-tight">
                                {contact.firstName} {contact.lastName}
                            </h1>
                        </div>
                        
                        {/* Frequency Badge */}
                         <div className="relative group self-start inline-flex">
                            <span className={cn(
                                "text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors backdrop-blur-sm cursor-pointer",
                                contact.current_health === 'neglected' 
                                    ? "bg-rose-500/20 text-rose-50 border-rose-200/20" 
                                    : "bg-white/15 text-white/90 border-white/10 hover:bg-white/25"
                            )}>
                                <RefreshCw className="w-3 h-3 opacity-70" />
                                {FREQUENCY_PRESETS.find(p => p.days === contact.target_frequency_days)?.label || "Monthly"}
                            </span>
                            <select
                                value={contact.target_frequency_days || 30}
                                onChange={(e) => onFrequencyChange(parseInt(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                         </div>
                    </div>
                )}
            </div>
        </div>

        {/* Action Buttons Row - Horizontal & Compact */}
        <div className="flex gap-2 mt-4 ml-[72px]">
            {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-lg transition-all border border-white/10 text-xs font-semibold backdrop-blur-sm"> 
                    <Phone className="h-3.5 w-3.5" />
                    <span>Call</span>
                </a>
            )}
             {contact.phone && (
                <a href={`sms:${contact.phone}`} className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-lg transition-all border border-white/10 text-xs font-semibold backdrop-blur-sm"> 
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Text</span>
                </a>
            )}
            {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-lg transition-all border border-white/10 text-xs font-semibold backdrop-blur-sm"> 
                    <Mail className="h-3.5 w-3.5" />
                    <span>Email</span>
                </a>
            )}
        </div>

      </div>
    </div>
  );
}
