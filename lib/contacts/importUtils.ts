// VCF (vCard) and CSV Contact Import Utilities

export interface ImportedContact {
  name: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  notes: string | null;
  photo: string | null; // Base64 encoded photo data
  imported: boolean;
  has_context: boolean;
}

/**
 * Parse VCF (vCard) file content into contact objects
 * Supports vCard 2.1, 3.0, and 4.0 formats
 */
export function parseVCF(vcfContent: string): ImportedContact[] {
  const contacts: ImportedContact[] = [];

  // Split by BEGIN:VCARD to get individual cards
  const vcards = vcfContent.split(/BEGIN:VCARD/i).filter(v => v.trim());

  for (const vcard of vcards) {
    const lines = vcard.split(/\r?\n/).filter(line => line.trim());

    let firstName = '';
    let lastName = '';
    let fullName = '';
    let email = '';
    let phone = '';
    let birthday = '';
    let notes = '';
    let photo = '';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // Handle folded lines (continuation lines starting with space or tab)
      while (i + 1 < lines.length && /^[ \t]/.test(lines[i + 1])) {
        line += lines[i + 1].trim();
        i++;
      }

      // Parse FN (Full Name)
      if (/^FN[:;]/i.test(line)) {
        fullName = extractValue(line);
      }

      // Parse N (Structured Name: Last;First;Middle;Prefix;Suffix)
      else if (/^N[:;]/i.test(line)) {
        const value = extractValue(line);
        const parts = value.split(';');
        lastName = parts[0] || '';
        firstName = parts[1] || '';
      }

      // Parse EMAIL
      else if (/^EMAIL[:;]/i.test(line)) {
        if (!email) { // Take first email
          email = extractValue(line);
        }
      }

      // Parse TEL (Phone)
      else if (/^TEL[:;]/i.test(line)) {
        if (!phone) { // Take first phone
          phone = extractValue(line);
          phone = normalizePhone(phone);
        }
      }

      // Parse BDAY (Birthday)
      else if (/^BDAY[:;]/i.test(line)) {
        const value = extractValue(line);
        birthday = normalizeBirthday(value);
      }

      // Parse NOTE
      else if (/^NOTE[:;]/i.test(line)) {
        notes = extractValue(line);
        notes = notes.replace(/\\n/g, '\n').replace(/\\,/g, ',');
      }

      // Parse PHOTO (base64 encoded)
      else if (/^PHOTO[:;]/i.test(line)) {
        photo = extractPhotoData(line);
      }
    }

    // Use full name if structured name not available
    if (!firstName && fullName) {
      const nameParts = fullName.trim().split(/\s+/);
      firstName = nameParts[0] || '';
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    }

    // Skip if no name
    if (!firstName && !lastName && !fullName) {
      continue;
    }

    const name = fullName || `${firstName} ${lastName}`.trim();

    contacts.push({
      name,
      first_name: firstName || fullName.split(' ')[0] || '',
      last_name: lastName || null,
      email: email || null,
      phone: phone || null,
      birthday: birthday || null,
      notes: notes || null,
      photo: photo || null,
      imported: true,
      has_context: false,
    });
  }

  return contacts;
}

/**
 * Parse CSV file content into contact objects
 * Supports common CSV formats from various sources
 */
export function parseCSV(csvContent: string): ImportedContact[] {
  const contacts: ImportedContact[] = [];

  // Split into lines
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim());

  if (lines.length < 2) {
    return contacts; // Need at least header + 1 row
  }

  // Parse header to detect column mapping
  const header = parseCSVLine(lines[0]);
  const columnMap = detectCSVColumns(header);

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    if (values.length === 0) continue;

    const firstName = getColumnValue(values, columnMap.firstName);
    const lastName = getColumnValue(values, columnMap.lastName);
    const fullName = getColumnValue(values, columnMap.name);
    const email = getColumnValue(values, columnMap.email);
    const phone = getColumnValue(values, columnMap.phone);
    const birthday = getColumnValue(values, columnMap.birthday);
    const notes = getColumnValue(values, columnMap.notes);

    // Determine name
    let finalFirstName = firstName;
    let finalLastName = lastName;
    let finalFullName = fullName;

    if (!finalFirstName && fullName) {
      const parts = fullName.split(/\s+/);
      finalFirstName = parts[0] || '';
      finalLastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
    }

    if (!finalFullName) {
      finalFullName = `${finalFirstName} ${finalLastName}`.trim();
    }

    // Skip if no name
    if (!finalFirstName && !finalLastName && !finalFullName) {
      continue;
    }

    contacts.push({
      name: finalFullName,
      first_name: finalFirstName || finalFullName.split(' ')[0] || '',
      last_name: finalLastName || null,
      email: email || null,
      phone: phone ? normalizePhone(phone) : null,
      birthday: birthday ? normalizeBirthday(birthday) : null,
      notes: notes || null,
      photo: null, // CSV doesn't support photos
      imported: true,
      has_context: false,
    });
  }

  return contacts;
}

