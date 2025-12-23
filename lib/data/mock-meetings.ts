export const mockUpcomingMeetings = [
  {
    id: "meeting_1",
    title: "Product Strategy Discussion",
    startTime: "2024-02-17T14:00:00Z", // Today at 2:00 PM
    endTime: "2024-02-17T15:00:00Z",
    location: "Zoom Meeting",
    locationUrl: "https://zoom.us/j/123456789",
    
    contact: {
      id: "1",
      name: "Sarah Chen",
      initials: "SC",
      role: "Software Engineer",
      company: "TechCorp",
      email: "sarah.chen@email.com",
      phone: "(555) 123-4567",
      location: "Austin, TX",
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      
      // The Story
      whereWeMet: "Tech Conference Austin",
      whenWeMet: "March 2024",
      howWeMet: "Sat next to each other at AI development panel discussion",
      
      whatWeTalkedAbout: [
        "Her side project building AI productivity tools",
        "Both passionate about weekend fishing trips",
        "She's learning to play guitar",
        "Recent move from San Francisco to Austin"
      ],
      
      whyStayInContact: "Potential collaboration on AI project. Great technical insights and similar work philosophy.",
      
      whatMattersToThem: [
        "Work-life balance is top priority",
        "Daughter Emma (7 years old) just started piano lessons",
        "Recently bought house in Austin suburbs",
        "Looking for good local fishing spots",
        "Wants to build meaningful AI tools, not just hype"
      ],
      
      interests: ["fishing", "coffee", "guitar", "AI/ML", "hiking"],
      tags: ["Work", "Potential Collaborator", "Friend"],
      
      // Last contact
      lastContact: {
        date: "2024-02-03",
        method: "phone",
        daysAgo: 14,
        status: "good",
        notes: "Discussed collaboration timeline and next steps. She's excited about the project direction."
      }
    },
    
    // AI-generated conversation starters
    conversationStarters: [
      "How's Emma enjoying her piano lessons? Is she loving it so far?",
      "Have you discovered any hidden fishing gems around Austin yet?",
      "How's that AI productivity tool project coming along?",
      "How are you and your family settling into the new house in the suburbs?"
    ],
    
    // Mutual connections
    mutualConnections: [
      {
        id: "2",
        name: "Mike Johnson",
        initials: "MJ",
        role: "Product Manager",
        sharedInterests: ["fishing", "guitar"],
        matchReason: "Both love fishing and guitar - you should connect them for a jam session or fishing trip!",
        matchScore: 4
      },
      {
        id: "8",
        name: "James Brown",
        initials: "JB",
        role: "Teacher",
        sharedInterests: ["guitar", "hiking"],
        matchReason: "Both into guitar and hiking - could organize a hiking trip with guitars!",
        matchScore: 3
      }
    ],
    
    // Meeting metadata
    isFirstMeeting: false,
    importance: "high",
    meetingType: "follow-up",
    prepStatus: "ready"
  },
  
  {
    id: "meeting_2",
    title: "Coffee Catch-up",
    startTime: "2024-02-18T10:00:00Z", // Tomorrow at 10:00 AM
    endTime: "2024-02-18T11:00:00Z",
    location: "Starbucks on 6th Street",
    locationUrl: null,
    
    contact: {
      id: "2",
      name: "Mike Johnson",
      initials: "MJ",
      role: "Product Manager",
      company: "StartupXYZ",
      email: "mike.j@email.com",
      phone: "(555) 234-5678",
      location: "Austin, TX",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      
      whereWeMet: "Previous Company",
      whenWeMet: "January 2023",
      howWeMet: "Worked together on product launch team",
      
      whatWeTalkedAbout: [
        "Product strategy and roadmap planning",
        "Shared love of weekend fishing trips",
        "His band's upcoming gigs",
        "Career growth and future opportunities"
      ],
      
      whyStayInContact: "Former coworker and friend. Great product insights and fun to hang out with.",
      
      whatMattersToThem: [
        "Building his own startup on the side",
        "Plays guitar in a local band",
        "Passionate about fly fishing",
        "Recently bought a fishing boat",
        "Mentoring junior PMs"
      ],
      
      interests: ["fishing", "guitar", "hiking", "product management", "startups"],
      tags: ["Work", "Friend", "Former Colleague"],
      
      lastContact: {
        date: "2024-01-17",
        method: "email",
        daysAgo: 31,
        status: "overdue",
        notes: "Discussed his product launch plans. Should follow up on how it went."
      }
    },
    
    conversationStarters: [
      "How did that product launch go? I've been meaning to ask!",
      "Are you still planning that big fishing trip you mentioned?",
      "How's the band doing? Any gigs coming up?",
      "How's the startup side project progressing?"
    ],
    
    mutualConnections: [
      {
        id: "1",
        name: "Sarah Chen",
        initials: "SC",
        role: "Software Engineer",
        sharedInterests: ["fishing", "guitar"],
        matchReason: "Both love fishing and guitar - plus Sarah is looking for fishing spots!",
        matchScore: 4
      }
    ],
    
    isFirstMeeting: false,
    importance: "normal",
    meetingType: "catch-up",
    prepStatus: "ready"
  },
  
  {
    id: "meeting_3",
    title: "First Meeting - Investor Intro",
    startTime: "2024-02-20T15:00:00Z", // In 3 days at 3:00 PM
    endTime: "2024-02-20T16:00:00Z",
    location: "Video Call",
    locationUrl: null,
    
    contact: {
      id: "9",
      name: "Jennifer Martinez",
      initials: "JM",
      role: "Venture Partner",
      company: "Growth Capital Partners",
      email: "jennifer@growthcap.com",
      phone: "(555) 999-8888",
      location: "San Francisco, CA",
      photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      
      whereWeMet: "LinkedIn Introduction",
      whenWeMet: "February 2024",
      howWeMet: "Mutual connection Tom Hall introduced us via LinkedIn message",
      
      whatWeTalkedAbout: [
        "Her interest in AI/ML startups",
        "Portfolio companies in similar space",
        "Investment thesis for early-stage companies"
      ],
      
      whyStayInContact: "Potential investor connection. Tom highly recommended speaking with her.",
      
      whatMattersToThem: [
        "Focus on B2B SaaS with AI components",
        "Looks for strong technical founding teams",
        "Values product-market fit over vanity metrics",
        "Prefers warm introductions over cold outreach"
      ],
      
      interests: ["venture capital", "AI/ML", "B2B SaaS", "mentoring founders"],
      tags: ["Investor", "New Connection", "Important"],
      
      lastContact: {
        date: null,
        method: null,
        daysAgo: null,
        status: "never",
        notes: null
      }
    },
    
    conversationStarters: [
      "Tom spoke very highly of you - thank you for taking the time to connect",
      "I'm curious about your investment thesis around AI tools for professionals",
      "What excites you most about the current AI/ML landscape?",
      "What qualities do you look for in founding teams?"
    ],
    
    mutualConnections: [
      {
        id: "4",
        name: "Tom Hall",
        initials: "TH",
        role: "Entrepreneur",
        sharedInterests: ["startups", "venture capital"],
        matchReason: "Tom introduced you - he's a mutual connection and could provide context",
        matchScore: 5
      }
    ],
    
    isFirstMeeting: true,
    importance: "critical",
    meetingType: "first-meeting",
    prepStatus: "ready"
  }
];

// Helper types
export type MockMeeting = typeof mockUpcomingMeetings[0];
export type MockContact = MockMeeting['contact'];
