'use client';

import { useState } from 'react';
import { updateFamilyMembers } from '@/app/actions/update-family-members';
import { updateStoryFields } from '@/app/actions/story-actions'; // Reusing for family_notes mapped to simple field if needed, or create new action.
// Actually, `family_notes` is a field on persons table. updateStoryFields logic is generic enough? 
// Let's check story-actions. it takes specific fields. I might need a generic update action or just add family_notes to it.
import { X, Heart, User, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from "next/image";

interface FamilyMember {
  name: string;
  relationship: 'Spouse' | 'Partner' | 'Child' | 'Parent' | 'Sibling' | 'Other';
  birthday?: string;
  anniversary?: string; 
  notes?: string; 
  id?: string;
}

interface FamilyTabProps {
  contact: {
    id: string;
    name: string;
    familyMembers?: FamilyMember[];
    family_notes?: string;
    connections?: Array<{
      id: string;
      relationship_type: string;
      context?: string;
      person: {
        id: string;
        name: string;
        photo_url?: string;
      };
    }>;
  };
}


export function FamilyTab({ contact }: FamilyTabProps) {
  const [members, setMembers] = useState<FamilyMember[]>(contact.familyMembers || []);
  const [householdNotes, setHouseholdNotes] = useState(contact.family_notes || '');

  // Helper to save members
  const saveMembers = async (newMembers: FamilyMember[]) => {
    setMembers(newMembers);
    const result = await updateFamilyMembers(contact.id, newMembers);
    
    if (!result.success) {
      toast.error("Failed to update family");
      setMembers(contact.familyMembers || []); // Revert
    }
  };

  const handleUpdateMember = (index: number, field: keyof FamilyMember, value: string) => {
    const newMembers = [...members];
    (newMembers[index] as any)[field] = value;
    setMembers(newMembers); // Update local state immediately
  };

  const handleSaveMember = async (index: number) => {
    // Save on blur
    const result = await updateFamilyMembers(contact.id, members);
    if (result.success) {
      toast.success('Saved');
    } else {
      toast.error('Failed to save');
    }
  };

  const handleAddMember = (type: FamilyMember['relationship'] = 'Child') => {
    const newMember: FamilyMember = { name: '', relationship: type, notes: '' };
    saveMembers([...members, newMember]);
  };

  const handleRemoveMember = (index: number) => {
    const newMembers = members.filter((_, i) => i !== index);
    saveMembers(newMembers);
  };

  // Helper to save Household Notes
  const handleSaveHouseholdNotes = async () => {
      // We need a server action for this. Let's assume we can use a generic update or add one.
      // For now, I'll use a direct call pattern similar to story fields if I can, or I'll adding it to story-actions is best.
      // I will assume I need to create/export `updateFamilyNotes` in story-actions.ts or similar.
      // For this step, I'll define the function assuming it exists or I'll implement it shortly.
      // Let's use `updateStoryFields` but I need to make sure strict types don't block me.
      // The updateStoryFields takes specific keys. I should update that action to allow family_notes.
      // I will implement the UI and then fix the action.
      
      try {
          const result = await updateStoryFields(contact.id, { family_notes: householdNotes });
          if (result.success) {
            // toast.success("Saved");
          } else {
             toast.error("Failed to save notes");
          }
      } catch (e) {
          console.error("Save failed", e);
      }
  };


  const partners = members.filter(m => ['Spouse', 'Partner', 'Wife', 'Husband'].map(r => r.toLowerCase()).includes(m.relationship.toLowerCase()));
  const children = members.filter(m => ['Child', 'Son', 'Daughter', 'Kid', 'Children'].map(r => r.toLowerCase()).includes(m.relationship.toLowerCase()));
  // Could handle Parents/Siblings too if needed, but per prompt focus on Inner Circle (Partner/Child)

  console.log('🔍 [DEBUG] FamilyTab - Total members:', members.length, 'Partners:', partners.length, 'Children:', children.length);
  console.log('🔍 [DEBUG] FamilyTab - Raw members:', JSON.stringify(members, null, 2));

  return (
    <div className="flex flex-col gap-8 pb-20 text-slate-200">

      {/* HOUSEHOLD CONTEXT */}
       <div className="group">
        <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
           <Home size={14} /> Household Context
        </label>
        <textarea 
          placeholder="Lives in the suburbs? Likes hosting BBQs? Any pets?"
          className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[80px] text-sm resize-none"
          value={householdNotes}
          onChange={(e) => setHouseholdNotes(e.target.value)}
          onBlur={handleSaveHouseholdNotes}
        />
      </div>

      
      {/* PARTNER SECTION */}
      <section className="bg-slate-900/30 border border-slate-800 rounded-3xl p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-pink-500 to-indigo-500 opacity-20" />
        
        <div className="flex justify-between items-center mb-4">
          <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <Heart size={14} className="text-pink-500"/> Partner
          </label>
           {partners.length === 0 && (
             <button onClick={() => handleAddMember('Partner')} className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded-lg transition-colors border border-slate-700">
                + Add Partner
             </button>
           )}
        </div>
        
        {partners.length > 0 ? (
           partners.map((partner, idx) => {
             const realIdx = members.indexOf(partner);
             return (
                <div key={idx} className="space-y-4">
                    <div className="flex gap-4">
                         <div className="flex-1">
                            <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Name</label>
                            <input 
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                                placeholder="Name"
                                value={partner.name}
                                onChange={(e) => handleUpdateMember(realIdx, 'name', e.target.value)}
                            />
                         </div>
                         <div className="w-1/3">
                            <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Birthday</label>
                            <input 
                                type="date"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-indigo-500"
                                value={partner.birthday || ''}
                                onChange={(e) => handleUpdateMember(realIdx, 'birthday', e.target.value)}
                            />
                         </div>
                    </div>
                    {/* Anniversary Field */}
                    <div className="mb-2">
                         <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Anniversary (Yearly Reminder)</label>
                         <input 
                             type="date"
                             className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-indigo-500"
                             value={partner.anniversary || ''}
                             onChange={(e) => handleUpdateMember(realIdx, 'anniversary', e.target.value)}
                         />
                    </div>
                    {/* Partner Notes */}
                    <div>
                         <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Notes & Brain Dump</label>
                         <textarea 
                             className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 min-h-[60px] resize-none"
                             placeholder="Anniversary ideas, food allergies, work info..."
                             value={partner.notes || ''}
                             onChange={(e) => handleUpdateMember(realIdx, 'notes', e.target.value)}
                         />
                    </div>
                </div>
             );
           })
        ) : (
             <div className="text-center py-4 border border-dashed border-slate-800 rounded-xl">
                 <p className="text-xs text-slate-600">No partner listed</p>
             </div>
        )}
      </section>

      {/* CHILDREN SECTION */}
      <section className="bg-slate-900/30 border border-slate-800 rounded-3xl p-5 relative">
         <div className="flex justify-between items-center mb-4">
          <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <User size={14} className="text-blue-400"/> Children
          </label>
          <button onClick={() => handleAddMember('Child')} className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded-lg transition-colors border border-slate-700">
             + Add Child
          </button>
        </div>

        <div className="space-y-4">
            {children.length > 0 ? (
                children.map((child, idx) => {
                     const realIdx = members.indexOf(child);
                     return (
                        <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl relative group">
                             <button 
                                onClick={() => handleRemoveMember(realIdx)}
                                className="absolute top-2 right-2 text-slate-700 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                <X size={14} />
                             </button>

                             <div className="flex gap-3 mb-3">
                                 <input 
                                    className="flex-1 bg-transparent text-white font-bold placeholder:text-slate-600 focus:outline-none border-b border-transparent focus:border-indigo-500/50 transition-colors" 
                                    placeholder="Child Name"
                                    value={child.name}
                                    onChange={(e) => handleUpdateMember(realIdx, 'name', e.target.value)}
                                 />
                                  <input 
                                    type="date"
                                    className="bg-transparent text-xs text-slate-500 focus:outline-none w-24"
                                    value={child.birthday || ''}
                                    onChange={(e) => handleUpdateMember(realIdx, 'birthday', e.target.value)}
                                  />
                             </div>
                             
                             <textarea 
                                className="w-full bg-slate-900 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none border border-slate-800 focus:border-indigo-500/30 resize-none" 
                                placeholder="Age, Grade, Interests (e.g. Soccer, Minecraft)..."
                                value={child.notes || ''}
                                onChange={(e) => handleUpdateMember(realIdx, 'notes', e.target.value)}
                             />
                        </div>
                     );
                })
            ) : (
                <div className="text-center py-4 border border-dashed border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-600">No children listed</p>
                </div>
            )}
        </div>
      </section>

      {/* CONNECTIONS WEB */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
         <label className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-4 block">The Web (Connections)</label>
         
         <div className="space-y-2">
            {(contact.connections || []).length > 0 ? (
                (contact.connections || []).map((conn) => (
                    <Link href={`/contacts/${conn.person.id}`} key={conn.id} className="flex items-center gap-3 p-3 bg-slate-950 hover:bg-slate-800 rounded-2xl border border-slate-800 transition-colors group">
                        <div className="relative w-8 h-8 rounded-full bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-500">
                            {conn.person.photo_url ? (
                                <Image 
                                  src={conn.person.photo_url} 
                                  alt={conn.person.name} 
                                  fill
                                  className="object-cover"
                                />
                            ) : (
                                <span>{conn.person.name?.[0]}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-300 truncate group-hover:text-indigo-400 transition-colors">{conn.person.name}</h4>
                            <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider">
                                {conn.relationship_type} 
                                {conn.context && <span className="text-slate-600 normal-case ml-1">• {conn.context}</span>}
                            </p>
                        </div>
                    </Link>
                ))
            ) : (
                <p className="text-xs text-slate-500 italic p-2">No network connections.</p>
            )}
         </div>
      </section>

    </div>
  );
}
