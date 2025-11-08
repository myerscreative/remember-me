"use client";

import { useState, useRef } from "react";
import * as Icons from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageCropModal } from "@/components/image-crop-modal";

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
  customIconUrl?: string | null;
  onCustomIconSelect?: (imageBlob: Blob) => void;
  onRemoveCustomIcon?: () => void;
}

export function IconSelector({
  selectedIcon,
  onSelectIcon,
  color = "#8B5CF6",
  customIconUrl,
  onCustomIconSelect,
  onRemoveCustomIcon,
}: IconSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [imageToUpload, setImageToUpload] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    // Read the file and show crop modal
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setImageToUpload(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    if (onCustomIconSelect) {
      onCustomIconSelect(croppedBlob);
    }
    setImageToUpload(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropCancel = () => {
    setImageToUpload(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isCustomIconSelected = !!customIconUrl;

  return (
    <div className="space-y-4">
      {/* Custom Icon Upload Section */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Custom Icon
            </h3>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Image
          </Button>
        </div>

        {/* Show custom icon preview if exists */}
        {customIconUrl && (
          <div className="relative">
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div
                className="h-12 w-12 rounded-lg flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: color }}
              >
                <img
                  src={customIconUrl}
                  alt="Custom icon"
                  className="h-10 w-10 object-cover rounded"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Custom uploaded icon
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Currently selected
                </p>
              </div>
              {onRemoveCustomIcon && (
                <button
                  type="button"
                  onClick={onRemoveCustomIcon}
                  className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                  title="Remove custom icon"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          Upload a PNG or JPG image. It will be cropped to a square.
        </p>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white dark:bg-gray-800 px-3 text-xs text-gray-500 dark:text-gray-400">
            Or choose a preset icon
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
        <Input
          type="text"
          placeholder="Search preset icons..."
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
            const isSelected = selectedIcon === iconName && !isCustomIconSelected;

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

      {/* Selected icon preview (if not custom) */}
      {selectedIcon && !isCustomIconSelected && (
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
              Selected preset icon
            </p>
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      {imageToUpload && (
        <ImageCropModal
          imageSrc={imageToUpload}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
