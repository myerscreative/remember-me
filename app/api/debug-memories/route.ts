import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find all persons with "Bryan" in the name
    const { data: persons, error: personsError } = await (supabase as any)
      .from('persons')
      .select('id, name, first_name, last_name')
      .or('name.ilike.%bryan%,first_name.ilike.%bryan%')
      .eq('user_id', user.id);

    if (personsError) {
      return NextResponse.json({ error: personsError.message }, { status: 500 });
    }

    // For each person, get their memory count
    const results = await Promise.all(
      (persons || []).map(async (person) => {
        const { data: memories, error } = await (supabase as any)
          .from('shared_memories')
          .select('id, content, created_at')
          .eq('person_id', person.id)
          .eq('user_id', user.id);

        return {
          person,
          memoryCount: memories?.length || 0,
          memories: memories || []
        };
      })
    );

    // Also get recent memories across all contacts
    const { data: recentMemories } = await (supabase as any)
      .from('shared_memories')
      .select('id, content, created_at, person_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      bryanContacts: results,
      recentMemories: recentMemories || []
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
