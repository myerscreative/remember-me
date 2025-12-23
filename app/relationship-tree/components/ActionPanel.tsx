'use client';

import React from 'react';
import { ContactHealth, HEALTH_LABELS, HEALTH_COLORS } from '../types';
import { formatRelativeTime } from '../utils/treeHealthUtils';

interface ActionPanelProps {
  contactsNeedingAttention: ContactHealth[];
  onWaterContact?: (contact: ContactHealth) => void;
  onWaterAll?: () => void;
  className?: string;
}

export default function ActionPanel({
  contactsNeedingAttention,
  onWaterContact,
  onWaterAll,
  className = '',
}: ActionPanelProps) {
  // Sort by urgency (dying first, then warning)
  const sortedContacts = [...contactsNeedingAttention].sort((a, b) => {
    const priority = { dormant: 0, dying: 1, warning: 2, healthy: 3 };
    return priority[a.healthStatus] - priority[b.healthStatus];
  });

  // Take top 5 most urgent
  const topContacts = sortedContacts.slice(0, 5);
  const remainingCount = sortedContacts.length - topContacts.length;

  if (contactsNeedingAttention.length === 0) {
    return (
      <div className={`bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border border-green-200 p-5 ${className}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🌳</span>
          <div>
            <h3 className="text-lg font-semibold text-green-800">Tree is Healthy!</h3>
            <p className="text-sm text-green-600">All your relationships are thriving</p>
          </div>
        </div>
        <p className="text-xs text-green-500 mt-3">
          Keep up the great work! Check back soon to maintain your connections.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">💧</span>
          <h3 className="text-lg font-semibold text-gray-800">Water Your Tree</h3>
        </div>
        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
          {contactsNeedingAttention.length} need attention
        </span>
      </div>
      
      {/* Description */}
      <p className="text-sm text-gray-500 mb-4">
        These relationships need your attention. Reach out to turn their leaves green!
      </p>

      {/* Contact list */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {topContacts.map(contact => (
          <ActionContactItem
            key={contact.contactId}
            contact={contact}
            onWater={onWaterContact}
          />
        ))}
      </div>

      {/* Show remaining count */}
      {remainingCount > 0 && (
        <p className="text-xs text-gray-400 text-center mt-3">
          +{remainingCount} more contacts need attention
        </p>
      )}

      {/* Water All Button */}
      {contactsNeedingAttention.length > 1 && (
        <button
          onClick={onWaterAll}
          className="w-full mt-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          💧 Water All ({contactsNeedingAttention.length} contacts)
        </button>
      )}
    </div>
  );
}

interface ActionContactItemProps {
  contact: ContactHealth;
  onWater?: (contact: ContactHealth) => void;
}

function ActionContactItem({ contact, onWater }: ActionContactItemProps) {
  const { emoji } = HEALTH_LABELS[contact.healthStatus];
  const color = HEALTH_COLORS[contact.healthStatus];
  
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {contact.initials}
        </div>
        
        {/* Info */}
        <div>
          <p className="font-medium text-gray-800 flex items-center gap-1.5">
            {contact.name}
            <span>{emoji}</span>
          </p>
          <p className="text-xs text-gray-500">
            {formatRelativeTime(contact.daysAgo)}
          </p>
        </div>
      </div>
      
      {/* Action button */}
      <button
        onClick={() => onWater?.(contact)}
        className="px-3 py-1.5 bg-blue-100 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors"
      >
        Reach out
      </button>
    </div>
  );
}
