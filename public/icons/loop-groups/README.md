# Loop Group Custom Icons

This directory contains custom preset icons for Loop Groups.

## Adding New Icons

1. **Add your icon files here** (PNG or JPG format recommended)
   - Use consistent sizing (e.g., 512x512px or 1024x1024px)
   - Use transparent backgrounds for PNG files if desired
   - Name files descriptively (e.g., `family.png`, `work.png`, `gym.png`)

2. **Register your icons** in `components/static-loop-icons.ts`:
   ```typescript
   export const STATIC_LOOP_ICONS: StaticLoopIcon[] = [
     { name: "Family", path: "/icons/loop-groups/family.png" },
     { name: "Work", path: "/icons/loop-groups/work.png" },
     // Add more icons here...
   ];
   ```

3. **Icons will automatically appear** in the icon selector grid

## Icon Guidelines

- **Size**: 512x512px or larger (will be scaled down)
- **Format**: PNG (with transparency) or JPG
- **Style**: Should work well on colored backgrounds
- **Naming**: Use lowercase with hyphens (e.g., `my-custom-icon.png`)

## Examples

Good examples of icon types:
- `family.png` - Family/household icon
- `work.png` - Work/professional icon
- `gym.png` - Fitness/exercise icon
- `travel.png` - Travel/vacation icon
- `church.png` - Religious/spiritual icon
- `school.png` - Education icon

## Upload Your Icons Here

Simply drag and drop your icon files into this directory, then update the registry in `components/static-loop-icons.ts`.

