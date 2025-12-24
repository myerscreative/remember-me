'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Merge, User, Check, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  interaction_count?: number;
  last_contact?: string;
}

interface DuplicateGroup {
  name: string;
  contacts: Contact[];
}

export default function DeduplicatePage() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: persons, error } = await supabase
          .from('persons')
          .select('id, name, email, phone, photo_url, interaction_count, last_contact')
          .eq('user_id', user.id)
          .eq('archived', false); // Only check active contacts

        if (error) throw error;

        // Group by name
        const grouped = new Map<string, Contact[]>();
        persons?.forEach((p: any) => {
          const normalizedName = p.name?.trim().toLowerCase();
          if (!normalizedName) return;
          
          if (!grouped.has(normalizedName)) {
            grouped.set(normalizedName, []);
          }
          grouped.get(normalizedName)?.push(p);
        });

        // Filter for duplicates
        const duplicates: DuplicateGroup[] = [];
        grouped.forEach((contacts) => {
          if (contacts.length > 1) {
            // Sort by interaction count or something responsible?
            // Let's sort by ID to be stable, or interaction count descending (keep most active by default visually)
            contacts.sort((a, b) => (b.interaction_count || 0) - (a.interaction_count || 0));
            duplicates.push({ name: contacts[0].name, contacts });
          }
        });

        setGroups(duplicates);
      } catch (err) {
        console.error('Error fetching contacts:', err);
        toast.error('Failed to load contacts');
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [supabase]);

  // handleMerge removed (unused)

  const handleMergeGroup = async (groupIndex: number, keeperId: string) => {
    const group = groups[groupIndex];
    const duplicates = group.contacts.filter(c => c.id !== keeperId);
    
    // We strictly merge one by one for safety/feedback, although loop is fine
    // Or we could create a bulk merge RPC, but single is safer to debug.
    
    setProcessing(true);
    let successCount = 0;

    for (const dup of duplicates) {
      try {
         // Cast to any to avoid type errors since migration is fresh and types aren't regenerated
         const { error } = await (supabase as any).rpc('merge_contacts', {
            keeper_id: keeperId,
            duplicate_id: dup.id
         });
         if (error) throw error;
         successCount++;
      } catch (e: any) {
        console.error(`Failed to merge ${dup.id} into ${keeperId}`, e);
        // Log detailed error for debugging
        if (typeof e === 'object' && e !== null) {
            console.error('Error details:', {
                message: e.message,
                code: e.code,
                details: e.details,
                hint: e.hint
            });
        }
        toast.error(`Failed: ${e.message || 'Unknown error'}`);
      }
    }

    if (successCount === duplicates.length) {
      toast.success(`Successfully merged ${group.name}`);
      // Refresh by re-fetching. We need to define fetchContacts outside or duplicate logic?
      // Since it's inside useEffect now, we can't call it. 
      // ACTUALLY, better to keep it outside and wrap in useCallback.
      // Let me revert to useCallback strategy in this ReplacementContent or just trigger a reload or state update.
      // Easiest is to window.location.reload() or just update local state.
      // Updating local state is better.
      const newGroups = [...groups];
      newGroups.splice(groupIndex, 1);
      setGroups(newGroups);
      setProcessing(false);
    } else {
      setProcessing(false); 
      // Partial success - ideally we re-fetch but for now just stop.
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between pb-6 border-b border-gray-200">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Network
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Duplicate Cleanup</h1>
        </header>

        {groups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Duplicates Found</h2>
            <p className="text-gray-500">Your network looks clean! No contacts with identical names found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium text-blue-900">How merging works</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Select the &quot;primary&quot; contact you want to keep. All interactions, meetings, and interests 
                  from the other duplicates will be moved to the primary contact. The duplicates will then be removed.
                </p>
              </div>
            </div>

            {groups.map((group, idx) => (
              <MergeGroupCard 
                key={idx} 
                group={group} 
                onMerge={(keeperId) => handleMergeGroup(idx, keeperId)}
                processing={processing}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MergeGroupCard({ group, onMerge, processing }: { group: DuplicateGroup, onMerge: (id: string) => void, processing: boolean }) {
  const [selectedKeeper, setSelectedKeeper] = useState<string>(group.contacts[0].id);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          {group.name}
          <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {group.contacts.length} copies
          </span>
        </h3>
        <button
          onClick={() => onMerge(selectedKeeper)}
          disabled={processing}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          <Merge className="w-4 h-4" />
          Merge into Selected
        </button>
      </div>
      
      <div className="divide-y divide-gray-100">
        {group.contacts.map((contact) => (
          <div 
            key={contact.id} 
            className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${selectedKeeper === contact.id ? 'bg-indigo-50 hover:bg-indigo-50' : ''}`}
            onClick={() => setSelectedKeeper(contact.id)}
          >
            <div className="flex items-center gap-4">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedKeeper === contact.id ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                {selectedKeeper === contact.id && <Check className="w-3 h-3 text-white" />}
              </div>
              
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                {contact.photo_url ? (
                  <img src={contact.photo_url} alt={contact.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-bold">
                    {contact.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm font-medium text-gray-900">
                  {contact.id === selectedKeeper ? 'Primary Contact (Keeper)' : 'Duplicate (Will be deleted)'}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span>ID: ...{contact.id.slice(-4)}</span>
                  <span>•</span>
                  <span>{contact.interaction_count || 0} interactions</span>
                  {contact.email && (
                    <>
                      <span>•</span>
                      <span>{contact.email}</span>
                    </>
                  )}
                  {contact.phone && (
                    <>
                      <span>•</span>
                      <span>{contact.phone}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
