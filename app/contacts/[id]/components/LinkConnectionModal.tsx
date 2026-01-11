import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, UserPlus, X } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/contact-helpers";
import { Person } from "@/types/database.types";
import { useToast } from "@/components/ui/use-toast";

interface LinkConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContactId: string;
  currentContactName: string;
  onSuccess?: () => void;
}

const RELATIONSHIP_TYPES = [
  "Spouse",
  "Partner",
  "Child",
  "Parent",
  "Sibling",
  "Colleague",
  "Friend",
  "Mentor",
  "Mentee",
  "Other"
];

export function LinkConnectionModal({ 
  isOpen, 
  onClose, 
  currentContactId,
  currentContactName,
  onSuccess 
}: LinkConnectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [relationshipType, setRelationshipType] = useState("Colleague");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSearchResults([]);
      setSelectedPerson(null);
      setRelationshipType("Colleague");
    }
  }, [isOpen]);

  useEffect(() => {
    const searchPeople = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from("persons")
          .select("*")
          .ilike("name", `%${searchTerm}%`)
          .neq("id", currentContactId) // Exclude current contact
          .limit(5);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error("Error searching people:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchPeople, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, currentContactId, supabase]);

  const handleLink = async () => {
    if (!selectedPerson) return;

    setIsSubmitting(true);
    try {
      // Insert relationship
      const { error } = await supabase
        .from("relationships")
        .insert({
          from_person_id: currentContactId,
          to_person_id: selectedPerson.id,
          relationship_type: relationshipType,
          direction: "bidirectional" // bidirectional by default for simplicity for now
        });

      if (error) throw error;

      toast({
        title: "Connection Linked",
        description: `Linked ${selectedPerson.name} as ${relationshipType} to ${currentContactName}`,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error linking connection:", error);
      toast({
        title: "Error",
        description: "Failed to link connection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0f1419] border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle>Link a Connection</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 py-4">
          {!selectedPerson ? (
            /* SEARCH STATE */
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search for a person..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-[#1a1f2e] border-slate-700 text-slate-100 focus:ring-violet-500"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2 min-h-[200px]">
                {isSearching ? (
                  <div className="flex items-center justify-center h-20 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => setSelectedPerson(person)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1a1f2e] transition-colors text-left group"
                    >
                      <Avatar className="h-10 w-10 border border-slate-700">
                        <AvatarImage src={person.photo_url || undefined} />
                        <AvatarFallback className="bg-slate-800 text-slate-300">
                          {getInitials(person.first_name, person.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-slate-200 group-hover:text-white">{person.name}</div>
                        {person.company && (
                          <div className="text-xs text-slate-500">{person.company}</div>
                        )}
                      </div>
                      <UserPlus className="h-4 w-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                ) : searchTerm ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No people found matching "{searchTerm}"
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-600 text-sm">
                    Type to search your contacts
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* SELECTION STATE */
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-4 bg-[#1a1f2e] p-4 rounded-xl border border-slate-700">
                <Avatar className="h-12 w-12 border-2 border-slate-600">
                  <AvatarImage src={selectedPerson.photo_url || undefined} />
                  <AvatarFallback className="bg-slate-800 text-slate-300">
                    {getInitials(selectedPerson.first_name, selectedPerson.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-lg text-white">{selectedPerson.name}</div>
                  <div className="text-sm text-slate-400">Selected Contact</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedPerson(null)}
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                  Relationship to {currentContactName}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RELATIONSHIP_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setRelationshipType(type)}
                      className={`
                        p-3 rounded-lg text-sm font-medium transition-all border
                        ${relationshipType === type 
                          ? "bg-violet-600/20 border-violet-500 text-violet-200 shadow-[0_0_15px_rgba(124,58,237,0.3)]" 
                          : "bg-[#1a1f2e] border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                        }
                      `}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="text-slate-400 hover:text-white">
                  Cancel
                </Button>
                <Button 
                  onClick={handleLink} 
                  disabled={isSubmitting}
                  className="bg-violet-600 hover:bg-violet-700 text-white min-w-[100px]"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Link"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
