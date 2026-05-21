/**
 * Generates sleeve mockup images from a real reference photo.
 * 1. Reads reference photo → base64
 * 2. Calls Replicate nano-banana to produce a clean studio product shot
 * 3. Downloads the result as the cream base image
 * 4. Uses @napi-rs/canvas to shift the fabric color → black and white variants
 * 5. Saves sleeve-cream.jpg, sleeve-black.jpg, sleeve-white.jpg to public/sleeves/
 */

import { createCanvas, loadImage } from '@napi-rs/canvas';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) { console.error('Set REPLICATE_API_TOKEN env var'); process.exit(1); }

const REF_PATH = 'C:/Users/mansr/Downloads/WhatsApp Image 2026-05-21 at 02.08.35.jpeg';
const OUT_DIR  = join('public', 'sleeves');
mkdirSync(OUT_DIR, { recursive: true });

// ── Step 1: copy reference to public/sleeves/ for inspection ──────────────────
copyFileSync(REF_PATH, join(OUT_DIR, 'reference.jpg'));
console.log('Copied reference → public/sleeves/reference.jpg');

// ── Step 2: call Replicate nano-banana img2img ────────────────────────────────
const refBuffer = readFileSync(REF_PATH);
const refBase64 = `data:image/jpeg;base64,${refBuffer.toString('base64')}`;

const PROMPT = [
  "clean product photo of a cream hoodie sleeve,",
  "flat lay on pure white background,",
  "professional studio lighting,",
  "showing full sleeve from shoulder seam connection at top to ribbed wrist cuff at bottom,",
  "sleeve straight and laid flat, no wrinkles, sharp clean edges,",
  "no bed, no sheets, no background objects, white background only,",
  "identical fabric color and texture as input",
].join(' ');

async function pollUntilDone(getUrl) {
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const r = await fetch(getUrl, { headers: { Authorization: `Token ${TOKEN}` } });
    const d = await r.json();
    if (d.status === 'succeeded') return Array.isArray(d.output) ? d.output[0] : d.output;
    if (d.status === 'failed') throw new Error('Replicate failed: ' + d.error);
    process.stdout.write('.');
  }
  throw new Error('Timed out waiting for Replicate');
}

console.log('\nCalling Replicate nano-banana img2img...');
const replicateRes = await fetch(
  'https://api.replicate.com/v1/models/google/nano-banana/predictions',
  {
    method: 'POST',
    headers: {
      Authorization: `Token ${TOKEN}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=60',
    },
    body: JSON.stringify({
      input: {
        prompt: PROMPT,
        image_input: [refBase64],
        aspect_ratio: 'match_input_image',
        output_format: 'png',
      },
    }),
  }
);

const repData = await replicateRes.json();
if (repData.error) throw new Error('Replicate error: ' + repData.error);

let baseUrl;
if (repData.output) {
  baseUrl = Array.isArray(repData.output) ? repData.output[0] : repData.output;
} else if (repData.urls?.get) {
  console.log('\nPolling...');
  baseUrl = await pollUntilDone(repData.urls.get);
} else {
  throw new Error('No output URL from Replicate');
}

console.log(`\nGenerated base URL: ${baseUrl}`);

// Download base image
const baseRes = await fetch(baseUrl);
const baseBuffer = Buffer.from(await baseRes.arrayBuffer());
const basePath = join(OUT_DIR, 'sleeve-base.png');
writeFileSync(basePath, baseBuffer);
console.log(`Saved base → ${basePath}`);

// ── Step 3: colour variant generation ─────────────────────────────────────────
async function recolorSleeve(sourcePath, outputPath, variant) {
  const img = await loadImage(sourcePath);
  const W = img.width, H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const { data } = ctx.getImageData(0, 0, W, H);

  // --- First pass: measure actual fabric luminance range ---
  // Background = very near white (R,G,B all > 248) — ignore those
  let minL = 255, maxL = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 248 && g > 248 && b > 248) continue; // background
    const L = 0.299 * r + 0.587 * g + 0.114 * b;
    if (L < minL) minL = L;
    if (L > maxL) maxL = L;
  }
  const lRange = maxL - minL || 1;
  console.log(`  [${variant}] fabric L range: ${minL.toFixed(0)}–${maxL.toFixed(0)}`);

  // --- Second pass: apply colour transform ---
  const id = ctx.getImageData(0, 0, W, H); // fresh copy for writing
  for (let i = 0; i < id.data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];

    // Keep fully-transparent pixels transparent
    if (a < 10) { id.data[i] = 255; id.data[i+1] = 255; id.data[i+2] = 255; id.data[i+3] = 255; continue; }

    // Background: keep white
    if (r > 248 && g > 248 && b > 248) {
      id.data[i] = 255; id.data[i+1] = 255; id.data[i+2] = 255; id.data[i+3] = 255;
      continue;
    }

    const L = 0.299 * r + 0.587 * g + 0.114 * b;
    // Normalised texture factor: 0 = deepest shadow, 1 = brightest highlight
    const tf = Math.max(0, Math.min(1, (L - minL) / lRange));

    let nr, ng, nb;
    if (variant === 'cream') {
      // Keep original colours
      nr = r; ng = g; nb = b;
    } else if (variant === 'black') {
      // Deep black fabric: shadows #000000, highlights ~#3a3a3a
      const v = Math.round(tf * 58); // 0 → 58 (0x3a)
      nr = v; ng = v; nb = v;
    } else if (variant === 'white') {
      // Near-white fabric: shadows #c0c0c0, highlights #ffffff
      const v = Math.round(192 + tf * 63); // 192 → 255
      nr = Math.min(255, v); ng = Math.min(255, v); nb = Math.min(255, v);
    }

    id.data[i]   = nr;
    id.data[i+1] = ng;
    id.data[i+2] = nb;
    id.data[i+3] = 255;
  }

  ctx.putImageData(id, 0, 0);
  const jpegBuf = canvas.toBuffer('image/jpeg', { quality: 0.93 });
  writeFileSync(outputPath, jpegBuf);
  console.log(`  Saved → ${outputPath}`);
}

console.log('\nCreating colour variants from base image...');
await recolorSleeve(basePath, join(OUT_DIR, 'sleeve-cream.jpg'),  'cream');
await recolorSleeve(basePath, join(OUT_DIR, 'sleeve-black.jpg'), 'black');
await recolorSleeve(basePath, join(OUT_DIR, 'sleeve-white.jpg'), 'white');

console.log('\nDone! All sleeve images saved to public/sleeves/');
