'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Filter, Eye, EyeOff } from 'lucide-react';
import { 
  ContactHealth, 
  TreeHealthStatus, 
  ContactCategory,
  ContactHealth as ContactHealthType,
} from './types';
import { 
  calculateDaysSince, 
  calculateTreeHealth, 
  calculateTreeStats 
} from './utils/treeHealthUtils';
import RelationshipTree from './components/RelationshipTree';
import TreeStatsPanel from './components/TreeStats';
import TreeFilters from './components/TreeFilters';
import ActionPanel from './components/ActionPanel';

// Mock data transformer - in production, this would come from Supabase
function transformContactsToTreeFormat(contacts: MockContact[]): ContactHealth[] {
  return contacts.map(contact => {
    const daysAgo = calculateDaysSince(contact.lastContact?.date);
    const healthStatus = calculateTreeHealth(daysAgo);
    
    // Infer category from tags (simplified logic)
    let category: ContactCategory = 'friends';
    if (contact.tags.some(t => t.toLowerCase().includes('work'))) category = 'work';
    else if (contact.tags.some(t => t.toLowerCase().includes('family'))) category = 'family';
    else if (contact.tags.some(t => t.toLowerCase().includes('client'))) category = 'clients';
    else if (contact.tags.some(t => t.toLowerCase().includes('mentor') || t.toLowerCase().includes('network'))) category = 'networking';
    
    return {
      contactId: String(contact.id),
      name: contact.name,
      initials: contact.initials,
      photoUrl: contact.photo,
      lastContactDate: contact.lastContact?.date ? new Date(contact.lastContact.date) : null,
      daysAgo,
      healthStatus,
      category,
      position: { x: 0, y: 0 }, // Will be positioned by the tree
      email: contact.email,
      phone: contact.phone,
    };
  });
}

// Mock contact interface (matches existing mockContacts.ts)
interface MockContact {
  id: number;
  name: string;
  initials: string;
  photo: string | null;
  role: string;
  location: string;
  interests: string[];
  tags: string[];
  lastContact?: {
    date: string;
    method: string;
  };
  email?: string;
  phone?: string;
}

// Mock contacts for demo (same as network page)
const mockContacts: MockContact[] = [
  {
    id: 1,
    name: "Sarah Chen",
    initials: "SC",
    photo: null,
    role: "Software Engineer",
    location: "Austin, TX",
    interests: ["fishing", "coffee", "guitar"],
    tags: ["Work", "Friend"],
    lastContact: { date: "2024-12-15", method: "phone" },
    email: "sarah.chen@email.com",
    phone: "(555) 123-4567",
  },
  {
    id: 2,
    name: "Mike Johnson",
    initials: "MJ",
    photo: null,
    role: "Product Manager",
    location: "Austin, TX",
    interests: ["fishing", "guitar", "hiking"],
    tags: ["Work"],
    lastContact: { date: "2024-11-20", method: "email" },
    email: "mike.j@email.com",
    phone: "(555) 234-5678",
  },
  {
    id: 3,
    name: "Emma Davis",
    initials: "ED",
    photo: null,
    role: "Designer",
    location: "San Francisco, CA",
    interests: ["coffee", "running", "photography"],
    tags: ["Friend"],
    lastContact: { date: "2024-12-10", method: "text" },
    email: "emma.davis@email.com",
    phone: "(555) 345-6789",
  },
  {
    id: 4,
    name: "Tom Hall",
    initials: "TH",
    photo: null,
    role: "Entrepreneur",
    location: "Austin, TX",
    interests: ["startups", "books", "tennis"],
    tags: ["Work", "Mentor"],
    lastContact: { date: "2024-09-15", method: "in-person" },
    email: "tom.hall@email.com",
    phone: "(555) 456-7890",
  },
  {
    id: 5,
    name: "Alex Kim",
    initials: "AK",
    photo: null,
    role: "Data Scientist",
    location: "Seattle, WA",
    interests: ["running", "books", "cooking"],
    tags: ["School", "Friend"],
    lastContact: { date: "2024-12-01", method: "video" },
    email: "alex.kim@email.com",
    phone: "(555) 567-8901",
  },
  {
    id: 6,
    name: "David Wilson",
    initials: "DW",
    photo: null,
    role: "Real Estate Agent",
    location: "Austin, TX",
    interests: ["fishing", "golf", "wine"],
    tags: ["Client"],
    lastContact: { date: "2024-12-14", method: "phone" },
    email: "david.w@email.com",
    phone: "(555) 678-9012",
  },
  {
    id: 7,
    name: "Lisa Martinez",
    initials: "LM",
    photo: null,
    role: "Marketing Director",
    location: "Austin, TX",
    interests: ["coffee", "yoga", "travel"],
    tags: ["Work"],
    lastContact: { date: "2024-10-05", method: "email" },
    email: "lisa.m@email.com",
    phone: "(555) 789-0123",
  },
  {
    id: 8,
    name: "James Brown",
    initials: "JB",
    photo: null,
    role: "Teacher",
    location: "Austin, TX",
    interests: ["guitar", "hiking", "photography"],
    tags: ["Friend", "Family"],
    lastContact: { date: "2024-12-17", method: "in-person" },
    email: "james.b@email.com",
    phone: "(555) 890-1234",
  },
  {
    id: 9,
    name: "Robert Myers",
    initials: "RM",
    photo: null,
    role: "CEO",
    location: "Austin, TX",
    interests: ["startups", "coffee", "travel"],
    tags: ["Mentor", "Network"],
    lastContact: { date: "2024-08-01", method: "email" },
    email: "robert.m@email.com",
    phone: "(555) 901-2345",
  },
  {
    id: 10,
    name: "Jennifer Lee",
    initials: "JL",
    photo: null,
    role: "Investor",
    location: "New York, NY",
    interests: ["finance", "art", "wine"],
    tags: ["Client", "Network"],
    lastContact: { date: "2024-12-12", method: "video" },
    email: "jennifer.l@email.com",
    phone: "(555) 012-3456",
  },
];

