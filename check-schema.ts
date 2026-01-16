import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // OR SERVICE_ROLE_KEY if available in env

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log("Checking 'interactions' table...");
  
  // Try to select one row and see the keys
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error selecting from interactions:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log("Columns found in 'interactions' table:", Object.keys(data[0]));
  } else {
    console.log("No data found in 'interactions' table to infer columns.");
    // Try inserting a dummy row to fail and see error? No, safer to just read.
  }
}

checkSchema();
