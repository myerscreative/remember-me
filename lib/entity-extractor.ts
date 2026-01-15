
export type EntityType = 'Family' | 'Interest' | 'Milestone' | 'Career';

export interface ExtractedEntity {
  type: EntityType;
  value: string;
  context: string;
}

export const extractEntities = (text: string): ExtractedEntity[] => {
  const entities: ExtractedEntity[] = [];

  // 1. Family Keywords (The Web)
  // Matches "my wife Sarah" or "son Leo" etc.
  // Note: Simple regex, might need refinement for complex sentences.
  const familyRegex = /\b(wife|husband|son|daughter|kid|partner|spouse|mom|dad|mother|father|sister|brother)\b\s+([A-Z][a-z]+)/g;
  let match;
  while ((match = familyRegex.exec(text)) !== null) {
    entities.push({
      type: 'Family',
      value: match[2],
      context: `Relationship: ${match[1]}`
    });
  }

  // 2. Interest/Hobby Keywords (The Soil)
  // This list should ideally be dynamic or larger, but starting with the prompt's suggestions + common ones.
  const interestKeywords = [
      'fishing', 'golf', 'hiking', 'tech', 'business', 'kalon', 'soccer', 
      'tennis', 'cooking', 'reading', 'travel', 'music', 'guitar', 'piano',
      'coding', 'startup', 'investing', 'crypto', 'art', 'design', 'photography'
  ];
  
  interestKeywords.forEach(keyword => {
    // Check for whole word match to avoid partials (e.g. "go" in "golf" if not careful, though includes is simple)
    // Using regex for word boundary is safer.
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(text)) {
      entities.push({ type: 'Interest', value: keyword, context: 'New interest identified' });
    }
  });

  // 3. Career/Role Updates (The Growth)
  if (text.toLowerCase().includes('job') || text.toLowerCase().includes('started at') || text.toLowerCase().includes('promotion') || text.toLowerCase().includes('hired')) {
    entities.push({ type: 'Career', value: 'Career Update', context: 'Potential job change mentioned' });
  }
  
  // 4. Milestone/Date detection (Simple)
  // Matches "moving in 2 weeks", "birthday on July 5th" - very basic heuristic
  if (text.match(/\bin \d+ (week|month|day)s?/i) || text.match(/\bon (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w* \d+/i)) {
      entities.push({ type: 'Milestone', value: 'Upcoming Date', context: 'Time-sensitive event detected' });
  }

  // Deduplicate entities by value+type
  return entities.filter((entity, index, self) => 
    index === self.findIndex((t) => (
      t.type === entity.type && t.value.toLowerCase() === entity.value.toLowerCase()
    ))
  );
};

export const extractMilestones = (text: string) => {
  // Simple NLP logic to find "Next [Day]" or "[Month] [Date]" or "in X weeks"
  const timeRegex = /(next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)|in\s+(\d+)\s+(weeks?|days?|months?)|(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(st|nd|rd|th)?)/gi;

  const match = text.match(timeRegex);
  if (match) {
    // Return first match for now as the primary candidate
    return {
      title: "Potential Milestone",
      detectedDate: match[0], // pass string for now, UI can parse to real date
      context: text
    };
  }
  return null;
};
