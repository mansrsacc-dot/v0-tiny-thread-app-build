/**
 * Step 1: smooths the cream sleeve via nano-banana img2img (removes wrinkles)
 * Step 2: generates a proper black sleeve via nano-banana img2img from the smooth base
 * Both outputs replace the existing files in public/sleeves/
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) { console.error('Set REPLICATE_API_TOKEN env var'); process.exit(1); }

async function callNanoBanana(imageBase64, prompt) {
  console.log(`\nCalling nano-banana: "${prompt.slice(0, 80)}..."`);
  const res = await fetch(
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
          prompt,
          image_input: [imageBase64],
          aspect_ratio: 'match_input_image',
          output_format: 'jpg',
        },
      }),
    }
  );

  const data = await res.json();
  if (data.error) throw new Error('Replicate error: ' + data.error);

  let outputUrl;
  if (data.output) {
    outputUrl = Array.isArray(data.output) ? data.output[0] : data.output;
  } else if (data.urls?.get) {
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const poll = await fetch(data.urls.get, { headers: { Authorization: `Token ${TOKEN}` } });
      const result = await poll.json();
      if (result.status === 'succeeded') {
        outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
        break;
      }
      if (result.status === 'failed') throw new Error('Generation failed: ' + result.error);
      process.stdout.write('.');
    }
  }

  if (!outputUrl) throw new Error('No output URL received');
  console.log(`\n  → ${outputUrl}`);

  const imgRes = await fetch(outputUrl);
  return Buffer.from(await imgRes.arrayBuffer());
}

function toBase64(filePath) {
  const buf = readFileSync(filePath);
  const ext = filePath.endsWith('.png') ? 'png' : 'jpeg';
  return `data:image/${ext};base64,${buf.toString('base64')}`;
}

// ── Step 1: smooth the cream sleeve ──────────────────────────────────────────
const creamPath = join('public', 'sleeves', 'sleeve-cream.jpg');

const smoothPrompt = [
  'same hoodie sleeve product photo, perfectly smooth ironed fabric,',
  'no wrinkles, no creases, no fold lines, clean flat fabric surface,',
  'professional product photography, white background, studio lighting,',
  'keep exact same sleeve shape position and color, preserve ribbed wrist cuff detail,',
  'preserve shoulder seam at top',
].join(' ');

const smoothBuf = await callNanoBanana(toBase64(creamPath), smoothPrompt);
writeFileSync(creamPath, smoothBuf);
console.log(`  Saved smooth cream → ${creamPath}`);

// ── Step 2: generate proper black sleeve from smooth base ─────────────────────
const blackPath = join('public', 'sleeves', 'sleeve-black.jpg');
const smoothBase64 = `data:image/jpeg;base64,${smoothBuf.toString('base64')}`;

const blackPrompt = [
  'same hoodie sleeve shape and position, deep black fabric color #1a1a1a,',
  'perfectly smooth ironed fabric, no wrinkles, no creases,',
  'professional product photo, pure white background, soft studio lighting,',
  'preserve all fabric texture details, preserve ribbed wrist cuff,',
  'preserve shoulder seam at top, identical sleeve silhouette as input',
].join(' ');

const blackBuf = await callNanoBanana(smoothBase64, blackPrompt);
writeFileSync(blackPath, blackBuf);
console.log(`  Saved black → ${blackPath}`);

console.log('\nDone!');
