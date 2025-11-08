import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a phone number as the user types
 * Supports US/Canada format: (555) 123-4567 or +1 (555) 123-4567
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters except +
  const phoneNumber = value.replace(/[^\d+]/g, "");
  
  // Handle empty input
  if (!phoneNumber) return "";
  
  // Handle international format starting with +
  if (phoneNumber.startsWith("+")) {
    const countryCode = phoneNumber.slice(0, 2); // +1
    const rest = phoneNumber.slice(2);
    
    if (rest.length === 0) return countryCode;
    if (rest.length <= 3) return `${countryCode} (${rest}`;
    if (rest.length <= 6) return `${countryCode} (${rest.slice(0, 3)}) ${rest.slice(3)}`;
    return `${countryCode} (${rest.slice(0, 3)}) ${rest.slice(3, 6)}-${rest.slice(6, 10)}`;
  }
  
  // Handle US/Canada format (10 digits)
  if (phoneNumber.length <= 3) {
    return `(${phoneNumber}`;
  }
  if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
}

/**
 * Formats a phone number for display
 * Converts various formats to a standard format: (555) 123-4567 or +1 (555) 123-4567
 */
export function formatPhoneNumberDisplay(phone: string | null | undefined): string {
  if (!phone) return "";
  
  // Remove all non-digit characters except +
  const digits = phone.replace(/[^\d+]/g, "");
  
  // Handle international format
  if (digits.startsWith("+1") || digits.startsWith("1")) {
    const number = digits.startsWith("+1") ? digits.slice(2) : digits.slice(1);
    if (number.length === 10) {
      return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }
  }
  
  // Handle US/Canada format (10 digits)
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // If it doesn't match standard format, return as-is
  return phone;
}
