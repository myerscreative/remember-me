'use server';

import { createClient } from '@/lib/supabase/server';

export async function purgeMockData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const mockNames = [
    'John Smith',
    'Jane Doe',
    'Alice Johnson',
    'Bob Wilson',
    'Carol White'
  ];

  try {
    const { count, error } = await (supabase as any)
      .from('persons')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)
      .in('name', mockNames);

    if (error) {
      console.error('Purge error:', error);
      throw error;
    }

    return { success: true, count: count || 0 };
  } catch (error: any) {
    console.error('Purge failed:', error);
    return { success: false, error: error.message };
  }
}
