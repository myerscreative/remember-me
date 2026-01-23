'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Merge, User, Check, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { findPotentialDuplicates, PotentialDuplicateGroup } from '@/lib/contacts/merge-utils';
import { MergeWizard } from './components/MergeWizard';
import { type Database } from '@/types/database.types';

type Person = Database['public']['Tables']['persons']['Row'];

export default function DeduplicatePage() {
  const [duplicateGroups, setDuplicateGroups] = useState<PotentialDuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Wizard State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<PotentialDuplicateGroup | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const fetchContactsAndFindDuplicates = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: persons, error } = await supabase
        .from('persons')
        .select('*') // Get all fields for better fuzzy matching
        .eq('user_id', user.id)
        .eq('archived', false);

      if (error) throw error;

      // Use potentially heavy fuzzy logic
      // Note: For 200 contacts this is instant. For 2000 it might take 100ms.
      const groups = findPotentialDuplicates(persons as Person[]);
      setDuplicateGroups(groups);

    } catch (err) {
      console.error('Error fetching/processing contacts:', err);
      toast.error('Failed to analyze contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactsAndFindDuplicates();
  }, []);

  const handleOpenMergeWizard = (group: PotentialDuplicateGroup) => {
    setSelectedGroup(group);
    setWizardOpen(true);
  };

  const handleMergeSuccess = () => {
    // Refresh list
    fetchContactsAndFindDuplicates();
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
          <div className="text-right">
             <h1 className="text-2xl font-bold text-gray-900">Network Cleanup</h1>
             <p className="text-xs text-gray-500">AI-Powered Duplicate Detection</p>
          </div>
        </header>

        {duplicateGroups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Duplicates Found</h2>
            <p className="text-gray-500">Your network looks clean! We checked names, emails, and phone numbers.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium text-indigo-900">Potential Duplicates Found</h3>
                <p className="text-sm text-indigo-700 mt-1">
                  We found <strong>{duplicateGroups.length}</strong> groups of potential duplicates using smart matching (Name similarity, Email, Phone).
                  Review each group to merge them.
                </p>
              </div>
            </div>

            {duplicateGroups.map((group) => (
              <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                       {group.keeper.name}
                       {group.score >= 1.0 && (
                         <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Exact Match</span>
                       )}
                       {group.score < 1.0 && (
                         <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{(group.score * 100).toFixed(0)}% Similar</span>
                       )}
                    </h3>
                    <div className="text-xs text-gray-500 mt-1 flex gap-2">
                      {group.reason.map((r, i) => (
                        <span key={i} className="bg-gray-200 px-1.5 py-0.5 rounded">{r}</span>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleOpenMergeWizard(group)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <Merge className="w-4 h-4" />
                    Review & Merge
                  </button>
                </div>
                
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Only show up to 3 for preview */}
                    {[group.keeper, ...group.duplicates].slice(0, 3).map(person => (
                       <div key={person.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
                           <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden">
                              {person.photo_url ? <img src={person.photo_url} className="w-full h-full object-cover" /> : person.name.slice(0,1)}
                           </div>
                           <div className="overflow-hidden">
                              <div className="font-medium text-sm truncate">{person.name}</div>
                              <div className="text-xs text-gray-500 truncate">{person.email || person.phone || 'No info'}</div>
                           </div>
                       </div>
                    ))}
                    {group.duplicates.length + 1 > 3 && (
                       <div className="flex items-center justify-center text-xs text-gray-500 italic">
                         + {(group.duplicates.length + 1) - 3} more
                       </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedGroup && (
           <MergeWizard 
             isOpen={wizardOpen}
             onClose={() => setWizardOpen(false)}
             keeper={selectedGroup.keeper}
             duplicates={selectedGroup.duplicates} // Pass ALL duplicates, not just [0]
             onSuccess={handleMergeSuccess}
           />
        )}
        
      </div>
    </div>
  );
}

