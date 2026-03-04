/**
 * Optional image optimization script for assets in public/.
 * Run: node scripts/optimize-images.js
 * Requires: npm install -D sharp (already in devDependencies).
 * Outputs WebP alongside originals; delete or replace originals manually if desired.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MAX_WIDTH = 1920;
const QUALITY = 80;

async function optimizeImages() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.warn('sharp not installed. Run: npm install -D sharp');
    process.exit(0);
  }

  const exts = ['.png', '.jpg', '.jpeg'];
  const files = fs.readdirSync(PUBLIC_DIR, { withFileTypes: true })
    .filter((f) => f.isFile() && exts.includes(path.extname(f.name).toLowerCase()))
    .map((f) => path.join(PUBLIC_DIR, f.name));

  if (files.length === 0) {
    console.log('No PNG/JPEG images in public/. Add images and run again.');
    return;
  }

  for (const file of files) {
    const basename = path.basename(file, path.extname(file));
    const outPath = path.join(PUBLIC_DIR, `${basename}.webp`);
    try {
      await sharp(file)
        .resize(MAX_WIDTH, null, { withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(outPath);
      console.log('Created:', path.relative(PUBLIC_DIR, outPath));
    } catch (err) {
      console.error('Error processing', file, err.message);
    }
  }
}

optimizeImages();