/**
 * Parse a CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  values.push(current.trim());

  return values;
}

/**
 * Detect column indices from CSV header
 */
function detectCSVColumns(header: string[]): {
  firstName: number;
  lastName: number;
  name: number;
  email: number;
  phone: number;
  birthday: number;
  notes: number;
} {
  const map = {
    firstName: -1,
    lastName: -1,
    name: -1,
    email: -1,
    phone: -1,
    birthday: -1,
    notes: -1,
  };

  header.forEach((col, index) => {
    const lower = col.toLowerCase().trim();

    // First Name
    if (/^(first|given|fname|firstname)/.test(lower)) {
      map.firstName = index;
    }
    // Last Name
    else if (/^(last|family|surname|lname|lastname)/.test(lower)) {
      map.lastName = index;
    }
    // Full Name
    else if (/^(name|full|fullname|display)/.test(lower)) {
      map.name = index;
    }
    // Email
    else if (/^(email|e-mail|mail)/.test(lower)) {
      map.email = index;
    }
    // Phone
    else if (/^(phone|tel|mobile|cell)/.test(lower)) {
      map.phone = index;
    }
    // Birthday
    else if (/^(birth|bday|birthday|dob)/.test(lower)) {
      map.birthday = index;
    }
    // Notes
    else if (/^(note|notes|comment|description)/.test(lower)) {
      map.notes = index;
    }
  });

  return map;
}

/**
 * Get column value by index
 */
function getColumnValue(values: string[], index: number): string {
  if (index === -1 || index >= values.length) return '';
  return values[index].trim();
}

/**
 * Extract value from vCard line (handles various formats)
 */
function extractValue(line: string): string {
  // Handle TYPE parameters: EMAIL;TYPE=HOME:value or EMAIL:value
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) return '';

  return line.substring(colonIndex + 1).trim();
}

/**
 * Extract photo data from vCard PHOTO line
 * Handles formats: PHOTO;ENCODING=BASE64:data or PHOTO;VALUE=URI:data
 */
function extractPhotoData(line: string): string {
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) return '';

  const data = line.substring(colonIndex + 1).trim();
  
  // If it looks like a data URI, return as-is
  if (data.startsWith('data:')) {
    return data;
  }
  
  // If it's raw base64 data, detect the image type from the header
  if (data.length > 0) {
    // JPEG starts with /9j, PNG with iVBOR, GIF with R0lGO
    if (data.startsWith('/9j')) {
      return `data:image/jpeg;base64,${data}`;
    } else if (data.startsWith('iVBOR')) {
      return `data:image/png;base64,${data}`;
    } else if (data.startsWith('R0lGO')) {
      return `data:image/gif;base64,${data}`;
    }
    // Default to JPEG
    return `data:image/jpeg;base64,${data}`;
  }
  
  return '';
}

/**
 * Normalize phone number to consistent format
 */
function normalizePhone(phone: string): string {
  // Remove all non-digit characters except + at start
  let normalized = phone.replace(/[^\d+]/g, '');

  // If starts with +, keep it
  if (phone.trim().startsWith('+')) {
    normalized = '+' + normalized.replace(/\+/g, '');
  }

  return normalized;
}

/**
 * Normalize birthday to YYYY-MM-DD format
 */
function normalizeBirthday(birthday: string): string {
  // Try to parse various formats

  // ISO format: YYYY-MM-DD or YYYYMMDD
  if (/^\d{4}-?\d{2}-?\d{2}$/.test(birthday)) {
    return birthday.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  }

  // Try parsing as Date
  const date = new Date(birthday);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return '';
}

/**
 * Deduplicate contacts by name and email
 */
export function deduplicateContacts(contacts: ImportedContact[]): ImportedContact[] {
  const seen = new Set<string>();
  const unique: ImportedContact[] = [];

  for (const contact of contacts) {
    // Create a key from name and email
    const key = `${contact.name.toLowerCase()}|${contact.email?.toLowerCase() || ''}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(contact);
    }
  }

  return unique;
}

/**
 * Validate imported contact data
 */
export function validateContact(contact: ImportedContact): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!contact.name || contact.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!contact.first_name || contact.first_name.trim().length === 0) {
    errors.push('First name is required');
  }

  if (contact.email && !isValidEmail(contact.email)) {
    errors.push('Invalid email format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Batch contacts into chunks for efficient insertion
 */
export function batchContacts<T>(contacts: T[], batchSize: number = 100): T[][] {
  const batches: T[][] = [];

  for (let i = 0; i < contacts.length; i += batchSize) {
    batches.push(contacts.slice(i, i + batchSize));
  }

  return batches;
}
