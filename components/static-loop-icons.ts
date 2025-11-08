/**
 * Static Loop Group Icons
 * 
 * Registry for PNG/JPG icons stored in public/icons/loop-groups/
 * 
 * To add a new icon:
 * 1. Place your PNG/JPG file in: public/icons/loop-groups/
 * 2. Add an entry to the STATIC_LOOP_ICONS array below
 * 
 * Example:
 * { name: "Family", path: "/icons/loop-groups/family.png" }
 */

export interface StaticLoopIcon {
  name: string;
  path: string;
}

/**
 * Registry of static loop group icons
 * 
 * Add your custom PNG/JPG icons here.
 * The 'name' will be displayed in the UI and stored in the database.
 * The 'path' should be relative to the public directory.
 */
export const STATIC_LOOP_ICONS: StaticLoopIcon[] = [
  // Example entries (uncomment and modify after adding your icon files):
  // { name: "Family", path: "/icons/loop-groups/family.png" },
  // { name: "Work", path: "/icons/loop-groups/work.png" },
  // { name: "Friends", path: "/icons/loop-groups/friends.png" },
  // { name: "Gym", path: "/icons/loop-groups/gym.png" },
  // { name: "Travel", path: "/icons/loop-groups/travel.png" },
  // { name: "Hobbies", path: "/icons/loop-groups/hobbies.png" },
  // { name: "Church", path: "/icons/loop-groups/church.png" },
  // { name: "School", path: "/icons/loop-groups/school.png" },
  // { name: "Sports", path: "/icons/loop-groups/sports.png" },
  // { name: "Music", path: "/icons/loop-groups/music.png" },
];

/**
 * Helper function to check if an icon name is a static icon
 */
export function isStaticIcon(iconName: string): boolean {
  return STATIC_LOOP_ICONS.some(icon => icon.name === iconName);
}

/**
 * Helper function to get the path for a static icon
 */
export function getStaticIconPath(iconName: string): string | undefined {
  return STATIC_LOOP_ICONS.find(icon => icon.name === iconName)?.path;
}

