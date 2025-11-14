// Re-export database types for easier imports
export type {
  Database,
  Person,
  PersonInsert,
  PersonUpdate,
  Tag,
  TagInsert,
  TagUpdate,
  PersonTag,
  PersonTagInsert,
  Relationship,
  RelationshipInsert,
  RelationshipUpdate,
  Attachment,
  AttachmentInsert,
  AttachmentUpdate,
  Interaction,
  InteractionInsert,
  InteractionUpdate,
  PersonWithTags,
  PersonInteractionCount,
} from '@/types/database.types';

// Example usage in your components:
// import { Person, PersonInsert } from '@/lib/supabase/types';

// Example Supabase function calls:
// const { data } = await supabase.rpc('search_persons', { as any
//   search_query: 'john',
//   current_user_id: user.id
// });
//
// const { data } = await supabase.rpc('get_follow_up_reminders', { as any
//   current_user_id: user.id
// });

