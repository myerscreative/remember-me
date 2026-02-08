import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { CalendarSyncService } from '@/lib/sync/calendar-sync';
import { createClient } from '@/lib/supabase/server';
import { decryptToken, isEncrypted } from '@/lib/utils/encryption';

export async function POST(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  let accessToken = session?.accessToken;
  const userId = session?.user?.id;

  if (!accessToken && !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    
    // Get the authenticated Supabase user
    const { data: { user } } = await supabase.auth.getUser();
    const effectiveUserId = user?.id || userId;

    if (!effectiveUserId) {
      return NextResponse.json({ error: 'User identification failed' }, { status: 401 });
    }

    // If session doesn't have token, try database
    if (!accessToken) {
      const { data: prefs, error: prefsError } = await supabase
        .from('calendar_preferences')
        .select('access_token_encrypted, provider')
        .eq('user_id', effectiveUserId)
        .maybeSingle<{ access_token_encrypted: string | null; provider: string | null }>();
      
      if (prefsError) {
        console.error('Error fetching calendar preferences for sync:', prefsError);
      }
      
      if (prefs?.access_token_encrypted && prefs.provider === 'google') {
        const encrypted = prefs.access_token_encrypted;
        accessToken = isEncrypted(encrypted) ? decryptToken(encrypted) : encrypted;
      }
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Calendar connection required' }, { status: 401 });
    }

    await CalendarSyncService.syncCalendar(supabase, effectiveUserId, accessToken);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync calendar' },
      { status: 500 }
    );
  }
}
