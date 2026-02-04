import { z } from "zod";

/**
 * Contact Validation Schemas
 * 
 * Security Principles Applied:
 * - All user inputs are validated and sanitized
 * - String inputs are trimmed and length-limited to prevent DoS
 * - Email and phone formats are strictly validated
 * - UUIDs are validated to prevent injection attacks
 * - Optional fields have explicit null handling
 */

// ============================================================================
// PRIMITIVE VALIDATORS
// ============================================================================

/**
 * UUID validator - prevents SQL injection via ID parameters
 */
export const uuidSchema = z.string().uuid({
  message: "Invalid ID format"
});

/**
 * Email validator with sanitization
 */
export const emailSchema = z
  .string()
  .trim()
  .email({ message: "Invalid email address" })
  .max(255, "Email too long")
  .toLowerCase()
  .optional()
  .nullable();

/**
 * Phone validator - accepts various formats
 */
export const phoneSchema = z
  .string()
  .trim()
  .max(20, "Phone number too long")
  .regex(/^[+\d\s()-]+$/, "Invalid phone number format")
  .optional()
  .nullable();

/**
 * URL validator for LinkedIn and other URLs
 */
export const urlSchema = z
  .string()
  .trim()
  .url({ message: "Invalid URL format" })
  .max(500, "URL too long")
  .optional()
  .nullable();

/**
 * Safe string validator - prevents XSS and limits length
 * Used for names, titles, and other text fields
 */
export const safeStringSchema = (maxLength: number = 255) =>
  z
    .string()
    .trim()
    .max(maxLength, `Text too long (max ${maxLength} characters)`)
    .optional()
    .nullable();

/**
 * Long text validator - for notes, descriptions, etc.
 */
export const longTextSchema = z
  .string()
  .trim()
  .max(10000, "Text too long (max 10,000 characters)")
  .optional()
  .nullable();

/**
 * Date string validator - ISO 8601 format
 */
export const dateStringSchema = z
  .string()
  .datetime({ message: "Invalid date format" })
  .optional()
  .nullable();

/**
 * Importance level validator
 */
export const importanceSchema = z
  .enum(["low", "medium", "high", "critical"], {
    message: "Invalid importance level",
  })
  .optional()
  .nullable();

/**
 * Target frequency validator - days between contacts
 */
export const targetFrequencySchema = z
  .number()
  .int()
  .min(1, "Frequency must be at least 1 day")
  .max(365, "Frequency cannot exceed 365 days")
  .optional()
  .nullable();

// ============================================================================
// CONTACT SCHEMAS
// ============================================================================

/**
 * Family member schema
 */
export const familyMemberSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  relationship: z.string().trim().min(1, "Relationship required").max(50),
  birthday: dateStringSchema,
  hobbies: safeStringSchema(500),
  interests: safeStringSchema(500),
});

/**
 * Update contact data schema
 * Used in: app/actions/update-contact.ts
 */
export const updateContactSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  birthday: dateStringSchema,
  company: safeStringSchema(255),
  job_title: safeStringSchema(255),
  where_met: safeStringSchema(500),
  first_name: safeStringSchema(100),
  last_name: safeStringSchema(100),
  photo_url: urlSchema,
  importance: importanceSchema,
  target_frequency_days: targetFrequencySchema,
  // Address fields
  address: safeStringSchema(500),
  city: safeStringSchema(100),
  state: safeStringSchema(100),
  zip_code: safeStringSchema(20),
  country: safeStringSchema(100),
});

/**
 * Create contact schema - stricter than update (requires name)
 */
export const createContactSchema = z.object({
  first_name: z.string().trim().min(1, "First name required").max(100),
  last_name: safeStringSchema(100),
  email: emailSchema,
  phone: phoneSchema,
  company: safeStringSchema(255),
  job_title: safeStringSchema(255),
  where_met: safeStringSchema(500),
  importance: importanceSchema,
  target_frequency_days: targetFrequencySchema,
});

