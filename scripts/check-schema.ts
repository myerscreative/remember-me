
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking interactions table schema...');
  
  // Try to select one row to see what columns come back
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error selecting from interactions:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Sample Row Keys:', Object.keys(data[0]));
  } else {
    console.log('Table exists but is empty. Cannot infer keys from data.');
  }
}

checkSchema();
