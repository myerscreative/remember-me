import { BasePerson } from './database.types';

export interface Person extends BasePerson {
  importance: 'high' | 'medium' | 'low' | string | null;
  target_frequency_days: number | null;
  deep_lore: string | null;
  interaction_count: number;
  last_interaction_date: string | null;
}

export * from './database.types';
