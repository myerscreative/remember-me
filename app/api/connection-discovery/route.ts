import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface ConnectionDiscovery {
  type: "shared_introducer" | "shared_location" | "shared_interest" | "same_company";
  persons: Array<{
    id: string;
    first_name: string;
    last_name: string | null;
    photo_url: string | null;
  }>;
  commonValue: string;
  count: number;
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

    // Fetch all persons for this user
    const { data: persons, error: personsError } = await (supabase as any)
      .from("persons")
      .select("id, first_name, last_name, photo_url, who_introduced, where_met, interests")
      .eq("user_id", user.id)
      .eq("archived", false);

    if (personsError || !persons) {
      return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
    }

    const discoveries: ConnectionDiscovery[] = [];

    // 1. Find shared introducers (who introduced 2+ people)
    const introducerMap = new Map<string, typeof persons>();
    persons.forEach((person: any) => {
      if (person.who_introduced && person.who_introduced.trim().length > 0) {
        const introducer = person.who_introduced.trim().toLowerCase();
        if (!introducerMap.has(introducer)) {
          introducerMap.set(introducer, []);
        }
        introducerMap.get(introducer)!.push(person);
      }
    });

    introducerMap.forEach((contactList: any, introducer: any) => {
      if (contactList.length >= 2) {
        discoveries.push({
          type: "shared_introducer",
          persons: contactList.map((p: any) => ({
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            photo_url: p.photo_url,
          })),
          commonValue: introducer.charAt(0).toUpperCase() + introducer.slice(1),
          count: contactList.length,
        });
      }
    });

    // 2. Find shared locations (where_met)
    const locationMap = new Map<string, typeof persons>();
    persons.forEach((person: any) => {
      if (person.where_met && person.where_met.trim().length > 0) {
        const location = person.where_met.trim().toLowerCase();
        if (!locationMap.has(location)) {
          locationMap.set(location, []);
        }
        locationMap.get(location)!.push(person);
      }
    });

    locationMap.forEach((contactList: any, location: any) => {
      if (contactList.length >= 2) {
        discoveries.push({
          type: "shared_location",
          persons: contactList.map((p: any) => ({
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            photo_url: p.photo_url,
          })),
          commonValue: location.charAt(0).toUpperCase() + location.slice(1),
          count: contactList.length,
        });
      }
    });

    // 3. Find shared interests
    const interestMap = new Map<string, typeof persons>();
    persons.forEach((person: any) => {
      if (person.interests && Array.isArray(person.interests)) {
        person.interests.forEach((interest: any) => {
          const interestLower = interest.trim().toLowerCase();
          if (!interestMap.has(interestLower)) {
            interestMap.set(interestLower, []);
          }
          interestMap.get(interestLower)!.push(person);
        });
      }
    });

    interestMap.forEach((contactList: any, interest: any) => {
      if (contactList.length >= 2) {
        // Remove duplicates (same person might have same interest multiple times)
        const uniqueContacts = Array.from(
          new Map(contactList.map((p: any) => [p.id, p])).values()
        );
        if (uniqueContacts.length >= 2) {
          discoveries.push({
            type: "shared_interest",
            persons: uniqueContacts.map((p: any) => ({
              id: p.id,
              first_name: p.first_name,
              last_name: p.last_name,
              photo_url: p.photo_url,
            })),
            commonValue: interest.charAt(0).toUpperCase() + interest.slice(1),
            count: uniqueContacts.length,
          });
        }
      }
    });

    // Sort discoveries by count (most connections first)
    discoveries.sort((a, b) => b.count - a.count);

    // Limit to top 10 discoveries
    const topDiscoveries = discoveries.slice(0, 10);

    return NextResponse.json({ discoveries: topDiscoveries });
  } catch (error) {
    console.error("Error in connection-discovery API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
