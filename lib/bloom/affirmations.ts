export const SUCCESS_SEEDS = [
  "Relationship successfully watered! 🌱",
  "You just planted a seed of connection. ✨",
  "Relationship Nourished! Moved to the inner circle. 🌸",
  "Intentionality pays off. Your garden is growing. 🌿",
  "Connection refreshed. That large leaf is blooming again! 🍃",
  "Beautifully nurtured. Your garden thrives! 🌻",
  "A small action, a deep root. Well done! 🌳",
  "Memory preserved. The connection deepens. 🌺",
  "Another branch added to the family tree. 🌿",
  "Watered and flourishing. 💧",
  "Nurtured to perfection. 🌷",
  "One step closer to a flourishing garden. 🍀"
];

export function getRandomAffirmation(): string {
  return SUCCESS_SEEDS[Math.floor(Math.random() * SUCCESS_SEEDS.length)];
}
