'use server'

import { createClient } from '@/lib/supabase/server'

export async function autoCategorizeTags() {
  const supabase = await createClient()

  // Define the mapping logic
  const mappings: Record<string, string[]> = {
    Travel: ['japan', 'europe', 'vacation', 'trip', 'flight', 'hotel', 'travel', 'visit'],
    Interests: ['basketball', 'tennis', 'golf', 'photography', 'cooking', 'sports', 'music', 'art', 'reading', 'book'],
    Work: ['colleague', 'nasa', 'tech', 'client', 'office', 'window', 'door', 'dealer', 'manager', 'ceo', 'founder', 'business'],
    Relationships: ['family', 'brother', 'sister', 'parent', 'mother', 'father', 'son', 'daughter', 'wife', 'husband', 'partner', 'mentor', 'spouse'],
    Friends: ['neighborhood', 'college', 'school', 'friend', 'roommate', 'classmate']
  };

  try {
    // Define types for database records
    type TagDomain = { id: string; name: string; icon?: string; color?: string };
    type Interest = { id: string; name: string; domain_id?: string | null };
    type Tag = { id: string; name: string; domain_id?: string | null };
    
    // 1. Fetch domains
    const { data: domains, error: domainsError } = await supabase
      .from('tag_domains')
      .select('*')
      .returns<TagDomain[]>();
      
    if (domainsError || !domains || domains.length === 0) {
      throw new Error('No domains found');
    }

    // 2. Fetch interests and tags
    const { data: interests } = await supabase
      .from('interests')
      .select('*')
      .is('domain_id', null)
      .returns<Interest[]>();
      
    const { data: tags } = await supabase
      .from('tags')
      .select('*')
      .is('domain_id', null)
      .returns<Tag[]>();

    let updatedCount = 0;

    // Helper to categorize items
    type ItemWithName = { id: string; name: string };
    
    const categorizeItems = async (items: ItemWithName[] | null, table: 'interests' | 'tags') => {
      if (!items || items.length === 0) return;
      
      for (const item of items) {
        let domainName = 'Friends'; // Default fallback? Or maybe leave null if no match? 
        // User requested: "Friends" as fallback in sample code
        // But maybe safer to map specific ones and default to something broad like Friends or just General if mapped.
        
        let found = false;

        for (const [domain, keywords] of Object.entries(mappings)) {
          if (keywords.some(k => item.name.toLowerCase().includes(k))) {
            domainName = domain;
            found = true;
            break;
          }
        }
        
        // If not found, let's default to Friends as per user example, 
        // or maybe 'Interests' if it's in the interests table? 
        // Let's stick to the prompt's logic which used Friends as fallback.
        if (!found && table === 'interests') domainName = 'Interests'; // Slight deviation: logic dictates interest -> interest domain default seems safer?
        if (!found && table === 'tags') domainName = 'Friends'; // Tag -> Friend default?

        // Override: if nothing matched, use 'Friends' as the prompt suggested explicitly: "let domainName = 'Friends';"
        if (!found) domainName = 'Friends';

        const domainId = domains.find(d => d.name === domainName)?.id;
        
        if (domainId) {
          const { error } = await supabase
            .from(table)
            .update({ domain_id: domainId } as never)
            .eq('id', item.id);
            
          if (!error) updatedCount++;
        }
      }
    }

    await categorizeItems(interests, 'interests');
    await categorizeItems(tags, 'tags');

    return { success: true, count: updatedCount };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Auto-categorize failed:', error);
    return { success: false, error: errorMessage };
  }
}
