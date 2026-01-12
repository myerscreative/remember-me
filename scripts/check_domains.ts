
import { createClient } from '@supabase/supabase-js';
// dotenv removed

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('--- Checking Domains ---');
  const { data: domains, error: domainError } = await supabase
    .from('tag_domains')
    .select('*');
  
  if (domainError) console.error(domainError);
  console.table(domains);

  console.log('\n--- Checking Tags (Sample) ---');
  const { data: tags, error: tagError } = await supabase
    .from('tags')
    .select('*')
    .limit(10);

  if (tagError) console.error(tagError);
  console.table(tags);

  console.log('\n--- Checking Interests (Sample) ---');
  const { data: interests, error: interestError } = await supabase
    .from('interests')
    .select('*')
    .limit(10);
  
  if (interestError) console.error(interestError);
  console.table(interests);
}

checkData();
