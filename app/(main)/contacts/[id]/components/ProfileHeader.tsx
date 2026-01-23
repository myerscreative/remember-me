'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit, Settings, Star } from 'lucide-react';
import { ContactImportance } from '@/types/database.types';
import { cn } from '@/lib/utils';

interface ProfileHeaderProps {
  onEdit?: () => void;
  importance?: ContactImportance;
  onToggleFavorite?: () => void;
}

export function ProfileHeader({ onEdit, importance, onToggleFavorite }: ProfileHeaderProps) {
  const isFavorite = importance === 'high';

  return (
    <header className="h-[65px] flex items-center justify-between px-8 bg-sidebar border-b border-sidebar-border sticky top-0 z-10 hidden md:flex">
      {/* Left: Back Button */}
      <div className="flex-1">
        <Link href="/">
          <Button variant="ghost" size="sm" className="hidden md:flex text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white pl-0 hover:bg-transparent">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Contacts
          </Button>
        </Link>
      </div>

      {/* Center: Title */}
      <div className="flex-1 flex justify-center">
        <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-wide uppercase">Profile</span>
      </div>

      {/* Right: Actions */}
      <div className="flex-1 flex justify-end gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleFavorite}
          className={cn(
            "h-9 w-9 rounded-full transition-all duration-200",
            isFavorite 
              ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20" 
              : "text-gray-400 hover:text-amber-500 hover:bg-gray-50 dark:hover:bg-[#2c3039]"
          )}
        >
          <Star className={cn("h-4 w-4", isFavorite && "fill-amber-500")} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onEdit}
          className="h-9 w-9 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 dark:hover:bg-[#2c3039] rounded-full transition-colors"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#2c3039] rounded-full transition-colors">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
