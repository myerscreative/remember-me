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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/contact-helpers";

interface ExploreFilterProps {
  tags: string[];
  interests: string[];
  selectedTag: string;
  selectedInterest: string | null;
  showMutuals: boolean;
  people: { id: string; name: string; photo_url: string | null }[];
  selectedConnectedPerson: string | null;
  onSelectTag: (tag: string) => void;
  onSelectInterest: (interest: string | null) => void;
  onSelectConnectedPerson: (id: string | null) => void;
  onToggleMutuals: (show: boolean) => void;
}

export function ExploreFilter({
  tags,
  interests,
  selectedTag,
  selectedInterest,
  showMutuals,
  people = [],
  selectedConnectedPerson,
  onSelectTag,
  onSelectInterest,
  onSelectConnectedPerson,
  onToggleMutuals,
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

  const filteredPeople = useMemo(() => {
    if (!searchQuery) return people;
    return people.filter((person) =>
      person.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [people, searchQuery]);

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
    onSelectConnectedPerson(null);
    onToggleMutuals(false);
    setSearchQuery("");
  };

  const activeCount = (selectedTag !== "All" ? 1 : 0) + (selectedInterest ? 1 : 0) + (showMutuals ? 1 : 0) + (selectedConnectedPerson ? 1 : 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "gap-2 font-medium transition-colors",
            activeCount > 0
              ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          <Compass className="h-4 w-4 text-indigo-500" />
          Explore Network
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 min-w-5">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[850px] p-0" align="start">
        <div className="p-4 border-b border-border-default">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <Input
              placeholder="Search tribes & interests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-canvas border-transparent focus:bg-white dark:focus:bg-black transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-tertiary"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4">
             <label className="flex items-center gap-2 text-sm text-text-tertiary cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={showMutuals} 
                  onChange={(e) => onToggleMutuals(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                Show only mutual connections
             </label>
          </div>

          {activeCount > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-dashed border-border-default flex-wrap">
               <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Active:</span>
               
               {showMutuals && (
                 <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                   Has Mutuals
                   <X className="h-3 w-3 cursor-pointer" onClick={() => onToggleMutuals(false)} />
                 </Badge>
               )}
               
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
                {selectedConnectedPerson && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1 pb-px">
                     <span className="opacity-70 text-[10px] uppercase">Connected To:</span>
                     {people.find(p => p.id === selectedConnectedPerson)?.name || "Unknown"}
                     <X className="h-3 w-3 cursor-pointer" onClick={() => onSelectConnectedPerson(null)} />
                  </Badge>
                )}
               <Button variant="ghost" size="sm" className="h-6 text-xs ml-auto text-text-secondary" onClick={clearFilters}>
                 Clear All
               </Button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-3 h-[400px]">
          {/* Left Column: Tribes (Tags) */}
          <div className="border-r border-border-default overflow-y-auto p-2">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-2 py-2 mb-1 sticky top-0 bg-surface z-10">Tribes</h4>
            <div className="space-y-1">
              {filteredTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagSelect(tag)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group",
                    selectedTag === tag
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                      : "text-text-tertiary hover:bg-subtle"
                  )}
                >
                  {tag}
                  {selectedTag === tag && <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                </button>
              ))}
              {filteredTags.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-text-secondary">
                   No tribes found
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interests */}
          <div className="overflow-y-auto p-2 bg-canvas/50">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-2 py-2 mb-1 sticky top-0 bg-canvas/95 backdrop-blur-sm z-10">Interests</h4>
            <div className="space-y-1">
              {filteredInterests.map(interest => (
                <button
                  key={interest}
                  onClick={() => handleInterestSelect(interest)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group",
                    selectedInterest === interest
                      ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium shadow-sm ring-1 ring-indigo-200 dark:ring-indigo-800"
                      : "text-text-secondary hover:bg-surface hover:shadow-sm"
                  )}
                >
                  {interest}
                  {selectedInterest === interest && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                </button>
              ))}
               {filteredInterests.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-text-secondary">
                   No interests found
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Connections */}
          <div className="overflow-y-auto p-2 bg-canvas/80 border-l border-border-default">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-2 py-2 mb-1 sticky top-0 bg-canvas z-10 backdrop-blur-sm">Connected To...</h4>
            <div className="space-y-1">
              {filteredPeople.map(person => (
                <button
                  key={person.id}
                  onClick={() => onSelectConnectedPerson(selectedConnectedPerson === person.id ? null : person.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-3 group",
                    selectedConnectedPerson === person.id
                      ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium shadow-sm ring-1 ring-purple-200 dark:ring-purple-800"
                      : "text-text-secondary hover:bg-surface hover:shadow-sm"
                  )}
                >
                  <div className="h-6 w-6 rounded-full bg-border-default overflow-hidden shrink-0">
                    {person.photo_url ? (
                        <Avatar className="h-full w-full">
                            <AvatarImage src={person.photo_url} alt={person.name} />
                            <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
                        </Avatar>
                    ) : (
                        <Avatar className="h-full w-full">
                            <AvatarFallback className="text-[10px] font-bold text-text-secondary">
                                {getInitials(person.name)}
                            </AvatarFallback>
                        </Avatar>
                    )}
                  </div>
                  <span className="truncate">{person.name}</span>
                  {selectedConnectedPerson === person.id && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-purple-500" />}
                </button>
              ))}
               {filteredPeople.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-text-secondary">
                   No people found
                </div>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
