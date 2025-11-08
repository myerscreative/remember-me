"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

// Type for icon component
type IconComponent = React.ComponentType<{ className?: string }>;

// Curated list of common icons for loop groups
const COMMON_ICONS = [
  "Users", "Heart", "Briefcase", "GraduationCap", "Home", "Coffee",
  "Music", "GamepadIcon", "Book", "Dumbbell", "Plane", "Camera",
  "Palette", "Wrench", "ShoppingCart", "Gift", "Star", "Rocket",
  "Target", "TrendingUp", "Award", "Flag", "Sparkles", "Globe",
  "MapPin", "Mail", "Phone", "MessageCircle", "Calendar", "Clock",
  "Folder", "FileText", "Image", "Video", "Mic", "Headphones",
  "Tv", "Monitor", "Smartphone", "Laptop", "Wifi", "Cloud",
  "Download", "Upload", "Share2", "Link", "Code", "Terminal",
  "Database", "Server", "Settings", "Tool", "Package", "Archive",
  "Trash2", "Edit", "Save", "Plus", "Minus", "Check",
  "X", "AlertCircle", "Info", "HelpCircle", "AlertTriangle", "Bell",
];

interface IconSelectorProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
  color?: string;
}

export function IconSelector({ selectedIcon, onSelectIcon, color = "#8B5CF6" }: IconSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter icons based on search
  const filteredIcons = searchQuery
    ? COMMON_ICONS.filter((iconName) =>
        iconName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : COMMON_ICONS;

  // Helper to get icon component
  const getIconComponent = (iconName: string): IconComponent => {
    const IconComp = (Icons as Record<string, IconComponent>)[iconName];
    return IconComp || Icons.Folder;
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
        <Input
          type="text"
          placeholder="Search icons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        />
      </div>

      {/* Icon Grid */}
      <div className="grid grid-cols-6 gap-2 max-h-[300px] overflow-y-auto p-1">
        {filteredIcons.length > 0 ? (
          filteredIcons.map((iconName) => {
            const IconComponent = getIconComponent(iconName);
            const isSelected = selectedIcon === iconName;

            return (
              <button
                key={iconName}
                type="button"
                onClick={() => onSelectIcon(iconName)}
                className={cn(
                  "relative aspect-square rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105",
                  isSelected
                    ? "ring-2 ring-offset-2 dark:ring-offset-gray-900 shadow-lg scale-105"
                    : "hover:shadow-md"
                )}
                style={{
                  backgroundColor: isSelected ? color : "rgb(243 244 246)",
                  ringColor: isSelected ? color : undefined,
                }}
                title={iconName}
              >
                <IconComponent
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isSelected ? "text-white" : "text-gray-700 dark:text-gray-300"
                  )}
                />
              </button>
            );
          })
        ) : (
          <div className="col-span-6 flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
            <Icons.Search className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No icons found</p>
          </div>
        )}
      </div>

      {/* Selected icon preview */}
      {selectedIcon && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            {(() => {
              const IconComponent = getIconComponent(selectedIcon);
              return <IconComponent className="h-5 w-5 text-white" />;
            })()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedIcon}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Selected icon
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
