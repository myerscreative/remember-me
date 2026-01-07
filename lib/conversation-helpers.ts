import { Person } from "@/types/database.types";
import { format, differenceInDays, parseISO, isValid } from "date-fns";
import { FREQUENCY_PRESETS } from "@/lib/relationship-health";

export type HealthStatus = 'healthy' | 'overdue' | 'none';

export interface ConversationStarter {
  text: string;
  context: string;
}

/**
 * Calculates relationship health based on last contact and target frequency.
 */
export function getRelationshipHealth(contact: Person): HealthStatus {
  if (!contact.last_interaction_date) return 'none';

  const lastDate = parseISO(contact.last_interaction_date);
  if (!isValid(lastDate)) return 'none';

  const daysSince = differenceInDays(new Date(), lastDate);
  const targetDays = contact.target_frequency_days || 30; // Default to 30 days if not set

  // If we are past the target days (plus a small buffer?), it's overdue
  if (daysSince > targetDays) {
    return 'overdue';
  }

  return 'healthy';
}

/**
 * Generates 3 contextual conversation starters based on contact data.
 * Simulates AI generation with rule-based templates.
 */
export function generateConversationStarters(contact: Person): ConversationStarter[] {
  const starters: ConversationStarter[] = [];
  const health = getRelationshipHealth(contact);
  const firstName = contact.first_name || contact.name.split(' ')[0];

  // 1. Birthday Check (Simulated for upcoming if we had logic, here we check if just passed or generic)
  if (contact.birthday) {
      // Simplistic check: If birthday was recent or upcoming (mocking logic for demo)
      // In real app, check date proximity.
      starters.push({
          text: `Hey ${firstName}! Your birthday is coming up - wanted to reach out and see how things are going with you.`,
          context: "Based on: Upcoming birthday"
      });
  }

  // 2. Overdue STARTER
  if (health === 'overdue') {
      starters.push({
          text: `Hey ${firstName}! It's been too long - hope you and the family are doing well. Would love to catch up soon!`,
          context: "Based on: Long time since last contact"
      });
      
      if (contact.why_stay_in_contact) {
         starters.push({
             text: `Hi ${firstName}! I was just thinking about our chats regarding ${contact.why_stay_in_contact}. How have things been?`,
             context: "Based on: Why you stay in contact"
         });
      }
  }

  // 3. Healthy / Recent STARTER
  if (health === 'healthy') {
       starters.push({
           text: `Hey ${firstName}! Following up on what we discussed recently - wanted to share [relevant content].`,
           context: "Based on: Your recent conversation"
       });
  }

  // 4. New / No Contact STARTER
  if (health === 'none') {
      if (contact.where_met) {
          starters.push({
              text: `Hi ${firstName}! Great meeting you at ${contact.where_met}. Would love to connect and hear more about your work!`,
              context: "Based on: Where you met"
          });
      }
      starters.push({
          text: `Hey ${firstName}! I'd love to learn more about what you're working on these days. Coffee soon?`,
          context: "Based on: Establishing connection"
      });
  }

  // Fallbacks to ensure we always have 3
  if (starters.length < 3) {
      starters.push({
        text: `Thinking of you, ${firstName}! Hope you're having a great week.`,
        context: "Based on: Friendly check-in"
      });
  }
  if (starters.length < 3) {
      const interest = contact.interests && contact.interests.length > 0 ? contact.interests[0] : "your interests";
      starters.push({
          text: `Hi ${firstName}, saw something related to ${interest} and thought of you!`,
          context: `Based on: Interest in ${interest}`
      });
  }

  return starters.slice(0, 3);
}

export function formatLastContacted(dateStr: string | null): string {
    if (!dateStr) return "No contact yet";
    const date = parseISO(dateStr);
    if (!isValid(date)) return "No contact yet";
    
    const days = differenceInDays(new Date(), date);
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days} days ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return format(date, "MMM d, yyyy");
}
