/**
 * Validation Schemas Index
 * 
 * Centralized export of all Zod validation schemas.
 * Import from this file to ensure consistency across the application.
 * 
 * Security Best Practices:
 * - All user inputs MUST be validated using these schemas
 * - Never trust client-side data
 * - Validate at every trust boundary (API routes, server actions)
 * - Use .safeParse() for graceful error handling
 * - Use .parse() when you want to throw on validation errors
 */

// Contact validations
export {
  // Schemas
  uuidSchema,
  emailSchema,
  phoneSchema,
  urlSchema,
  safeStringSchema,
  longTextSchema,
  dateStringSchema,
  importanceSchema,
  targetFrequencySchema,
  familyMemberSchema,
  updateContactSchema,
  createContactSchema,
  voiceContactDataSchema,
  updateFamilyMembersSchema,
  deleteContactSchema,
  interactionTypeSchema,
  logInteractionSchema,
  updateInteractionSchema,
  deleteInteractionSchema,
  transcribeRequestSchema,
  parseTranscriptSchema,
  audioFileSchema,
  // Helper functions
  sanitizeString,
  validateContactUpdate,
  validateUUID,
} from "./contact";

// Metadata validations (tags, interests, stories, etc.)
export {
  // Schemas
  tagNameSchema,
  toggleTagSchema,
  deleteTagSchema,
  interestNameSchema,
  toggleInterestSchema,
  updatePersonMemorySchema,
  updateDeepLoreSchema,
  addStorySectionSchema,
  updateStorySectionSchema,
  deleteStorySectionSchema,
  sharedMemorySchema,
  createSharedMemorySchema,
  updateSharedMemorySchema,
  deleteSharedMemorySchema,
  giftIdeaSchema,
  milestoneSchema,
  // Helper functions
  validateTagName,
  validateInterestName,
} from "./metadata";
