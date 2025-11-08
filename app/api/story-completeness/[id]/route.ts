import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the contact
    const { data: person, error: personError } = await supabase
      .from("persons")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (personError || !person) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Calculate completeness score
    let score = 0;
    const totalFields = 15;
    const missingFields: string[] = [];

    // Basic info (3 fields)
    if (person.first_name && person.first_name.trim().length > 0) score++;
    if (person.email || person.phone || person.linkedin) score++;
    if (person.birthday) score++;
    else missingFields.push("birthday");

    // Context (3 fields)
    if (person.where_met && person.where_met.trim().length > 0) score++;
    else missingFields.push("where_met");
    if (person.when_met) score++;
    else missingFields.push("when_met");
    if (person.first_impression && person.first_impression.trim().length > 0) score++;
    else missingFields.push("first_impression");

    // Story (4 fields)
    if (person.why_stay_in_contact && person.why_stay_in_contact.trim().length > 30) score++;
    else missingFields.push("why_stay_in_contact");
    if (person.what_found_interesting && person.what_found_interesting.trim().length > 30) score++;
    else missingFields.push("what_found_interesting");
    if (person.most_important_to_them && person.most_important_to_them.trim().length > 30) score++;
    else missingFields.push("most_important_to_them");
    if (person.memorable_moment && person.memorable_moment.trim().length > 30) score++;
    else missingFields.push("memorable_moment");

    // Details (3 fields)
    if (person.interests && Array.isArray(person.interests) && person.interests.length > 0) score++;
    else missingFields.push("interests");
    if (person.family_members && Array.isArray(person.family_members) && person.family_members.length > 0) score++;

    // Check for tags
    const { data: tags } = await supabase
      .from("person_tags")
      .select("tag_id")
      .eq("person_id", id)
      .limit(1);
    if (tags && tags.length > 0) score++;

    // Relationship value (2 fields)
    if (person.relationship_value && person.relationship_value.trim().length > 20) score++;
    else missingFields.push("relationship_value");
    if (person.last_contact) score++;

    const completeness = Math.round((score * 100) / totalFields);

    return NextResponse.json({
      completeness,
      missingFields,
      score,
      totalFields,
    });
  } catch (error) {
    console.error("Error calculating story completeness:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
