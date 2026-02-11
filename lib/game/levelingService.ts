
export interface Unlock {
  type: 'GAME_MODE' | 'SLOT' | 'GARDEN_SKIN' | 'FEATURE';
  name: string;
  description?: string;
}

export interface LevelUpResult {
  hasLeveledUp: boolean;
  newLevel?: number;
  title?: string;
  unlocks?: Unlock[];
  gardenBonus?: number;
}

/**
 * Service to handle leveling logic and rewards
 */
export const levelingService = {
  /**
   * Check if user has gained enough XP to level up
   */
  checkLevelUp: (currentXP: number, currentLevel: number): LevelUpResult => {
    const nextLevelXP = 500; // Requirement for Level 2

    if (currentXP >= nextLevelXP && currentLevel < 2) {
      return {
        hasLeveledUp: true,
        newLevel: 2,
        title: "Garden Keeper",
        unlocks: [
          { type: 'GAME_MODE', name: 'Web Recall', description: 'Identify connections between your contacts' },
          { type: 'SLOT', name: 'Deep Lore Slot +1', description: 'Capture richer qualitative memory data for everyone' },
          { type: 'GARDEN_SKIN', name: 'Golden Hour', description: 'Unlock a beautiful new theme for your Garden' }
        ],
        gardenBonus: 25 // Instant health boost to all 'Drifting' contacts
      };
    }

    return { hasLeveledUp: false };
  },

  /**
   * Persist level up to database
   * (Placeholder logic - would update user profile and apply garden health bonus)
   */
  persistLevelUp: async (userId: string, newLevel: number) => {
    // 1. Update user profile level/title
    // 2. Apply bulk interest/health bonus to persons with low interaction
    // (Actual implementation depends on table schemas)
    console.log(`Persisting level ${newLevel} for user ${userId}`);
    return true;
  }
};
