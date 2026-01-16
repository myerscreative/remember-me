
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envConfig: Record<string, string> = {};

envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    envConfig[key] = value;
  }
});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkColumns() {
  console.log('Checking columns for "interactions" table...');
  
  // Try fetching one row to see keys
  const { data: rowData, error: rowError } = await supabase.from('interactions').select('*').limit(1);
  
  if (rowError) { 
      console.error("Row fetch error:", rowError); 
      return; 
  }
  
  if (rowData && rowData.length > 0) {
      console.log("Columns found in row:", Object.keys(rowData[0]));
  } else {
      console.log("Table exists but is empty. Cannot deduce columns from row.");
      // Try inserting with 'date' to see if it fails
      console.log("Attempting test insert with 'date'...");
      const { error: insertError } = await supabase.from('interactions').insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Forces error, but check MESSAGE
          person_id: '00000000-0000-0000-0000-000000000000',
          type: 'other',
          date: new Date().toISOString()
      });
      console.log("Insert result/error:", insertError ? insertError.message : "Success (unexpected)");
  }
}

checkColumns();
