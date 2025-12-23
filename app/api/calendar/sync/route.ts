import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { CalendarSyncService } from '@/lib/sync/calendar-sync';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.accessToken || !session?.user?.email) { 
      // Note: session.user.id is often NOT present in default generic NextAuth strategies unless customized.
      // Google provider returns email.
      // We need to map email to our DB userId if they are different, OR
      // If we are using Supabase Auth alongside NextAuth, we need to handle that mapping.
      // However, usually one uses Supabase Auth's OAuth providers rather than NextAuth if using Supabase.
      // But the user requested NextAuth specifically.
      // We likely need to find the user in our DB by email.
      // Or if `user.id` is available (customized in authOptions).
      // I'll assume we need to fetch the user from Supabase using the email or assume NextAuth session has the correct ID (which likely it doesn't by default).
      // Let's create the Supabase client first.
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    
    // We need the user's UUID from Supabase.
    // Use the session email to find the user in `auth.users`? No, we can't query `auth.users` easily.
    // But we check `persons` table or `users` table via RLS?
    // If the user signed in with NextAuth, Supabase doesn't know about them unless we bridge it.
    // This is a common architectural conflict (NextAuth vs Supabase Auth).
    // Steps:
    // 1. NextAuth handles Google Auth.
    // 2. We get an email.
    // 3. We assume a record exists in `auth.users` with this email? 
    // Or do we replicate users to a `public.users` table?
    // Given existing app uses Supabase, it likely uses Supabase Auth.
    // Using NextAuth *separately* for Calendar tokens is distinct from App Auth.
    // If the app is logged in via Supabase Auth, `createClient()` (server) gets the session from cookies.
    // AND we have NextAuth session for Calendar token?
    // This implies DUAL AUTH.
    // Let's assume the user is logged in via Supabase (for DB access) AND NextAuth (for Calendar Access).
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Database Authorization Failed' }, { status: 401 });
    }

    await CalendarSyncService.syncCalendar(supabase, user.id, session.accessToken as string);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync calendar' },
      { status: 500 }
    );
  }
}
