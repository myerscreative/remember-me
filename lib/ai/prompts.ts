export interface ContactContext {
  name: string;
  whereWeMet?: string;
  whenWeMet?: string;
  howWeMet?: string;
  whatWeTalkedAbout?: string[];
  whyStayInContact?: string;
  whatMattersToThem?: string[];
  lastContact?: {
    date?: string;
    method?: string;
    daysAgo?: number;
    notes?: string;
  };
  interests?: string[];
  meetingTitle?: string;
  meetingType?: 'first-meeting' | 'follow-up' | 'catch-up' | 'important';
}

export function buildConversationStarterPrompt(context: ContactContext): string {
  const sections: string[] = [];

  sections.push(
    `Generate 4 natural, warm conversation starters for an upcoming meeting with ${context.name}.`
  );

  sections.push(
    `\nThese should be personalized questions that show genuine interest and reference specific details from our relationship.`
  );

  // Meeting context
  if (context.meetingTitle) {
    sections.push(`\nMeeting: "${context.meetingTitle}"`);
  }

  if (context.meetingType === 'first-meeting') {
    sections.push(`\nThis is our FIRST meeting - focus on breaking the ice and building rapport.`);
  } else if (context.meetingType === 'important') {
    sections.push(`\nThis is an IMPORTANT meeting - questions should be thoughtful and substantive.`);
  }

  // Where we met
  if (context.whereWeMet) {
    sections.push(`\n📍 WHERE WE MET:`);
    sections.push(`${context.whereWeMet} - ${context.whenWeMet || ''}`);
    if (context.howWeMet) {
      sections.push(`${context.howWeMet}`);
    }
  }

  // What we talked about
  if (context.whatWeTalkedAbout && context.whatWeTalkedAbout.length > 0) {
    sections.push(`\n💭 WHAT WE TALKED ABOUT:`);
    context.whatWeTalkedAbout.forEach((topic) => {
      sections.push(`• ${topic}`);
    });
  }

  // Why stay in contact
  if (context.whyStayInContact) {
    sections.push(`\n❤️ WHY THIS RELATIONSHIP MATTERS:`);
    sections.push(context.whyStayInContact);
  }

  // What matters to them (MOST IMPORTANT!)
  if (context.whatMattersToThem && context.whatMattersToThem.length > 0) {
    sections.push(`\n👨‍👩‍👧 WHAT MATTERS TO THEM (use this for questions!):`);
    context.whatMattersToThem.forEach((item) => {
      sections.push(`• ${item}`);
    });
  }

  // Last contact
  if (context.lastContact?.notes) {
    sections.push(`\n📞 LAST CONTACT (${context.lastContact.daysAgo} days ago):`);
    sections.push(context.lastContact.notes);
  }

  // Interests
  if (context.interests && context.interests.length > 0) {
    sections.push(`\n🎯 SHARED INTERESTS:`);
    sections.push(context.interests.join(', '));
  }

  // Instructions
  sections.push(`\n---\nGENERATE 4 CONVERSATION STARTERS THAT:`);
  sections.push(`1. Reference SPECIFIC details from "What Matters to Them" (family, goals, recent events)`);
  sections.push(`2. Show you remember and care about their life`);
  sections.push(`3. Are open-ended questions that invite detailed responses`);
  sections.push(`4. Feel natural and warm, not scripted or salesy`);
  sections.push(`5. Build on the last conversation if recent`);
  sections.push(`6. Are appropriate for the meeting context`);

  sections.push(`\nFORMAT:`);
  sections.push(`Return ONLY 4 questions, one per line.`);
  sections.push(`No numbering, no preamble, just the questions.`);
  sections.push(`Each question should be conversational and end with a question mark.`);

  sections.push(`\nEXAMPLES OF GOOD QUESTIONS:`);
  sections.push(`"How's Emma enjoying her piano lessons? Is she loving it so far?"`);
  sections.push(`"Have you discovered any hidden fishing gems around Austin yet?"`);
  sections.push(`"How's that AI productivity tool project coming along?"`);

  sections.push(`\nEXAMPLES OF BAD QUESTIONS (avoid these):`);
  sections.push(`"How are you?" (too generic)`);
  sections.push(`"What's new?" (too vague)`);
  sections.push(`"How's work?" (impersonal)`);

  return sections.join('\n');
}