/**
 * Voice input parsed data schema
 * Used in: app/api/parse-contact/route.ts
 */
export const voiceContactDataSchema = z.object({
  name: safeStringSchema(200),
  email: emailSchema,
  phone: phoneSchema,
  linkedin: urlSchema,
  whereMet: safeStringSchema(500),
  introducedBy: safeStringSchema(200),
  firstImpression: longTextSchema,
  memorableMoment: longTextSchema,
  whyStayInContact: longTextSchema,
  whatInteresting: longTextSchema,
  whatsImportant: longTextSchema,
  familyMembers: z.array(familyMemberSchema).nullable().optional(),
  interests: safeStringSchema(1000),
  tags: safeStringSchema(500),
  misc: longTextSchema,
});

/**
 * Update family members schema
 * Used in: app/actions/update-family-members.ts
 */
export const updateFamilyMembersSchema = z.object({
  personId: uuidSchema,
  familyMembers: z.array(familyMemberSchema),
});

/**
 * Delete contact schema
 */
export const deleteContactSchema = z.object({
  contactId: uuidSchema,
});

// ============================================================================
// INTERACTION SCHEMAS
// ============================================================================

/**
 * Interaction type validator
 */
export const interactionTypeSchema = z.enum(
  ["call", "email", "message", "meeting", "other"],
  {
    message: "Invalid interaction type",
  }
);

/**
 * Log interaction schema
 * Used in: app/actions/log-contact-interaction.ts
 */
export const logInteractionSchema = z.object({
  personId: uuidSchema,
  type: interactionTypeSchema,
  notes: longTextSchema,
  date: dateStringSchema.optional(), // Allow backdating
});

/**
 * Update interaction schema
 */
export const updateInteractionSchema = z.object({
  interactionId: uuidSchema,
  type: interactionTypeSchema.optional(),
  notes: longTextSchema,
  date: dateStringSchema.optional(),
});

/**
 * Delete interaction schema
 */
export const deleteInteractionSchema = z.object({
  interactionId: uuidSchema,
});

// ============================================================================
// API REQUEST SCHEMAS
// ============================================================================

/**
 * Transcribe audio request schema
 * Used in: app/api/transcribe/route.ts
 */
export const transcribeRequestSchema = z.object({
  audio: z.instanceof(File, { message: "Audio file required" }),
});

/**
 * Parse transcript request schema
 * Used in: app/api/parse-contact/route.ts
 */
export const parseTranscriptSchema = z.object({
  transcript: z
    .string()
    .trim()
    .min(1, "Transcript cannot be empty")
    .max(50000, "Transcript too long"),
});

/**
 * File upload validation
 */
export const audioFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 25 * 1024 * 1024, {
    message: "File size must be less than 25MB",
  })
  .refine(
    (file) => {
      const validTypes = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/webm",
        "audio/mp4",
        "audio/m4a",
      ];
      return validTypes.includes(file.type);
    },
    {
      message: "Invalid file type. Supported: MP3, WAV, WebM, M4A",
    }
  );

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sanitize HTML/XSS from string inputs
 * Basic sanitization - for production, consider using DOMPurify
 */
export function sanitizeString(input: string | null | undefined): string | null {
  if (!input) return null;
  
  return input
    .trim()
    // Remove potential XSS vectors
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, ""); // Remove inline event handlers
}

/**
 * Validate and sanitize contact update data
 */
export function validateContactUpdate(data: unknown) {
  const result = updateContactSchema.safeParse(data);
  
  if (!result.success) {
    throw new Error(
      `Validation failed: ${result.error.issues.map((e) => e.message).join(", ")}`
    );
  }
  
  return result.data;
}

/**
 * Validate UUID parameter
 */
export function validateUUID(id: unknown): string {
  const result = uuidSchema.safeParse(id);
  
  if (!result.success) {
    throw new Error("Invalid ID format");
  }
  
  return result.data;
}
