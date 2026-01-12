import { createClient } from '@/lib/supabase/client';
import { Person, InterContactRelationship } from '@/types/database.types';

export interface NetworkContact extends Person {
  tags?: string[];
  interest_details?: { id: string; name: string; domain_id: string | null }[];
  tag_details?: { id: string; name: string; domain_id: string | null }[];
}

export interface TagDomain {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface SubTribe {
  id: string;
  name: string; // The specific tag name (e.g. "Basketball")
  domainId: string;
  memberCount: number;
  members: NetworkContact[];
}

export interface DomainGroup {
  domain: TagDomain;
  subTribes: SubTribe[];
  totalMembers: number; // Unique members in this domain
}

export interface NetworkData {
  contacts: NetworkContact[];
  relationships: InterContactRelationship[];
  domains: DomainGroup[];
}

export class NetworkDataService {
  private supabase = createClient();

  async fetchNetworkData(): Promise<NetworkData> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // 1. Fetch Domains
    const { data: domains } = await this.supabase
      .from('tag_domains')
      .select('*')
      .order('name');
      
    // 2. Fetch all active contacts with their relational tags/interests (including domain info)
    const { data: contactsData, error: contactsError } = await this.supabase
      .from('persons')
      .select(`
        *, 
        person_interests(
          interests(id, name, domain_id)
        ), 
        person_tags(
          tags(id, name, domain_id)
        )
      `)
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('name');

    if (contactsError) throw contactsError;

    // 3. Transform to inject interests/tags into the contact object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contacts: NetworkContact[] = (contactsData || []).map((c: any) => {
        // Map interests with details
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const interestDetails = c.person_interests?.map((pi: any) => pi.interests).filter(Boolean) || [];
        const interestNames = interestDetails.map((i: any) => i.name);
        
        // Map tags with details
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tagDetails = c.person_tags?.map((pt: any) => pt.tags).filter(Boolean) || [];
        const tagNames = tagDetails.map((t: any) => t.name);

        const uniqueTags = Array.from(new Set([...(c.tags || []), ...tagNames]));
        const uniqueInterests = Array.from(new Set([...(c.interests || []), ...interestNames]));
        
