'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Plus, UserPlus, Heart, Loader2, Trash2 } from 'lucide-react';
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
import toast from 'react-hot-toast';

interface FamilyTabProps {
  contactId: string;
  contactName: string;
}

// Health status color mapping
const HEALTH_COLORS: Record<HealthStatus, string> = {
  BLOOMING: 'bg-green-500',
  NOURISHED: 'bg-lime-500',
  THIRSTY: 'bg-yellow-500',
  FADING: 'bg-orange-500',
};

export function FamilyTab({ contactId, contactName }: FamilyTabProps) {
  const [relationships, setRelationships] = useState<LinkedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRelationships = async () => {
    setLoading(true);
    const result = await getRelationshipsForContact(contactId);
    if (result.success) {
      setRelationships(result.relationships);
    } else {
      toast.error(result.error || 'Failed to load relationships');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRelationships();
  }, [contactId]);

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
      ) : (
        /* Relationship list grouped by type */
        <div className="space-y-6">
          {Object.entries(groupedRelationships).map(([type, contacts]) => (
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
                          className={`w-3 h-3 rounded-full ${HEALTH_COLORS[health.status]} flex-shrink-0`}
                          title={`${health.status} - ${health.daysSince} days since contact`}
                        />
                        
                        <Avatar className="h-10 w-10 flex-shrink-0">
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
    </div>
  );
}
