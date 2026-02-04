'use server';

/**
 * One-time script to reprocess existing brain dumps
 * This will extract structured data from shared_memories that were created before AI processing was added
 */

import { createClient } from '@/lib/supabase/server';
import { processMemory } from './process-memory';

export async function reprocessExistingMemories(personId: string, preview = false) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Fetch all shared memories for this person
    const { data: memories, error } = await (supabase as any)
      .from('shared_memories')
      .select('id, content, created_at')
      .eq('person_id', personId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching memories:', error);
      return { success: false, error: error.message };
    }

    if (!memories || memories.length === 0) {
      return { success: true, message: 'No memories to process' };
    }

    console.log(`🔄 Reprocessing ${memories.length} memories for person ${personId}`);

    // Process each memory
    let successCount = 0;
    let errorCount = 0;
    let mergedData: any = {};

    for (const memory of memories) {
      try {
        console.log(`Processing memory ${memory.id}: "${memory.content.substring(0, 50)}..."`);
        const result = await processMemory(personId, memory.content, !preview);
        
        if (preview && result.extracted) {
          // Merge extracted data (later values override earlier ones)
          mergedData = {
            ...mergedData,
            ...result.extracted,
          };
          
          // For family_members, deduplicate by name (case-insensitive)
          if (result.extracted.family_members && result.extracted.family_members.length > 0) {
            const existingFamily = mergedData.family_members || [];
            const newMembers = result.extracted.family_members;
            
            for (const newMember of newMembers) {
              const existingIndex = existingFamily.findIndex(
                (m: any) => m.name.toLowerCase() === newMember.name.toLowerCase()
              );
              
              if (existingIndex === -1) {
                // Add new member
                existingFamily.push(newMember);
              } else {
                // Update existing member with new info (merge)
                existingFamily[existingIndex] = {
                  ...existingFamily[existingIndex],
                  ...newMember
                };
              }
            }
            
            mergedData.family_members = existingFamily;
          }
          
          // For interests, deduplicate
          if (result.extracted.interests) {
            mergedData.interests = [...new Set([...(mergedData.interests || []), ...(result.extracted.interests || [])])];
          }
        }
        
        successCount++;
      } catch (err) {
        console.error(`Failed to process memory ${memory.id}:`, err);
        errorCount++;
      }
    }

    console.log(`✅ Reprocessing complete: ${successCount} succeeded, ${errorCount} failed`);

    return {
      success: true,
      processed: successCount,
      failed: errorCount,
      total: memories.length,
      preview: preview ? mergedData : null
    };

  } catch (error) {
    console.error('Error in reprocessExistingMemories:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
