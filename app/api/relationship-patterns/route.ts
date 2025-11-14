import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RelationshipPattern {
  type: string;
  insight: string;
  metric: string;
  recommendation: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all persons
    const { data: persons } = await (supabase as any)
      .from("persons")
      .select("id, first_name, last_name, created_at, last_contact, where_met, archived")
      .eq("user_id", user.id);

    // Fetch all interactions
    const { data: interactions } = await (supabase as any)
      .from("interactions")
      .select("person_id, interaction_type, interaction_date")
      .eq("user_id", user.id);

    if (!persons) {
      return NextResponse.json({ patterns: [] });
    }

    const patterns: RelationshipPattern[] = [];
    const now = new Date();

    // Pattern 1: Decay Analysis
    const contactsWithInteractions = persons.filter((p: any) => {
      const personInteractions = interactions?.filter((i: any) => i.person_id === p.id) || [];
      return personInteractions.length > 0;
    });

    if (contactsWithInteractions.length > 5) {
      // Calculate average time between interactions
      const timeBetweenInteractions: number[] = [];
      contactsWithInteractions.forEach((person: any) => {
        const personInteractions = (interactions || [])
          .filter((i: any) => i.person_id === person.id)
          .sort((a: any, b: any) => new Date(a.interaction_date).getTime() - new Date(b.interaction_date).getTime());

        for (let i = 1; i < personInteractions.length; i++) {
          const diff = new Date(personInteractions[i].interaction_date).getTime() -
                       new Date(personInteractions[i - 1].interaction_date).getTime();
          timeBetweenInteractions.push(diff / (1000 * 60 * 60 * 24)); // Convert to days
        }
      });

      if (timeBetweenInteractions.length > 0) {
        const avgDays = Math.round(
          timeBetweenInteractions.reduce((a, b) => a + b, 0) / timeBetweenInteractions.length
        );

        // Count contacts where last contact exceeds average by 2x
        const fadingCount = contactsWithInteractions.filter((p: any) => {
          if (!p.last_contact) return false;
          const daysSince = (now.getTime() - new Date(p.last_contact).getTime()) / (1000 * 60 * 60 * 24);
          return daysSince > avgDays * 2;
        }).length;

        if (fadingCount > 0) {
          patterns.push({
            type: "decay_pattern",
            insight: `Relationships tend to fade after ${avgDays} days without contact`,
            metric: `${fadingCount} contacts at risk`,
            recommendation: `Set reminders every ${Math.floor(avgDays * 0.75)} days for important connections`,
          });
        }
      }
    }

    // Pattern 2: Meeting Location Preference
    const locationCounts = new Map<string, number>();
    persons.forEach((p: any) => {
      if (p.where_met && p.where_met.trim().length > 0) {
        const location = p.where_met.trim().toLowerCase();
        locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
      }
    });

    if (locationCounts.size > 0) {
      const topLocation = Array.from(locationCounts.entries()).sort((a, b) => b[1] - a[1])[0];
      if (topLocation[1] >= 3) {
        patterns.push({
          type: "location_pattern",
          insight: `You meet most people at ${topLocation[0]}`,
          metric: `${topLocation[1]} contacts`,
          recommendation: `This is your networking hub - consider regular visits`,
        });
      }
    }

    // Pattern 3: Interaction Type Preference
    if (interactions && interactions.length > 5) {
      const typeCounts = new Map<string, number>();
      interactions.forEach((i: any) => {
        typeCounts.set(i.interaction_type, (typeCounts.get(i.interaction_type) || 0) + 1);
      });

      const total = interactions.length;
      const topType = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1])[0];
      const percentage = Math.round((topType[1] / total) * 100);

      if (percentage > 50) {
        const typeNames: Record<string, string> = {
          meeting: "in-person meetings",
          call: "phone calls",
          email: "emails",
          message: "messages",
          other: "other interactions",
        };

        patterns.push({
          type: "interaction_preference",
          insight: `${percentage}% of your interactions are ${typeNames[topType[0]] || topType[0]}`,
          metric: `${topType[1]} ${topType[0]}s`,
          recommendation: `Consider diversifying communication methods for stronger bonds`,
        });
      }
    }

    // Pattern 4: Contact Growth Rate
    const last30Days = persons.filter(
      (p: any) => new Date(p.created_at) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    ).length;
    const last90Days = persons.filter(
      (p: any) => new Date(p.created_at) > new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    ).length;

    if (last90Days > 5) {
      const monthlyRate = Math.round(last90Days / 3);
      const trend = last30Days > monthlyRate ? "accelerating" : last30Days < monthlyRate / 2 ? "slowing" : "steady";

      patterns.push({
        type: "growth_rate",
        insight: `Your network is growing at ${monthlyRate} contacts/month`,
        metric: trend.charAt(0).toUpperCase() + trend.slice(1),
        recommendation:
          trend === "accelerating"
            ? "Great momentum! Keep nurturing existing relationships too"
            : trend === "slowing"
            ? "Consider attending more networking events"
            : "Maintain this healthy pace while deepening existing connections",
      });
    }

    // Pattern 5: Archive Behavior
    const archivedContacts = persons.filter((p: any) => p.archived).length;
    const activeContacts = persons.filter((p: any) => !p.archived).length;

    if (persons.length > 10) {
      const archiveRate = Math.round((archivedContacts / persons.length) * 100);

      if (archiveRate > 20) {
        patterns.push({
          type: "archive_pattern",
          insight: `You've archived ${archiveRate}% of contacts`,
          metric: `${archivedContacts} archived`,
          recommendation: "You're good at maintaining a focused network - keep it up!",
        });
      } else if (archiveRate < 5 && persons.length > 50) {
        patterns.push({
          type: "archive_pattern",
          insight: "Your contact list may need pruning",
          metric: `${activeContacts} active contacts`,
          recommendation: "Consider archiving inactive relationships to maintain focus",
        });
      }
    }

    return NextResponse.json({ patterns });
  } catch (error) {
    console.error("Error in relationship-patterns API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
