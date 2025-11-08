# AI Voice Contact Management Features

## Overview

ReMember Me now includes powerful AI-driven voice input capabilities that allow you to:

1. **Add new contacts by speaking naturally** - Just talk about the person you met and the AI will extract all relevant information
2. **Update existing contacts** - Speak to add new information to contacts you already have
3. **Get prompts for missing information** - AI will identify and ask for critical missing fields
4. **Discover similar contacts** - Automatically finds contacts with matching interests, skills, companies, or backgrounds

## Features

### 1. Intelligent Voice Entry

The AI voice system can understand natural speech and extract structured contact information:

**Supported Fields:**
- Basic info: Name, Email, Phone, LinkedIn
- Professional: Company, Job Title, Skills
- Context: Where you met, When you met, Who introduced you
- Relationship: Why stay in contact, What's interesting about them, What's important to them
- Personal: Interests, Family members, Birthday
- Organization: Tags, Notes

### 2. Smart Intent Detection

The AI automatically determines whether you want to:
- **Add a new contact** - Detects phrases like "I just met...", "new contact", "remember this person"
- **Update existing contact** - Detects phrases like "update John's profile", "John told me...", "add to Sarah's info"

### 3. Contact Similarity Matching

When adding a new contact, the AI searches your existing contacts for similar people based on:
- Company/workplace overlap
- Shared interests
- Similar skills or expertise
- Same location/event where you met

If matches are found, you can:
- Choose to update an existing contact instead
- Continue adding as a new contact
- View why contacts are considered similar

### 4. Missing Information Prompts

For new contacts, the AI identifies critical missing fields (name, email, phone) and:
- Prompts you to fill them in
- Allows you to skip if information isn't available
- Provides a simple form to complete the fields

## How to Use

### Adding a New Contact with Voice

1. Go to **New Contact** page
2. Click the **"Quick Voice Entry"** button (purple gradient button at the top)
3. Click the microphone icon to start recording
4. Speak naturally, for example:

   > "I just met Sarah Johnson at the AI Summit in San Francisco. She's a product manager at Tesla working on autonomous driving. Her email is sarah@tesla.com and her phone is 555-123-4567. We talked about user experience design and she's really passionate about sustainable technology. She has two kids, Emma and Jake. I should stay in touch because her work could align with our AI research project."

5. Click stop when finished
6. Review the transcript (you can re-record if needed)
7. AI will process and extract all information
8. If similar contacts are found, you can choose to update one or continue as new
9. Fill in any missing critical fields if prompted
10. Review all extracted information
11. Click "Apply to Form" to populate the contact form
12. Make any manual edits if needed
13. Save the contact

### Updating an Existing Contact with Voice

1. Say something like:

   > "Update John Smith - he just told me he's moving to Google and starting as engineering director next month. His new email is john@google.com. He's also really interested in AI safety now."

2. The AI will:
   - Detect this is an update intent
   - Search for "John Smith" in your contacts
   - If one match: Show you're updating that contact
   - If multiple matches: Let you choose which John Smith
   - Extract only the NEW information (job change, new email, new interest)

3. Apply the updates to the contact

## API Endpoints

### `/api/parse-voice-input` (Enhanced Parser)

**Purpose:** Intelligent parsing with intent detection and contact matching

**Request:**
```json
{
  "transcript": "Voice transcript text",
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "intent": "new" | "update",
  "confidence": 0.95,
  "matchedContact": {
    "id": "contact-uuid",
    "name": "John Smith",
    "email": "john@example.com"
  },
  "parsedData": {
    "name": "Sarah Johnson",
    "email": "sarah@tesla.com",
    "phone": "555-123-4567",
    "company": "Tesla",
    "jobTitle": "Product Manager",
    "interests": ["UX Design", "Sustainable Tech"],
    "skills": ["Product Management", "AI"],
    "familyMembers": [
      {"name": "Emma", "relationship": "daughter"},
      {"name": "Jake", "relationship": "son"}
    ],
    "whereMet": "AI Summit in San Francisco",
    "whatInteresting": "Working on autonomous driving UX",
    "whyStayInContact": "Work could align with AI research",
    "notes": "Passionate about sustainable technology"
  },
  "missingFields": ["phone"],
  "originalTranscript": "..."
}
```

### `/api/find-similar-contacts` (Contact Matching)

**Purpose:** Find contacts with similar attributes

**Request:**
```json
{
  "userId": "user-uuid",
  "contactData": {
    "company": "Tesla",
    "interests": ["UX Design", "AI"],
    "skills": ["Product Management"],
    "whereMet": "AI Summit"
  },
  "excludeContactId": "optional-contact-to-exclude"
}
```

