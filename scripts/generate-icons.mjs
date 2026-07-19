// Rasterizes public/icon.svg into the PNG icon set. Run after changing the SVG:
//   node scripts/generate-icons.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";

const svg = readFileSync("public/icon.svg");
const targets = [
  { file: "public/icon-192.png", size: 192 },
  { file: "public/icon-512.png", size: 512 },
  { file: "public/apple-touch-icon.png", size: 180 },
];

for (const { file, size } of targets) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(file);
  console.log(`wrote ${file} (${size}x${size})`);
}

// Favicon: 32px PNG is fine for modern browsers; app/favicon.ico is replaced
// by a PNG-in-ico via sharp not being supported — write favicon-32 and let
// app/icon.png convention serve it.
await sharp(svg, { density: 300 }).resize(64, 64).png().toFile("app/icon.png");
console.log("wrote app/icon.png (64x64, served as favicon by Next)");

// Browsers auto-request /favicon.ico regardless of link tags; a PNG stream
// under the .ico name is accepted by all modern browsers and silences the 404.
await sharp(svg, { density: 300 }).resize(32, 32).png().toFile("public/favicon.ico");
console.log("wrote public/favicon.ico (32x32 PNG)");
