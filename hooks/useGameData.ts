import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getInitials } from '@/lib/utils/contact-helpers';

export interface GameContact {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  photo_url?: string | null;
  company?: string | null;
  location?: string | null; // We might need to omit this if not in DB
  title?: string | null; // job_title
  interests: string[];
  tags: string[];
  group: string; // Derived from tags or 'General'
  lastContactDate?: string | null;
  family?: any; // For fact match
}

export function useGameData() {
  const [contacts, setContacts] = useState<GameContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContacts() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
           // If no user, maybe we shouldn't fetch anything or handle it 
           setLoading(false);
           return;
        }

        // Fetch basic info + tags
        const { data: persons, error } = await supabase
          .from('persons')
          .select(`
            id,
            name,
            first_name,
            last_name,
            photo_url,
            // avatar_url might be an old field, photo_url is preferred
            company,
            job_title,
            interests,
            last_interaction_date,
            person_tags (
              tags (
                name
              )
            ),
            family_members // For fact match
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        if (!persons) {
            setContacts([]);
            return;
        }

        const normalizedContacts: GameContact[] = persons.map((p: any) => {
           const tags = p.person_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [];
           
           // Determine "Group" for games (Work, Family, etc)
           let group = 'General';
           if (tags.some((t: string) => /work|job|career/i.test(t))) group = 'work';
           else if (tags.some((t: string) => /family|parent|spouse/i.test(t))) group = 'family';
           else if (tags.some((t: string) => /friend/i.test(t))) group = 'friends';
           
           return {
             id: p.id,
             name: p.name,
             firstName: p.first_name || p.name.split(' ')[0],
             initials: getInitials(p.name),
             photo_url: p.photo_url, // fallback logic if needed
             company: p.company,
             title: p.job_title,
             location: null, // No field yet
             interests: p.interests || [],
             tags: tags,
             group: group,
             lastContactDate: p.last_interaction_date,
             family: p.family_members
           };
        });

        // Filter out contacts with essentially NO data? 
        // Games might need name at minimum.
        const validContacts = normalizedContacts.filter(c => c.name);

        setContacts(validContacts);

      } catch (err: any) {
        console.error('Error fetching game data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchContacts();
  }, []);

  return { contacts, loading, error };
}
