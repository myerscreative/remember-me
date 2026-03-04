/** Contact shape used by dashboard map and garden preview (from getAllMapContacts). */
export interface DashboardMapContact {
  id: string;
  name: string;
  status?: string;
  last_interaction_date?: string | null;
  lastContact?: string | null;
  importance?: string | null;
  target_frequency_days?: number | null;
  is_favorite?: boolean | null;
  tags?: string[];
}
