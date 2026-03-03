export interface NurtureContext {
  contactId: string;
  name: string;
  whyStayInContact: string; // From the "Story" tab
  lastSharedMemory?: {
    content: string;
    date: string;
  };
  preferredChannel: 'SMS' | 'WhatsApp' | 'Email' | 'Call';
  phoneNumber?: string;
}