**Response:**
```json
{
  "similarContacts": [
    {
      "id": "contact-uuid",
      "name": "Michael Chen",
      "email": "michael@tesla.com",
      "phone": "555-987-6543",
      "photo_url": "https://...",
      "similarity_score": 85,
      "similarity_reasons": [
        "Works at similar company",
        "Shares interests: UX Design, AI",
        "Met at similar location/event"
      ],
      "summary": "Also works at Tesla and shares your interest in UX Design and AI. You both attended tech summits."
    }
  ],
  "totalFound": 1
}
```

### `/api/transcribe` (Existing Whisper API)

**Purpose:** Convert audio to text

**Request:** FormData with audio file

**Response:**
```json
{
  "transcript": "I just met Sarah Johnson..."
}
```

## Components

### `VoiceEntryModalEnhanced`

Enhanced voice entry modal with AI features.

**Props:**
```typescript
interface VoiceEntryModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: ParsedContactData) => void;
  onSelectExistingContact?: (contactId: string) => void;
  userId: string;
  existingData?: ParsedContactData;
}
```

**Workflow Steps:**
1. **Record** - Voice recording interface
2. **Transcript** - Show transcribed text
3. **Similar** (if new contact) - Show matching contacts
4. **Missing** (if applicable) - Prompt for critical fields
5. **Review** - Final review before applying

## Tips for Best Results

### Speaking Tips

1. **Speak naturally** - No need for rigid formatting
2. **Include context** - Mention where/when you met for better categorization
3. **State relationships** - Say "spouse", "daughter", "son" for family members
4. **Mention multiple details** - More information helps with similarity matching
5. **Use full names** - Helps with update intent matching

### Example Voice Inputs

**Good examples:**

✅ "I just met Sarah Johnson at the AI Summit. She works at Tesla as a product manager. Her email is sarah@tesla.com. She's interested in sustainable technology and has two kids."

✅ "Update Michael Chen - he just moved to Google as a senior engineer. His new email is michael@google.com and he mentioned he's now working on AI safety."

✅ "New contact: Dr. Emily Rodriguez, neuroscientist at Stanford. Met her at the research conference. She's studying brain-computer interfaces and is looking for industry partnerships. Email: emily@stanford.edu"

**Less optimal:**

❌ "Sarah, Tesla, email" (too terse, missing context)
❌ Just reading off email and phone without context
❌ Speaking too quickly without pauses

## Similarity Matching Algorithm

The system calculates similarity scores based on:

1. **Company Match (20 points)** - Same company or work-related event
2. **Interests Overlap (15 points each)** - Matching interests
3. **Skills Overlap (15 points each)** - Similar expertise
4. **Location/Event (10 points each)** - Met at similar places

**Minimum threshold:** 15 points (ensures meaningful matches)
**Maximum results:** Top 5 most similar contacts
**Score cap:** 100 points

## Privacy & Security

- All voice processing uses OpenAI's API with your API key
- Audio files are not permanently stored
- Transcripts are processed in real-time
- Contact data stays in your Supabase database
- Row-Level Security ensures data isolation per user

## Requirements

- **OpenAI API Key** - Set in `OPENAI_API_KEY` environment variable
- **Browser with microphone access** - For voice recording
- **Supabase** - For contact storage and user authentication

## Troubleshooting

### "Failed to transcribe audio"
- Check microphone permissions
- Ensure OpenAI API key is set
- Try recording again with clearer audio

### "No similar contacts found"
- This is normal for your first few contacts
- Similarity requires overlap in interests, skills, or company
- More detailed contact info improves matching

### "Multiple matches found"
- Common for names like "John Smith"
- Select the correct contact from the list
- Add more context in voice input (mention email or company)

### AI extracted wrong information
- Review the extracted data carefully before applying
- Edit fields manually in the form
- Re-record with clearer pronunciation

## Future Enhancements

Potential features for future releases:

- Real-time transcription during recording
- Multi-language support
- Voice notes attached to contacts
- Voice search across contacts
- Automatic tag generation from context
- Meeting summary transcription
- Voice reminders and follow-ups
- Integration with calendar for meeting context

## Technical Architecture

```
User speaks → VoiceRecorder → Audio Blob
                                    ↓
                            /api/transcribe (Whisper)
                                    ↓
                                Transcript
                                    ↓
                        /api/parse-voice-input (GPT-4o-mini)
                                    ↓
                    Intent + Parsed Data + Matched Contact
                                    ↓
                        /api/find-similar-contacts
                                    ↓
                            Similar Contacts
                                    ↓
                        User reviews and applies
                                    ↓
                            Contact saved to Supabase
```

## Cost Considerations

**OpenAI API Usage:**
- Whisper (transcription): ~$0.006 per minute of audio
- GPT-4o-mini (parsing): ~$0.0001 per request
- GPT-4o-mini (similarity summaries): ~$0.0001 per contact

**Typical cost per voice entry:** < $0.01

**Optimization tips:**
- Keep voice recordings concise (under 2 minutes)
- Re-record instead of adding multiple recordings
- Review transcript before submitting for parsing

---

For questions or issues, please open an issue on the GitHub repository.
