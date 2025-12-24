'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Plus, UserPlus, Heart, Loader2, Trash2, Edit2, Calendar, Star } from 'lucide-react';
import Link from 'next/link';
import { 
  getRelationshipsForContact, 
  deleteRelationship
} from '@/app/actions/relationships';
import { RELATIONSHIP_LABELS } from '@/lib/relationship-utils';
import { getRelationshipHealth, type HealthStatus } from '@/lib/relationship-health';
import type { LinkedContact, RelationshipRole } from '@/types/database.types';
import { AddRelationshipModal } from './AddRelationshipModal';
import { GroupInteractionModal } from './GroupInteractionModal';
import { EditFamilyMemberModal } from './EditFamilyMemberModal';
import { updateFamilyMembers } from '@/app/actions/update-family-members';
import toast from 'react-hot-toast';

interface FamilyMember {
  name: string;
  relationship: string;
  birthday?: string;
  hobbies?: string;
  interests?: string;
}

interface FamilyTabProps {
  contactId: string;
  contactName: string;
  familyMembers?: FamilyMember[];
}

// Health status color mapping
const HEALTH_COLORS: Record<HealthStatus, string> = {
  BLOOMING: 'bg-green-500',
  NOURISHED: 'bg-lime-500',
  THIRSTY: 'bg-yellow-500',
  FADING: 'bg-orange-500',
};

import { useRouter } from 'next/navigation';

