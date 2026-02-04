import { z } from "zod";
import { uuidSchema, safeStringSchema, longTextSchema } from "./contact";

/**
 * Tag and Interest Validation Schemas
 * 
 * Security Principles Applied:
 * - Prevent tag/interest name injection
 * - Limit tag/interest name lengths
 * - Validate person-tag/interest associations
 */

// ============================================================================
// TAG SCHEMAS
// ============================================================================

/**
 * Tag name validator
 */
export const tagNameSchema = z
  .string()
  .trim()
  .min(1, "Tag name cannot be empty")
  .max(50, "Tag name too long (max 50 characters)")
  .regex(/^[a-zA-Z0-9\s\-_]+$/, "Tag name contains invalid characters");

/**
 * Create/toggle tag schema
 * Used in: app/actions/toggle-tag.ts
 */
export const toggleTagSchema = z.object({
  personId: uuidSchema,
  tagName: tagNameSchema,
});

/**
 * Delete tag schema
 */
export const deleteTagSchema = z.object({
  tagId: uuidSchema,
});

// ============================================================================
// INTEREST SCHEMAS
// ============================================================================

/**
 * Interest name validator
 */
export const interestNameSchema = z
  .string()
  .trim()
  .min(1, "Interest name cannot be empty")
  .max(100, "Interest name too long (max 100 characters)")
  .regex(/^[a-zA-Z0-9\s\-_&,]+$/, "Interest name contains invalid characters");

/**
 * Toggle interest schema
 * Used in: app/actions/toggle-interest.ts
 */
export const toggleInterestSchema = z.object({
  personId: uuidSchema,
  interestName: interestNameSchema,
});

// ============================================================================
// STORY/MEMORY SCHEMAS
// ============================================================================

/**
 * Update person memory schema
 * Used in: app/actions/update-person-memory.ts
 */
export const updatePersonMemorySchema = z.object({
  personId: uuidSchema,
  field: z.enum([
    "first_impression",
    "memorable_moment",
    "why_stay_in_contact",
    "what_interesting",
    "whats_important",
    "where_met",
    "introduced_by",
  ]),
  value: longTextSchema,
});

/**
 * Update deep lore schema
 * Used in: app/actions/story-actions.ts
 */
export const updateDeepLoreSchema = z.object({
  personId: uuidSchema,
  content: longTextSchema,
});

/**
 * Add story section schema
 */
export const addStorySectionSchema = z.object({
  personId: uuidSchema,
  sectionTitle: safeStringSchema(200),
  sectionContent: longTextSchema,
});

/**
 * Update story section schema
 */
export const updateStorySectionSchema = z.object({
  personId: uuidSchema,
  sectionIndex: z.number().int().min(0),
  sectionTitle: safeStringSchema(200),
  sectionContent: longTextSchema,
});

/**
 * Delete story section schema
 */
export const deleteStorySectionSchema = z.object({
  personId: uuidSchema,
  sectionIndex: z.number().int().min(0),
});

// ============================================================================
// SHARED MEMORY SCHEMAS
// ============================================================================

/**
 * Shared memory schema
 */
export const sharedMemorySchema = z.object({
  personId: uuidSchema,
  title: safeStringSchema(200),
  description: longTextSchema,
  date: z.string().datetime().optional().nullable(),
  location: safeStringSchema(200),
  participants: z.array(uuidSchema).optional(),
});

/**
 * Create shared memory schema
 */
export const createSharedMemorySchema = sharedMemorySchema;

/**
 * Update shared memory schema
 */
export const updateSharedMemorySchema = z.object({
  memoryId: uuidSchema,
  ...sharedMemorySchema.partial().shape,
});

/**
 * Delete shared memory schema
 */
export const deleteSharedMemorySchema = z.object({
  memoryId: uuidSchema,
});

// ============================================================================
// GIFT/MILESTONE SCHEMAS
// ============================================================================

/**
 * Gift idea schema
 */
export const giftIdeaSchema = z.object({
  personId: uuidSchema,
  title: safeStringSchema(200),
  description: longTextSchema,
  price: z.number().min(0).max(1000000).optional().nullable(),
  url: z.string().url().max(500).optional().nullable(),
  purchased: z.boolean().optional(),
});

/**
 * Milestone schema
 */
export const milestoneSchema = z.object({
  personId: uuidSchema,
  title: safeStringSchema(200),
  description: longTextSchema,
  date: z.string().datetime(),
  type: z.enum(["birthday", "anniversary", "achievement", "other"]).optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate tag name
 */
export function validateTagName(name: unknown): string {
  const result = tagNameSchema.safeParse(name);
  
  if (!result.success) {
    throw new Error(
      `Invalid tag name: ${result.error.issues.map((e) => e.message).join(", ")}`
    );
  }
  
  return result.data;
}

/**
 * Validate interest name
 */
export function validateInterestName(name: unknown): string {
  const result = interestNameSchema.safeParse(name);
  
  if (!result.success) {
    throw new Error(
      `Invalid interest name: ${result.error.issues.map((e) => e.message).join(", ")}`
    );
  }
  
  return result.data;
}
