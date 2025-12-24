/**
 * Simple utility to clean up transcribed text.
 * - Capitalizes common proper nouns.
 * - Fixes basic punctuation spacing.
 * - Capitalizes the first letter of sentences.
 */
export function cleanupTranscribedText(text: string): string {
  if (!text) return "";

  let cleaned = text.trim();

  // Basic proper noun capitalization
  const properNouns = [
    "NASA", "Tokyo", "London", "Paris", "New York", "Google", "Apple", "Microsoft", 
    "Supabase", "React", "Next.js", "JavaScript", "TypeScript", "GitHub", "Twitter",
    "Facebook", "Instagram", "LinkedIn", "Amazon", "Netflix", "Spotify"
  ];

  properNouns.forEach(noun => {
    const regex = new RegExp(`\\b${noun}\\b`, 'gi');
    cleaned = cleaned.replace(regex, noun);
  });

  // Capitalize first letter of the whole text
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  // Capitalize first letter of each sentence
  cleaned = cleaned.replace(/([.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());

  // Fix common spacing issues around punctuation
  cleaned = cleaned.replace(/\s+([.,!?;:])/g, '$1');

  return cleaned;
}
