import { useState, useMemo } from "react";
import { Search, Compass, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ExploreFilterProps {
  tags: string[];
  interests: string[];
  selectedTag: string;
  selectedInterest: string | null;
  onSelectTag: (tag: string) => void;
  onSelectInterest: (interest: string | null) => void;
}

export function ExploreFilter({
  tags,
  interests,
  selectedTag,
  selectedInterest,
  onSelectTag,
  onSelectInterest,
}: ExploreFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTags = useMemo(() => {
    if (!searchQuery) return tags;
    return tags.filter((tag) =>
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tags, searchQuery]);

  const filteredInterests = useMemo(() => {
    if (!searchQuery) return interests;
    return interests.filter((interest) =>
      interest.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [interests, searchQuery]);

  const handleTagSelect = (tag: string) => {
    onSelectTag(tag);
    // Don't close on tag select, allow exploring
  };

  const handleInterestSelect = (interest: string) => {
    onSelectInterest(selectedInterest === interest ? null : interest);
  };

  const clearFilters = () => {
    onSelectTag("All");
    onSelectInterest(null);
    setSearchQuery("");
  };

  const activeCount = (selectedTag !== "All" ? 1 : 0) + (selectedInterest ? 1 : 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "gap-2 font-medium transition-colors",
            activeCount > 0
              ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          <Compass className="h-4 w-4" />
          Explore
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 min-w-[1.25rem]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tribes & interests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-50 dark:bg-gray-900 border-transparent focus:bg-white dark:focus:bg-black transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {activeCount > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-dashed border-gray-200 dark:border-gray-800">
               <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active:</span>
               {selectedTag !== "All" && (
                 <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                   {selectedTag}
                   <X className="h-3 w-3 cursor-pointer" onClick={() => onSelectTag("All")} />
                 </Badge>
               )}
               {selectedInterest && (
                 <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 gap-1">
                   {selectedInterest}
                   <X className="h-3 w-3 cursor-pointer" onClick={() => onSelectInterest(null)} />
                 </Badge>
               )}
               <Button variant="ghost" size="sm" className="h-6 text-xs ml-auto text-gray-500" onClick={clearFilters}>
                 Clear All
               </Button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 h-[400px]">
          {/* Left Column: Tribes (Tags) */}
          <div className="border-r border-gray-100 dark:border-gray-800 overflow-y-auto p-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 py-2 mb-1 sticky top-0 bg-white dark:bg-gray-950 z-10">Tribes</h4>
            <div className="space-y-1">
              {filteredTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagSelect(tag)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group",
                    selectedTag === tag
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {tag}
                  {selectedTag === tag && <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                </button>
              ))}
              {filteredTags.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                   No tribes found
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interests */}
          <div className="overflow-y-auto p-2 bg-gray-50/50 dark:bg-gray-900/50">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 py-2 mb-1 sticky top-0 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm z-10">Interests</h4>
            <div className="space-y-1">
              {filteredInterests.map(interest => (
                <button
                  key={interest}
                  onClick={() => handleInterestSelect(interest)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group",
                    selectedInterest === interest
                      ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-800"
                      : "text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm"
                  )}
                >
                  {interest}
                  {selectedInterest === interest && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                </button>
              ))}
               {filteredInterests.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                   No interests found
                </div>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
