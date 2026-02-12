'use server';

import { createClient } from '@/lib/supabase/server';

export interface ForecastData {
  currentHealth: number;
  forecastedHealth: number;
  velocityResonance: number;
  decayCount: number;
  weatherState: 'sunny' | 'overcast' | 'stormy';
  atRiskContacts: {
    id: string;
    name: string;
    daysUntilDecay: number;
    importance: string;
  }[];
}

export async function getSocialForecast(): Promise<{ data: ForecastData | null; error: any }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: null, error: 'Unauthorized' };

  try {
    // 1. Fetch all active contacts
    const { data: contacts, error: contactError } = await supabase
      .from('persons')
      .select('id, name, last_interaction_date, target_frequency_days, importance')
      .eq('user_id', user.id)
      .or('archived.eq.false,archived.is.null,archive_status.eq.false,archive_status.is.null');

    if (contactError) throw contactError;

    // 2. Fetch successful outcomes from learning_ledger in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: ledgerEntries, error: ledgerError } = await supabase
      .from('learning_ledger')
      .select('id')
      .eq('user_id', user.id)
      .eq('actual_outcome', true)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (ledgerError) throw ledgerError;

    const vRDeltaT = ledgerEntries?.length || 0;

    const now = new Date();
    let currentHealth = 0;
    let decayCount = 0;
    const atRiskContacts: ForecastData['atRiskContacts'] = [];

    (contacts || []).forEach(contact => {
      const importanceValue = contact.importance || 'medium';
      const targetFrequency = contact.target_frequency_days || (importanceValue === 'high' ? 14 : importanceValue === 'low' ? 90 : 30);
      
      if (!contact.last_interaction_date) {
        // Not "Nurtured" currently
        return;
      }

      const lastInteraction = new Date(contact.last_interaction_date);
      const daysSince = Math.floor((now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSince <= targetFrequency) {
        currentHealth++;
        
        // Will they decay in the next 30 days?
        const daysUntilDecay = targetFrequency - daysSince;
        if (daysUntilDecay <= 30) {
          decayCount++;
          atRiskContacts.push({
            id: contact.id,
            name: contact.name,
            daysUntilDecay,
            importance: importanceValue
          });
        }
      }
    });

    const forecastedHealth = currentHealth + vRDeltaT - decayCount;

    let weatherState: ForecastData['weatherState'] = 'overcast';
    if (forecastedHealth > currentHealth) {
      weatherState = 'sunny';
    } else if (forecastedHealth < currentHealth) {
      weatherState = 'stormy';
    }

    // Sort at-risk contacts by urgency
    atRiskContacts.sort((a, b) => a.daysUntilDecay - b.daysUntilDecay);

    return {
      data: {
        currentHealth,
        forecastedHealth,
        velocityResonance: vRDeltaT,
        decayCount,
        weatherState,
        atRiskContacts: atRiskContacts.slice(0, 10) // Show top 10 at risk
      },
      error: null
    };

  } catch (error) {
    console.error('Error in getSocialForecast:', error);
    return { data: null, error };
  }
}
