#!/usr/bin/env node

/**
 * Convert SVG icons to PNG
 * Uses sharp library to convert SVG to PNG format
 */

const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  try {
    // Try to use sharp
    const sharp = require('sharp');

    const publicDir = path.join(__dirname, '..', 'public');
    const sizes = [192, 512];

    for (const size of sizes) {
      const svgPath = path.join(publicDir, `icon-${size}.svg`);
      const pngPath = path.join(publicDir, `icon-${size}.png`);

      if (!fs.existsSync(svgPath)) {
        console.log(`⚠️  ${svgPath} not found, skipping...`);
        continue;
      }

      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(pngPath);

      console.log(`✓ Converted icon-${size}.svg → icon-${size}.png`);

      // Remove SVG file
      fs.unlinkSync(svgPath);
      console.log(`  Removed icon-${size}.svg`);
    }

    console.log('\n✨ All icons converted successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('❌ Sharp library not found. Installing...');
      console.log('Run: npm install --save-dev sharp');
      console.log('Then run this script again.');
    } else {
      console.error('Error converting icons:', error.message);
    }
    process.exit(1);
  }
}

convertSvgToPng();