        return {
            ...c,
            interests: uniqueInterests,
            tags: uniqueTags,
            interest_details: interestDetails,
            tag_details: tagDetails
        };
    });

    // 4. Fetch relationships
    const { data: relationships, error: relError } = await this.supabase
      .from('inter_contact_relationships')
      .select('*')
      .eq('user_id', user.id);

    if (relError) throw relError;

    // 5. Group by Domain
    const domainGroups = this.groupContactsByDomain(contacts, domains || []);

    return {
      contacts,
      relationships: relationships || [],
      domains: domainGroups
    };
  }

  private groupContactsByDomain(contacts: NetworkContact[], domains: TagDomain[]): DomainGroup[] {
    const domainMap = new Map<string, DomainGroup>();

    // Initialize all domains (even empty ones)
    domains.forEach(d => {
      domainMap.set(d.id, {
        domain: d,
        subTribes: [],
        totalMembers: 0
      });
    });

    // Fallback 'General' or 'Friends' domain if we can't match?
    // Create a virtual "Uncategorized" domain for items with missing/invalid domain_id
    const uncategorizedDomain: DomainGroup = {
        domain: {
            id: 'uncategorized',
            name: 'Uncategorized',
            icon: '📦',
            color: '#94a3b8' // Slate-400
        },
        subTribes: [],
        totalMembers: 0
    };

    contacts.forEach(contact => {
       const mappedSubTribes = new Set<string>(); // avoid double counting member in same subtribe for this contact

       // Helper to process items
       const processItems = (items: { id: string, name: string, domain_id: string | null }[] | undefined) => {
          if (!items) return;
          items.forEach(item => {
             let group: DomainGroup;
             
                group = domainMap.get(item.domain_id)!;
             } else {
                // Smart Auto-Categorization Fallback
                // Try to find a matching domain by name or keyword
                const itemNameLower = item.name.toLowerCase();
                
                // 1. Direct Domain Name Match (e.g. tag "Work" -> Work Domain)
                let matchedDomainId = Array.from(domainMap.keys()).find(id => {
                    const domainName = domainMap.get(id)?.domain.name.toLowerCase();
                    return domainName === itemNameLower || (domainName === 'relationships' && (itemNameLower === 'friend' || itemNameLower === 'family'));
                });

                // 2. Keyword Mapping (Simple Heuristics)
                if (!matchedDomainId) {
                    const interestsKeywords = ['fishing', 'coffee', 'guitar', 'hiking', 'photography', 'books', 'tennis', 'cooking', 'golf', 'wine', 'yoga', 'travel', 'running', 'music', 'art', 'surfing', 'basketball', 'sport', 'gym', 'reading'];
                    const workKeywords = ['software', 'product', 'manager', 'designer', 'entrepreneur', 'data', 'agent', 'marketing', 'teacher', 'business', 'sales', 'developer', 'engineer', 'ceo', 'founder', 'windows', 'doors', 'panoramic'];
                    const travelKeywords = ['japan', 'japanese', 'france', 'italy', 'trip', 'vacation', 'visit'];
                    const relationshipKeywords = ['daughter', 'son', 'wife', 'husband', 'mom', 'dad', 'neighbor', 'classmate', 'school', 'mentor', 'client'];

                    const checkKeywords = (keywords: string[]) => keywords.some(k => itemNameLower.includes(k));

                    if (checkKeywords(interestsKeywords)) matchedDomainId = Array.from(domainMap.values()).find(d => d.domain.name === 'Interests')?.domain.id;
                    else if (checkKeywords(workKeywords)) matchedDomainId = Array.from(domainMap.values()).find(d => d.domain.name === 'Work')?.domain.id;
                    else if (checkKeywords(travelKeywords)) matchedDomainId = Array.from(domainMap.values()).find(d => d.domain.name === 'Travel')?.domain.id;
                    else if (checkKeywords(relationshipKeywords)) matchedDomainId = Array.from(domainMap.values()).find(d => d.domain.name === 'Relationships' || d.domain.name === 'Friends')?.domain.id;
                }

                if (matchedDomainId && domainMap.has(matchedDomainId)) {
                    group = domainMap.get(matchedDomainId)!;
                } else {
                    // Finally, Fallback to Uncategorized
                    group = uncategorizedDomain;
                }
             }

             // Find or create sub-tribe
             let subTribe = group.subTribes.find(st => st.name === item.name);
             if (!subTribe) {
                subTribe = {
                    id: item.id, // Use interest/tag ID as subtribe ID
                    name: item.name,
                    domainId: group.domain.id,
                    memberCount: 0,
                    members: []
                };
                group.subTribes.push(subTribe);
             }

             // Add member if not already added to this specific subtribe
             if (!subTribe.members.find(m => m.id === contact.id)) {
                subTribe.members.push(contact);
                subTribe.memberCount++;
             }
          });
       };

       processItems(contact.interest_details);
       processItems(contact.tag_details);
    });

    // Calculate total unique members per domain
    const allGroups = [...Array.from(domainMap.values())];
    if (uncategorizedDomain.subTribes.length > 0) {
        allGroups.push(uncategorizedDomain);
    }

    allGroups.forEach(group => {
       const uniquemembers = new Set<string>();
       group.subTribes.forEach(st => {
          st.members.forEach(m => uniquemembers.add(m.id));
       });
       group.totalMembers = uniquemembers.size;
       
       // Sort subtribes by count
       group.subTribes.sort((a, b) => b.memberCount - a.memberCount);
    });

    return allGroups;
  }
}

export const networkService = new NetworkDataService();
