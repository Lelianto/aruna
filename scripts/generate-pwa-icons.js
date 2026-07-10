/* eslint-disable @typescript-eslint/no-require-imports */
// Rasterizes src/app/icon.svg into the PWA PNG icons referenced by the manifest.
// Run with: node scripts/generate-pwa-icons.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'src', 'app', 'icon.svg');
const outDir = path.join(__dirname, '..', 'public');
const svg = fs.readFileSync(svgPath);

async function main() {
  // Standard "any" icons on a transparent background.
  await sharp(svg, { density: 700 }).resize(192, 192).png().toFile(path.join(outDir, 'icon-192.png'));
  await sharp(svg, { density: 1600 }).resize(512, 512).png().toFile(path.join(outDir, 'icon-512.png'));

  // Maskable icon: full-bleed square (theme navy) with the logo centered at ~78%,
  // so Android can crop it into any shape without clipping the mark.
  const logo = await sharp(svg, { density: 1600 }).resize(400, 400).png().toBuffer();
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: '#003049' },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(path.join(outDir, 'icon-512-maskable.png'));

  console.log('Generated: public/icon-192.png, public/icon-512.png, public/icon-512-maskable.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