export function FamilyTab({ contactId, contactName, familyMembers }: FamilyTabProps) {
  const router = useRouter();
  const [relationships, setRelationships] = useState<LinkedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localFamilyMembers, setLocalFamilyMembers] = useState<FamilyMember[]>([]);

  // Sync family members when prop changes
  useEffect(() => {
    if (familyMembers) {
      setLocalFamilyMembers(familyMembers);
    }
  }, [familyMembers]);

  const fetchRelationships = useCallback(async () => {
    setLoading(true);
    const result = await getRelationshipsForContact(contactId);
    if (result.success) {
      setRelationships(result.relationships);
    } else {
      toast.error(result.error || 'Failed to load relationships');
    }
    setLoading(false);
  }, [contactId]);

  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  const handleDelete = async (relationshipId: string, name: string) => {
    if (!confirm(`Remove relationship with ${name}?`)) return;
    
    setDeletingId(relationshipId);
    const result = await deleteRelationship(relationshipId);
    
    if (result.success) {
      setRelationships(prev => prev.filter(r => r.relationship_id !== relationshipId));
      toast.success('Relationship removed');
    } else {
      toast.error(result.error || 'Failed to remove relationship');
    }
    setDeletingId(null);
  };

  const handleRelationshipAdded = () => {
    fetchRelationships();
    setShowAddModal(false);
    toast.success('Relationship added');
  };

  const handleGroupInteractionComplete = () => {
    fetchRelationships(); // Refresh to update health indicators
    setShowGroupModal(false);
  };

  // Group relationships by type for organized display
  const groupedRelationships = relationships.reduce((acc, rel) => {
    const type = rel.relationship_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(rel);
    return acc;
  }, {} as Record<RelationshipRole, LinkedContact[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Family & Connections
          </h2>
        </div>
        <div className="flex gap-2">
          {relationships.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGroupModal(true)}
              className="flex items-center gap-2"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Log Group Interaction</span>
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Relationship</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedMemberIndex(null);
              setShowEditMemberModal(true);
            }}
            className="flex items-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Family Detail</span>
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {relationships.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-[#252931] rounded-2xl border border-dashed border-gray-200 dark:border-[#3a3f4b]">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No connections yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Link {contactName} to other people in your Garden to build a relationship web.
          </p>
          <Button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add First Connection
          </Button>
        </div>
      ) : null}

      {/* Static Family Members from Voice/Import */}
      {localFamilyMembers && localFamilyMembers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-purple-500" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Family & Close Circle (Context)
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {localFamilyMembers.map((member, idx) => (
              <div 
                key={idx} 
                className="group relative flex flex-col bg-white dark:bg-[#1a1d24]/60 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-xl hover:border-purple-200/50 dark:hover:border-purple-500/30 transition-all duration-300 overflow-hidden"
              >
                {/* Accent Top Border */}
                <div className="h-1.5 w-full bg-linear-to-r from-purple-500 to-indigo-500 opacity-70" />
                
                <div className="p-5 flex-1 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-white dark:border-[#2d333b] shadow-sm">
                          <AvatarFallback className="bg-linear-to-br from-purple-100 to-indigo-100 text-purple-700 font-semibold">
                            {member.name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#1a1d24] rounded-full p-0.5 shadow-sm border border-gray-100 dark:border-gray-800">
                          <div className={`w-2.5 h-2.5 rounded-full ${member.birthday ? 'bg-blue-500' : 'bg-gray-300'}`} />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white leading-tight">
                          {member.name}
                        </h4>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-500/10 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20">
                          {member.relationship}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                        onClick={() => {
                          setSelectedMemberIndex(idx);
                          setShowEditMemberModal(true);
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                        onClick={async () => {
                          if (!confirm(`Remove ${member.name}?`)) return;
                          const updated = localFamilyMembers.filter((_, i) => i !== idx);
                          const result = await updateFamilyMembers(contactId, updated);
                          if (result.success) {
                            setLocalFamilyMembers(updated);
                            toast.success('Member removed');
                          } else {
                            toast.error('Failed to remove member');
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="space-y-3 mt-1 py-3 border-t border-gray-50 dark:border-gray-800/50 flex-1">
                    {member.birthday ? (
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                          <Calendar className="h-3.5 w-3.5 text-blue-500" />
                        </div>
                        <div className="text-xs">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Birthday</p>
                          <p className="text-gray-700 dark:text-gray-300 font-medium">{member.birthday}</p>
                        </div>
                      </div>
                    ) : null}

                    {member.hobbies ? (
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 mt-0.5">
                          <Heart className="h-3.5 w-3.5 text-rose-500" />
                        </div>
                        <div className="text-xs">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Hobbies</p>
                          <p className="text-gray-700 dark:text-gray-300 line-clamp-2">{member.hobbies}</p>
                        </div>
                      </div>
                    ) : null}

                    {member.interests ? (
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 mt-0.5">
                          <Star className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <div className="text-xs">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Interests</p>
                          <p className="text-gray-700 dark:text-gray-300 line-clamp-2">{member.interests}</p>
                        </div>
                      </div>
                    ) : null}

                    {!member.birthday && !member.hobbies && !member.interests && (
                      <div className="h-full flex flex-col items-center justify-center py-4 text-center opacity-40 italic">
                        <p className="text-[10px] text-gray-400">No additional details</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-[10px] mt-2 hover:bg-gray-100"
                          onClick={() => {
                            setSelectedMemberIndex(idx);
                            setShowEditMemberModal(true);
                          }}
                        >
                          Add info
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked Relationships Grouped */}
      {relationships.length > 0 && (
        <div className="space-y-6">
          {(Object.entries(groupedRelationships) as [RelationshipRole, LinkedContact[]][]).map(([type, contacts]) => (
            <div key={type} className="space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {RELATIONSHIP_LABELS[type as RelationshipRole]}s
              </h3>
              <div className="space-y-2">
                {contacts.map((contact) => {
                  const health = getRelationshipHealth(
                    contact.last_interaction_date,
                    contact.target_frequency_days || 30
                  );

                  return (
                    <div
                      key={contact.relationship_id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#252931] rounded-xl hover:bg-gray-100 dark:hover:bg-[#2d333b] transition-colors group"
                    >
                      <Link 
                        href={`/contacts/${contact.id}`}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        {/* Health indicator dot */}
                        <div 
                          className={`w-3 h-3 rounded-full ${HEALTH_COLORS[health.status]} shrink-0`}
                          title={`${health.status} - ${health.daysSince} days since contact`}
                        />
                        
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={contact.photo_url || undefined} />
                          <AvatarFallback className="bg-indigo-100 text-indigo-600">
                            {contact.first_name?.[0] || contact.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {contact.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {health.daysSince === 999 
                              ? 'Never contacted' 
                              : `${health.daysSince} days ago`}
                          </p>
                        </div>
                      </Link>

                      {/* Fading alert */}
                      {health.status === 'FADING' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 mr-2">
                          Needs attention
                        </span>
                      )}

                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(contact.relationship_id, contact.name);
                        }}
                        disabled={deletingId === contact.relationship_id}
                      >
                        {deletingId === contact.relationship_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AddRelationshipModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        contactId={contactId}
        contactName={contactName}
        onSuccess={handleRelationshipAdded}
      />

      <GroupInteractionModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        contacts={relationships}
        currentContactId={contactId}
        currentContactName={contactName}
        onSuccess={handleGroupInteractionComplete}
      />

      <EditFamilyMemberModal
        isOpen={showEditMemberModal}
        onClose={() => {
          setShowEditMemberModal(false);
        }}
        contactId={contactId}
        familyMembers={localFamilyMembers}
        memberIndex={selectedMemberIndex}
        onSuccess={(updatedMembers) => {
          setLocalFamilyMembers(updatedMembers);
          setShowEditMemberModal(false);
          // Also trigger refresh to ensure server sync
          router.refresh();
        }}
      />
    </div>
  );
}
