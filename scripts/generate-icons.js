#!/usr/bin/env node

/**
 * Generate placeholder PWA icons
 * This creates simple placeholder icons for the app
 * Replace these with professionally designed icons later
 */

const fs = require('fs');
const path = require('path');

// SVG template for the icon
const createIconSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#8b5cf6" rx="${size * 0.15}"/>

  <!-- Icon design: Stylized "RM" with connection nodes -->
  <g transform="translate(${size * 0.5}, ${size * 0.5})">
    <!-- Letter R -->
    <text
      x="-${size * 0.2}"
      y="${size * 0.15}"
      font-family="Arial, sans-serif"
      font-size="${size * 0.35}"
      font-weight="bold"
      fill="white"
      text-anchor="middle">R</text>

    <!-- Letter M -->
    <text
      x="${size * 0.2}"
      y="${size * 0.15}"
      font-family="Arial, sans-serif"
      font-size="${size * 0.35}"
      font-weight="bold"
      fill="white"
      text-anchor="middle">M</text>

    <!-- Connection dots -->
    <circle cx="-${size * 0.3}" cy="-${size * 0.25}" r="${size * 0.04}" fill="#60efff"/>
    <circle cx="${size * 0.3}" cy="-${size * 0.25}" r="${size * 0.04}" fill="#60efff"/>
    <circle cx="0" cy="${size * 0.3}" r="${size * 0.04}" fill="#60efff"/>

    <!-- Connection lines -->
    <line x1="-${size * 0.3}" y1="-${size * 0.25}" x2="0" y2="${size * 0.3}" stroke="#60efff" stroke-width="${size * 0.01}" opacity="0.5"/>
    <line x1="${size * 0.3}" y1="-${size * 0.25}" x2="0" y2="${size * 0.3}" stroke="#60efff" stroke-width="${size * 0.01}" opacity="0.5"/>
  </g>
</svg>`;

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate icons
const sizes = [192, 512];

sizes.forEach(size => {
  const svg = createIconSVG(size);
  const filename = `icon-${size}.svg`;
  const filepath = path.join(publicDir, filename);

  fs.writeFileSync(filepath, svg);
  console.log(`✓ Created ${filename}`);
});

console.log('\n✨ SVG icons created successfully!');
console.log('\n📝 Next steps:');
console.log('1. Convert SVG to PNG using one of these methods:');
console.log('   - Online: https://cloudconvert.com/svg-to-png');
console.log('   - Command line: Install sharp-cli and run "npx @squoosh/cli --resize {192,512} icon-*.svg"');
console.log('   - Design tool: Open in Figma/Sketch and export as PNG');
console.log('2. Replace icon-192.svg and icon-512.svg with icon-192.png and icon-512.png');
console.log('3. Delete the .svg files after conversion\n');
