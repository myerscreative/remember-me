import crypto from "crypto";

/**
 * OAuth Token Encryption Utility
 *
 * Uses AES-256-GCM encryption to securely store OAuth tokens in the database.
 * The encryption key is derived from the ENCRYPTION_KEY environment variable.
 *
 * IMPORTANT: Set a strong random ENCRYPTION_KEY in your environment variables:
 * - Generate with: openssl rand -base64 32
 * - Store in .env.local: ENCRYPTION_KEY=your-generated-key-here
 *
 * Security features:
 * - AES-256-GCM authenticated encryption
 * - Unique IV (initialization vector) per encryption
 * - Authentication tag to detect tampering
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get the encryption key from environment variables
 * @returns Buffer containing the encryption key
 * @throws Error if ENCRYPTION_KEY is not set
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. " +
      "Generate one with: openssl rand -base64 32"
    );
  }

  // Convert base64 key to buffer
  const keyBuffer = Buffer.from(key, "base64");

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (256 bits). ` +
      `Current key is ${keyBuffer.length} bytes. ` +
      `Generate a new one with: openssl rand -base64 32`
    );
  }

  return keyBuffer;
}

/**
 * Encrypt a token using AES-256-GCM
 *
 * @param token - The plain text token to encrypt
 * @returns Encrypted token in format: iv:authTag:encryptedData (all base64 encoded)
 * @throws Error if encryption fails or ENCRYPTION_KEY is invalid
 *
 * @example
 * const encrypted = encryptToken("my-secret-token");
 * // Returns: "randomIV:authTag:encryptedData" (base64 encoded components)
 */
export function encryptToken(token: string): string {
  if (!token) {
    throw new Error("Token cannot be empty");
  }

  try {
    const key = getEncryptionKey();

    // Generate a random IV for each encryption
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the token
    let encrypted = cipher.update(token, "utf8", "base64");
    encrypted += cipher.final("base64");

    // Get the authentication tag
    const authTag = cipher.getAuthTag();

    // Return IV + auth tag + encrypted data, all base64 encoded and separated by ':'
    return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt token");
  }
}

/**
 * Decrypt a token that was encrypted with encryptToken
 *
 * @param encryptedToken - The encrypted token string (iv:authTag:encryptedData)
 * @returns The decrypted plain text token
 * @throws Error if decryption fails, token is tampered, or ENCRYPTION_KEY is invalid
 *
 * @example
 * const decrypted = decryptToken("randomIV:authTag:encryptedData");
 * // Returns: "my-secret-token"
 */
export function decryptToken(encryptedToken: string): string {
  if (!encryptedToken) {
    throw new Error("Encrypted token cannot be empty");
  }

  try {
    const key = getEncryptionKey();

    // Split the encrypted token into its components
    const parts = encryptedToken.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted token format");
    }

    const [ivBase64, authTagBase64, encryptedData] = parts;

    // Convert from base64
    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the token
    let decrypted = decipher.update(encryptedData, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt token - token may be corrupted or tampered");
  }
}

/**
 * Check if a token appears to be encrypted (has the correct format)
 * This is a basic check - it doesn't verify if it can be decrypted
 *
 * @param token - The token to check
 * @returns true if the token appears to be encrypted, false otherwise
 */
export function isEncrypted(token: string): boolean {
  if (!token) return false;

  const parts = token.split(":");
  if (parts.length !== 3) return false;

  // Check if all parts are valid base64
  try {
    parts.forEach(part => {
      Buffer.from(part, "base64");
    });
    return true;
  } catch {
    return false;
  }
}
