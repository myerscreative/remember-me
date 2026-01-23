import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, Tag, Search, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toggleInterest } from '@/app/actions/toggle-interest';
import { getInterestsForContact, searchInterests, type Interest } from '@/app/actions/get-interests';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface InterestsTabProps {
  contactId: string;
}

// Deterministic color generation based on string
function getBadgeColor(name: string) {
  const colors = [
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-800',
    'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export function InterestsTab({ contactId }: InterestsTabProps) {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Interest[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load suggestions when typing
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.trim().length < 1) {
        setSuggestions([]);
        return;
      }
      const results = await searchInterests(inputValue);
      // Filter out interests already added
      setSuggestions(results.filter(r => !interests.some(i => i.name.toLowerCase() === r.name.toLowerCase())));
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [inputValue, interests]);

  const loadInterests = useCallback(async () => {
    setLoading(true);
    const data = await getInterestsForContact(contactId);
    setInterests(data);
    setLoading(false);
  }, [contactId]);

  // Load initial interests
  useEffect(() => {
    loadInterests();
  }, [loadInterests]);

  const handleAddInterest = async (name: string) => {
    if (!name.trim()) return;
    
    // Optimistic update
    const tempId = Math.random().toString();
    const newInterest = { id: tempId, name: name.trim() };
    
    // Don't add duplicate locally
    if (interests.some(i => i.name.toLowerCase() === name.trim().toLowerCase())) {
        setInputValue('');
        setShowSuggestions(false);
        toast.error('Interest already added');
        return;
    }

    setInterests([...interests, newInterest]);
    setInputValue('');
    setShowSuggestions(false);
    setIsSubmitting(true);

    try {
      const result = await toggleInterest(contactId, name);
      if (!result.success) {
        // Revert on failure
        setInterests(prev => prev.filter(i => i.id !== tempId));
        toast.error('Failed to add interest');
      } else {
        // Reload to get real ID
        loadInterests();
      }
    } catch {
       setInterests(prev => prev.filter(i => i.id !== tempId));
       toast.error('Error adding interest');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleRemoveInterest = async (interest: Interest) => {
    // Optimistic update
    setInterests(prev => prev.filter(i => i.id !== interest.id));

    try {
      const result = await toggleInterest(contactId, interest.name);
      if (!result.success) {
        setInterests(prev => [...prev, interest]);
        toast.error('Failed to remove interest');
      }
    } catch {
       setInterests(prev => [...prev, interest]);
       toast.error('Error removing interest');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInterest(inputValue);
    }
  };

  if (loading) {
    return (
        <div className="flex flex-wrap gap-2 animate-pulse">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 w-24 bg-gray-100 dark:bg-gray-800 rounded-full" />
            ))}
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
            <Tag className="w-5 h-5 text-primary" />
            Interests & Passions
        </h3>

        {/* Tag Cloud */}
        <div className="flex flex-wrap gap-2 mb-6 min-h-[40px]">
             {interests.length === 0 && (
                <p className="text-muted-foreground italic text-sm py-2">No interests added yet. Add one below!</p>
             )}
             
             {interests.map((interest) => (
                <div 
                    key={interest.id}
                    className={cn(
                        "group relative inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-all hover:scale-105 cursor-default",
                        getBadgeColor(interest.name)
                    )}
                >
                    {interest.name}
                    
                    {/* Hover Actions */}
                    <div className="ml-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveInterest(interest);
                            }}
                            className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full"
                         >
                             <X className="w-3 h-3" />
                         </button>
                    </div>
                </div>
             ))}
        </div>

        {/* Add Input */}
        <div className="relative" ref={wrapperRef}>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add an interest (e.g. Hiking, Jazz, Coffee)..."
                        className="pl-9 bg-muted/50 border-transparent focus:bg-background transition-all"
                    />
                </div>
                <Button 
                    onClick={() => handleAddInterest(inputValue)} 
                    disabled={!inputValue.trim() || isSubmitting}
                    size="icon"
                    className="shrink-0"
                >
                    <Plus className="w-5 h-5" />
                </Button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover rounded-lg shadow-xl border border-border z-50 overflow-hidden">
                    <div className="py-1">
                        {suggestions.map((suggestion) => (
                            <button
                                key={suggestion.id}
                                onClick={() => handleAddInterest(suggestion.name)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center justify-between group"
                            >
                                <span className="text-foreground">{suggestion.name}</span>
                                <Plus className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Discovery Section */}
      {interests.length > 0 && (
          <div className="bg-secondary/20 rounded-xl p-4 border border-secondary/30">
              <h4 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Connection Opportunities
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                  Find other people in your network who share these interests to plan group activities.
              </p>
              <div className="flex flex-wrap gap-2">
                  {interests.slice(0, 3).map(interest => (
                      <Link 
                        key={interest.id}
                        href={`/?search=${encodeURIComponent(interest.name)}`}
                      >
                          <Button variant="outline" size="sm" className="bg-background hover:bg-muted border-secondary/30 text-xs h-8">
                              Find {interest.name} fans
                          </Button>
                      </Link>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
}
