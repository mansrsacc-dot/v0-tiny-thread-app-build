import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) { console.error('Set REPLICATE_API_TOKEN env var'); process.exit(1); }

const prompt = "photorealistic product photography of a single black hoodie sleeve, one sleeve only, full length from shoulder seam connection at top to ribbed wrist cuff at bottom, sleeve hanging or laid flat vertically, pure white background, soft studio lighting, no model, no person, no second sleeve, isolated single sleeve, professional apparel photography";

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

(async () => {
  console.log('Generating black sleeve...');
  const res = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${TOKEN}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=60',
    },
    body: JSON.stringify({
      input: { prompt, aspect_ratio: '2:3', output_format: 'jpg', go_fast: true, num_outputs: 1, megapixels: '1' },
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  let outputUrl;
  if (data.output) outputUrl = Array.isArray(data.output) ? data.output[0] : data.output;
  else if (data.urls?.get) outputUrl = await poll(data.urls.get);
  else throw new Error('No output');

  console.log('\n  URL:', outputUrl);
  const imgRes = await fetch(outputUrl);
  const buf = await imgRes.arrayBuffer();
  mkdirSync(join('public', 'sleeves'), { recursive: true });
  writeFileSync(join('public', 'sleeves', 'sleeve-black.jpg'), Buffer.from(buf));
  console.log('  Saved → public/sleeves/sleeve-black.jpg');
})();
