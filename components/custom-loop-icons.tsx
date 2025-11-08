/**
 * Custom SVG Icons for Loop Groups
 * 
 * Add your custom SVG icons as React components here.
 * Each icon should accept a className prop for styling.
 * 
 * Example:
 * export function FamilyIcon({ className }: { className?: string }) {
 *   return (
 *     <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
 *       <path d="..." stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
 *     </svg>
 *   );
 * }
 */

// Type for icon component
type IconComponent = React.ComponentType<{ className?: string }>;

// Example custom icon (placeholder - replace with your own)
export function CustomIcon1({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="2" 
        fill="none"
      />
      <path 
        d="M12 6v6l4 2" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </svg>
  );
}

// Add more custom icons here...
// export function CustomIcon2({ className }: { className?: string }) { ... }
// export function CustomIcon3({ className }: { className?: string }) { ... }

/**
 * Registry of all custom SVG icons
 * 
 * Add your custom icon names here so they can be used in the IconSelector.
 * The key should match the component name.
 */
export const CUSTOM_SVG_ICONS: Record<string, IconComponent> = {
  CustomIcon1,
  // CustomIcon2,
  // CustomIcon3,
  // Add more as you create them...
};

/**
 * Array of custom icon names for the icon selector
 */
export const CUSTOM_SVG_ICON_NAMES = Object.keys(CUSTOM_SVG_ICONS);

