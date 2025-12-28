/**
 * Generates a 2-sentence reach-out draft.
 * Sentence 1: Mentions the latest 'deep_lore' (Shared Memory).
 * Sentence 2: Offers a warm reconnect based on 'why_stay_in_contact'.
 */
export function generateReconnectionScript(name: string, deepLore: string | null, whyStayInContact: string | null): string {
  const firstName = name.split(' ')[0];
  
  // Sentence 1: The Memory
  let sentence1 = `Hey ${firstName}, I was just thinking about you and the time we spent talking about ${deepLore || 'our shared experiences'}!`;
  if (deepLore) {
      // Try to make it a bit more natural if it's a long string
      const lorePreview = deepLore.length > 60 ? deepLore.substring(0, 60) + '...' : deepLore;
      sentence1 = `Hey ${firstName}, I was just thinking about that memory of ${lorePreview}.`;
  }

  // Sentence 2: The Reconnect
  let sentence2 = `I'd love to catch up soon because ${whyStayInContact || 'it would be great to stay connected'}.`;
  if (whyStayInContact) {
      // Clean up the whyStayInContact if it starts with "I'd love to..." or "Because..."
      let purpose = whyStayInContact.trim();
      purpose = purpose.charAt(0).toLowerCase() + purpose.slice(1);
      if (purpose.startsWith('because ')) {
          purpose = purpose.replace('because ', '');
      }
      sentence2 = `I'd love to hop on a call or grab coffee soon, as I really value ${purpose}.`;
  }

  return `${sentence1} ${sentence2}`;
}
