export interface Contact {
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
    method: 'phone' | 'email' | 'text' | 'in-person' | 'video' | 'linkedin' | 'other';
    daysAgo?: number; // Optional, can be calculated
    status?: 'good' | 'warning' | 'overdue' | 'never'; // Optional, can be calculated
  };
  email?: string;
  phone?: string;
  notes?: string;
  birthday?: string; // ISO date string YYYY-MM-DD
}

export const mockContacts: Contact[] = [
  {
    id: 1,
    name: "Sarah Chen",
    initials: "SC",
    photo: null,
    role: "Software Engineer",
    location: "Austin, TX",
    interests: ["fishing", "coffee", "guitar"],
    tags: ["Work", "Friend"],
    lastContact: {
      date: "2024-02-03",
      method: "phone"
    },
    email: "sarah.chen@email.com",
    phone: "(555) 123-4567",
    notes: "Met at tech conference. Great collaborator on side projects.",
    birthday: "1990-05-15"
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
    lastContact: {
      date: "2024-01-17",
      method: "email"
    },
    email: "mike.j@email.com",
    phone: "(555) 234-5678",
    notes: "Former coworker. Should catch up soon!",
    birthday: "1988-11-20"
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
    lastContact: {
      date: "2024-02-15",
      method: "text"
    },
    email: "emma.davis@email.com",
    phone: "(555) 345-6789",
    notes: "Design mentor. Coffee every month."
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
    lastContact: {
      date: "2024-01-20",
      method: "in-person"
    },
    email: "tom.hall@email.com",
    phone: "(555) 456-7890",
    notes: "Business advisor. Quarterly check-ins."
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
    lastContact: {
      date: "2024-02-10",
      method: "video"
    },
    email: "alex.kim@email.com",
    phone: "(555) 567-8901",
    notes: "University friend. Video calls monthly."
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
    lastContact: {
      date: "2024-02-14",
      method: "phone"
    },
    email: "david.w@email.com",
    phone: "(555) 678-9012",
    notes: "Helped us find our house. Great local contact."
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
    lastContact: {
      date: "2024-02-12",
      method: "email"
    },
    email: "lisa.m@email.com",
    phone: "(555) 789-0123",
    notes: "Marketing lead at previous company."
  },
  {
    id: 8,
    name: "James Brown",
    initials: "JB",
    photo: null,
    role: "Teacher",
    location: "Austin, TX",
    interests: ["guitar", "hiking", "photography"],
    tags: ["Friend", "Neighbor"],
    lastContact: {
      date: "2024-02-16",
      method: "in-person"
    },
    email: "james.b@email.com",
    phone: "(555) 890-1234",
    notes: "Neighbor. Weekend hiking buddy."
  }
];
