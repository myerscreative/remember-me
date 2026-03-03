import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Auth check for Cron (Vercel provides a CRON_SECRET)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const supabase = await createClient();

    // 1. Mark as NEGLECTED (Over 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await supabase
      .from('persons')
      .update({ status: 'Neglected' } as any)
      .lt('last_interaction_date', thirtyDaysAgo.toISOString())
      .neq('status', 'Neglected')
      .or('archive_status.is.null,archive_status.eq.false');

    // 2. Mark as DRIFTING (15 to 30 days)
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    
    await supabase
      .from('persons')
      .update({ status: 'Drifting' } as any)
      .lt('last_interaction_date', fifteenDaysAgo.toISOString())
      .gte('last_interaction_date', thirtyDaysAgo.toISOString())
      .neq('status', 'Drifting')
      .or('archive_status.is.null,archive_status.eq.false');

    // 3. Keep as NURTURED (Last 14 days or never contacted)
    // Note: We only need to "reset" if they were previously something else (e.g. after a new interaction logged)
    await supabase
      .from('persons')
      .update({ status: 'Nurtured' } as any)
      .or(`last_interaction_date.gte.${fifteenDaysAgo.toISOString()},last_interaction_date.is.null`)
      .neq('status', 'Nurtured')
      .or('archive_status.is.null,archive_status.eq.false');

    return NextResponse.json({ success: true, message: "The Garden has shifted." });
  } catch (error) {
    console.error("Drift update failed:", error);
    return NextResponse.json({ error: "Drift update failed." }, { status: 500 });
  }
}
