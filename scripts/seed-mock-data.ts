
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const MOCK_CONTACTS = [
  {
    name: "Sarah Chen",
    role: "Software Engineer",
    tags: ["Work", "Friend"],
    lastContact: { date: "2024-12-15", method: "phone" },
    interest: "fishing",
    frequency: 30
  },
  {
    name: "Mike Johnson",
    role: "Product Manager",
    tags: ["Work"],
    lastContact: { date: "2024-11-20", method: "email" },
    interest: "guitar",
    frequency: 14
  },
  {
    name: "Emma Davis",
    role: "Designer",
    tags: ["Friend"],
    lastContact: { date: "2025-01-05", method: "text" },
    interest: "running",
    frequency: 7
  },
  {
    name: "Tom Hall",
    role: "Entrepreneur",
    tags: ["Work", "Mentor"],
    lastContact: { date: "2024-10-10", method: "in-person" },
    interest: "startups",
    frequency: 90
  },
  {
    name: "Alex Kim",
    role: "Data Scientist",
    tags: ["School", "Friend"],
    lastContact: { date: "2025-01-10", method: "video" },
    interest: "cooking",
    frequency: 30
  },
  {
    name: "David Wilson",
    role: "Real Estate Agent",
    tags: ["Client"],
    lastContact: { date: "2024-12-01", method: "phone" },
    interest: "wine",
    frequency: 60
  },
  {
    name: "Lisa Martinez",
    role: "Marketing Director",
    tags: ["Work"],
    lastContact: { date: "2024-12-20", method: "email" },
    interest: "yoga",
    frequency: 45
  },
  {
    name: "James Brown",
    role: "Teacher",
    tags: ["Friend", "Neighbor"],
    lastContact: { date: "2025-01-08", method: "in-person" },
    interest: "hiking",
    frequency: 14
  }
];

async function seed() {
  console.log('🌱 Starting seed...');

  // 1. Get User
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  
  let userId;
  if (users && users.length > 0) {
    userId = users[0].id;
    console.log(`👤 Using existing user: ${users[0].email} (${userId})`);
  } else {
    console.log('👤 No users found. Creating test user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'password123',
      email_confirm: true
    });
    if (createError) throw createError;
    userId = newUser.user.id;
    console.log(`✅ Created user: test@example.com (${userId})`);
  }

  // 2. Insert Contacts
  console.log('📝 inserting contacts...');
  
  for (const contact of MOCK_CONTACTS) {
    const [firstName, ...rest] = contact.name.split(' ');
    const lastName = rest.join(' ');
    
    // Create Person
    const { data: person, error: personError } = await supabase
      .from('persons')
      .insert({
        user_id: userId,
        name: contact.name,
        first_name: firstName,
        last_name: lastName,
        job_title: contact.role,
        last_interaction_date: contact.lastContact.date,
        last_contact: contact.lastContact.date, // legacy field sync
        last_contact_method: contact.lastContact.method,
        target_frequency_days: contact.frequency,
        importance: 'medium',
        notes: `Interests: ${contact.interest}. Role: ${contact.role}`,
        story_completeness: 50
      })
      .select()
      .single();

    if (personError) {
      console.error(`❌ Failed to insert ${contact.name}:`, personError.message);
      continue;
    }
    console.log(`✅ Added ${contact.name}`);
  }

  console.log('✨ Seed complete!');
}

seed().catch(console.error);