export default function RelationshipTreePage() {
  const [showFilters, setShowFilters] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [healthFilters, setHealthFilters] = useState<TreeHealthStatus[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<ContactCategory[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | undefined>();

  // Transform mock contacts to tree format
  const treeContacts = useMemo(() => {
    return transformContactsToTreeFormat(mockContacts);
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    return calculateTreeStats(treeContacts);
  }, [treeContacts]);

  // Filter contacts needing attention (warning, dying, dormant)
  const contactsNeedingAttention = useMemo(() => {
    return treeContacts.filter(c => 
      c.healthStatus === 'warning' || 
      c.healthStatus === 'dying' || 
      c.healthStatus === 'dormant'
    );
  }, [treeContacts]);

  const handleContactClick = (contact: ContactHealthType) => {
    setSelectedContactId(contact.contactId);
    // In production, this would open a contact details drawer/modal
    console.log('Selected contact:', contact.name);
  };

  const handleWaterContact = (contact: ContactHealthType) => {
    // In production, this would open a message composer or log interaction
    console.log('Watering contact:', contact.name);
    alert(`Reaching out to ${contact.name}...`);
  };

  const handleWaterAll = () => {
    // In production, this would open a batch message modal
    console.log('Watering all contacts needing attention');
    alert(`Preparing to reach out to ${contactsNeedingAttention.length} contacts...`);
  };

  const handleClearFilters = () => {
    setHealthFilters([]);
    setCategoryFilters([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                🌳 Relationship Tree
              </h1>
              <p className="text-sm text-gray-500">
                Visualize your network health
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`p-2 rounded-lg transition-colors ${showLabels ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}`}
              title={showLabels ? 'Hide labels' : 'Show labels'}
            >
              {showLabels ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Toggle filters"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tree visualization */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <RelationshipTree
                contacts={treeContacts}
                onContactClick={handleContactClick}
                selectedContactId={selectedContactId}
                healthFilter={healthFilters}
                categoryFilter={categoryFilters}
                showLabels={showLabels}
                className="w-full"
              />
            </div>
          </div>

          {/* Side panels */}
          <div className="space-y-6">
            {/* Filters (collapsible on mobile) */}
            {showFilters && (
              <TreeFilters
                activeHealthFilters={healthFilters}
                activeCategoryFilters={categoryFilters}
                onHealthFilterChange={setHealthFilters}
                onCategoryFilterChange={setCategoryFilters}
                onClearAll={handleClearFilters}
              />
            )}

            {/* Stats panel */}
            <TreeStatsPanel stats={stats} />

            {/* Action panel */}
            <ActionPanel
              contactsNeedingAttention={contactsNeedingAttention}
              onWaterContact={handleWaterContact}
              onWaterAll={handleWaterAll}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
