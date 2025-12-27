
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env parsing
const envPath = path.resolve(process.cwd(), '.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  console.error('Could not read .env.local');
}

const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDB() {
  // 1. Count Total
  const { count, error: countError } = await supabase
    .from('persons')
    .select('*', { count: 'exact', head: true });
    
  if (countError) {
    console.error('Error counting:', countError);
  } else {
    console.log(`Total Persons Count: ${count}`);
  }

  // 2. Search for mock names
  const mockNames = ['John Smith', 'Jane Doe', 'Alice Johnson', 'Bob Wilson', 'Carol White'];
  const { data: mocks, error: mockError } = await supabase
    .from('persons')
    .select('id, name')
    .in('name', mockNames);
    
  if (mockError) {
    console.error('Error checking mocks:', mockError);
  } else {
    console.log(`Found Mock Contacts:`, JSON.stringify(mocks));
  }
}

checkDB();
