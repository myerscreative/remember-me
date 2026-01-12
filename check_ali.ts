
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manual env parser
const envConfig: any = {};
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      envConfig[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, ''); // strip quotes
    }
  });
} catch (err) {
  console.error("Could not read .env.local", err);
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAli() {
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .ilike('name', '%Ali%')
    .single();

  if (error) {
    console.error("Error fetching Ali:", error);
    return;
  }

  console.log('--- DATA FOR ALI ---');
  console.log('ID:', data.id);
  console.log('Name:', data.name);
  console.log('Notes (Length):', data.notes ? data.notes.length : 0);
  console.log('Deep Lore (Length):', data.deep_lore ? data.deep_lore.length : 0);
  console.log('Relationship Summary (Length):', data.relationship_summary ? data.relationship_summary.length : 0);
  
  console.log('\n--- CONTENT SNIPPETS ---');
  if (data.notes) console.log('NOTES:', data.notes.substring(0, 100) + '...');
  if (data.deep_lore) console.log('DEEP LORE:', data.deep_lore.substring(0, 100) + '...');
  if (data.relationship_summary) console.log('RELATIONSHIP SUMMARY:', data.relationship_summary.substring(0, 100) + '...');
}

checkAli();
