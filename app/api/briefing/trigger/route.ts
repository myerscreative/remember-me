import { NextResponse } from 'next/server';
import { getDailyBriefing } from '@/app/actions/get-daily-briefing';

export async function GET() {
  try {
    const { data: briefing, error } = await getDailyBriefing();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!briefing) {
      return NextResponse.json({ summary: "No briefing available today." });
    }

    const { milestones, thirstyTribes, priorityNurtures } = briefing;
    
    // Construct summary text
    let summary = "Good morning! 🌱 ";
    
    if (milestones.length > 0) {
      summary += `${milestones.length} milestone${milestones.length > 1 ? 's' : ''} today. `;
    }
    
    if (thirstyTribes.length > 0) {
      summary += `${thirstyTribes.length} thirsty tribe${thirstyTribes.length > 1 ? 's' : ''}. `;
    }
    
    if (priorityNurtures.length > 0) {
      summary += `${priorityNurtures.length} person${priorityNurtures.length > 1 ? 's' : ''} fading from your garden. `;
    }
    
    if (milestones.length === 0 && thirstyTribes.length === 0 && priorityNurtures.length === 0) {
      summary += "Your garden is looking great! No urgent actions today.";
    } else {
      summary += "Time to plant some seeds of connection!";
    }

    return NextResponse.json({ 
      summary,
      counts: {
        milestones: milestones.length,
        thirstyTribes: thirstyTribes.length,
        priorityNurtures: priorityNurtures.length
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to trigger briefing" }, { status: 500 });
  }
}
