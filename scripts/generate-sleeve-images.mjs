import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) { console.error('Set REPLICATE_API_TOKEN env var'); process.exit(1); }

const VARIANTS = {
  black: "photorealistic hoodie sleeve full length from shoulder seam to ribbed cuff, black hoodie fabric, flat lay photography, pure white background, studio lighting, showing shoulder connection seam at top of frame, ribbed wrist cuff at bottom, sleeve centered vertically in frame, no cropping, full sleeve visible, no person, no model, professional apparel product photography",
  cream: "photorealistic hoodie sleeve full length from shoulder seam to ribbed cuff, warm cream beige hoodie fabric, flat lay photography, pure white background, studio lighting, showing shoulder connection seam at top of frame, ribbed wrist cuff at bottom, sleeve centered vertically in frame, no cropping, full sleeve visible, no person, no model, professional apparel product photography",
};

async function poll(url) {
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const r = await fetch(url, { headers: { Authorization: `Token ${TOKEN}` } });
    const d = await r.json();
    if (d.status === 'succeeded') return Array.isArray(d.output) ? d.output[0] : d.output;
    if (d.status === 'failed') throw new Error('Generation failed: ' + d.error);
    process.stdout.write('.');
  }
  throw new Error('Timed out');
}

async function generate(name, prompt) {
  console.log(`\nGenerating sleeve-${name}...`);
  const res = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${TOKEN}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=60',
    },
    body: JSON.stringify({
      input: {
        prompt,
        aspect_ratio: '3:4',
        output_format: 'jpg',
        go_fast: true,
        num_outputs: 1,
        megapixels: '1',
      },
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  let outputUrl;
  if (data.output) {
    outputUrl = Array.isArray(data.output) ? data.output[0] : data.output;
  } else if (data.urls?.get) {
    outputUrl = await poll(data.urls.get);
  } else {
    throw new Error('No output or poll URL');
  }

  console.log(`\n  URL: ${outputUrl}`);

  const imgRes = await fetch(outputUrl);
  if (!imgRes.ok) throw new Error(`Download failed: ${imgRes.status}`);
  const buf = await imgRes.arrayBuffer();

  const outPath = join('public', 'sleeves', `sleeve-${name}.jpg`);
  writeFileSync(outPath, Buffer.from(buf));
  console.log(`  Saved → ${outPath}`);
}

(async () => {
  mkdirSync(join('public', 'sleeves'), { recursive: true });
  for (const [name, prompt] of Object.entries(VARIANTS)) {
    await generate(name, prompt);
  }
  console.log('\nDone!');
})();
