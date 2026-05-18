import { spawn } from 'child_process';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTDIR = join(__dirname, '..', 'public', 'images', 'flavors');
mkdirSync(OUTDIR, { recursive: true });

const images = [
  { name: 'hero', prompt: 'A panoramic spice market at golden hour, sacks of vibrant saffron, turmeric, paprika, cinnamon, photorealistic food photography with dramatic warm lighting, editorial style' },
  { name: 'vanilla-orchid', prompt: 'Extreme close-up of a vanilla orchid flower with water droplets, photorealistic macro photography, dark background, dramatic side lighting' },
  { name: 'caramelization', prompt: 'Caramelization in a black cast-iron pan, bubbling golden brown sugar, macro photography, dramatic lighting, shallow depth of field' },
  { name: 'moroccan-tagine', prompt: 'A traditional Moroccan tagine steaming in a sunlit courtyard, ceramic pot with conical lid, warm golden light, photorealistic food photography' },
  { name: 'umami-waves', prompt: 'Abstract visual representation of umami flavor, warm golden waves and swirls, soft glowing light, ethereal atmosphere, artistic food photography style' },
  { name: 'onion-raw', prompt: 'A raw red onion sliced in half on a wooden cutting board, natural daylight, food photography, sharp detail' },
  { name: 'onion-caramelized', prompt: 'Beautifully caramelized onions in a pan, deep golden brown color, glossy texture, food photography with warm lighting' },
  { name: 'vanilla-pod', prompt: 'Cross-section diagram of a vanilla pod showing seeds inside, botanical illustration style, clean white background, detailed anatomy' },
  { name: 'gallery-1', prompt: 'Dried red chili peppers hanging in a spice market, photorealistic food photography, warm lighting' },
  { name: 'gallery-2', prompt: 'Saffron threads in a small glass bowl, golden light, photorealistic food photography, dark background' },
  { name: 'gallery-3', prompt: 'Bright yellow turmeric powder cascading from a wooden scoop into an iron bowl, catching late-afternoon light, photorealistic' },
  { name: 'gallery-4', prompt: 'Cinnamon sticks and star anise arranged artfully, warm moody lighting, photorealistic food photography' },
  { name: 'gallery-5', prompt: 'Star anise pods scattered on dark slate, dramatic overhead lighting, photorealistic food photography' },
  { name: 'gallery-6', prompt: 'Green cardamom pods in a brass bowl, warm golden light, photorealistic food photography, rustic style' },
  { name: 'carousel-1', prompt: 'Persian saffron rice with golden crust tahdig, garnished with barberries, overhead shot, photorealistic food photography' },
  { name: 'carousel-2', prompt: 'Japanese tonkotsu ramen with soft-boiled egg, chashu pork, nori, rich broth, photorealistic food photography' },
  { name: 'carousel-3', prompt: 'Mexican mole negro sauce over chicken, rich dark brown sauce, sesame garnish, photorealistic food photography' },
  { name: 'carousel-4', prompt: 'Italian fresh pasta with tomato sauce and basil, rustic wooden table, photorealistic food photography' },
  { name: 'carousel-5', prompt: 'Indian butter chicken curry in a copper bowl, naan bread on the side, photorealistic food photography' },
  { name: 'carousel-6', prompt: 'French golden croissant on marble surface, flaky layers visible, morning light, photorealistic food photography' },
  { name: 'carousel-7', prompt: 'Thai green papaya salad som tam in a stone mortar, peanuts and dried shrimp, photorealistic food photography' },
  { name: 'carousel-8', prompt: 'Ethiopian injera flatbread with colorful stews wats on top, traditional presentation, photorealistic food photography' },
  { name: 'carousel-9', prompt: 'Spanish seafood paella in a wide pan, saffron rice, mussels, shrimp, lemon wedges, photorealistic food photography' },
  { name: 'carousel-10', prompt: 'Lebanese mezze spread with hummus, falafel, tabbouleh, pita bread, overhead shot, photorealistic food photography' },
  { name: 'manga-chef', prompt: 'Comic manga style illustration of a busy professional kitchen, a sous chef cooking over flames, dynamic action lines, black and white with slight warm tones' },
  { name: 'sweet-character', prompt: 'Anthropomorphic figure representing the taste Sweet, warm and friendly character made of honey and golden light, illustrated editorial style' },
  { name: 'bitter-character', prompt: 'Anthropomorphic figure representing the taste Bitter, sophisticated dark character made of coffee and dark chocolate, illustrated editorial style' },
  { name: 'black-garlic', prompt: 'Black garlic cloves on dark slate, dramatic lighting showing glossy texture, photorealistic food photography' },
  { name: 'branch-spicy', prompt: 'Extreme close-up of a red habanero chili pepper cut open showing seeds and veins, fiery dramatic lighting, photorealistic' },
  { name: 'branch-sweet', prompt: 'A perfect creme brulee with caramelized sugar top and fresh berries, elegant dessert photography, soft lighting' },
  { name: 'branch-adventurous', prompt: 'Fermented Korean kimchi in traditional clay pots, funky vibrant colors, photorealistic food photography' },
];

const CONCURRENCY = 3;

function generateOne(name, prompt) {
  const output = join(OUTDIR, `${name}.png`);
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [
      join(dirname(__dirname), '..', '..', '..', 'addf-kimi-orchestrator', 'tools', 'generate-image.js'),
      '--prompt', prompt,
      '--output', output,
      '--quality', 'high'
    ], { stdio: 'pipe' });
    
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    
    proc.on('close', code => {
      if (code === 0) {
        console.log(`✅ ${name}`);
        resolve({ name, output });
      } else {
        console.error(`❌ ${name}: ${stderr}`);
        reject(new Error(`Failed to generate ${name}: ${stderr}`));
      }
    });
  });
}

async function runBatch() {
  const results = [];
  for (let i = 0; i < images.length; i += CONCURRENCY) {
    const batch = images.slice(i, i + CONCURRENCY);
    console.log(`\nBatch ${Math.floor(i / CONCURRENCY) + 1}/${Math.ceil(images.length / CONCURRENCY)}: ${batch.map(b => b.name).join(', ')}`);
    const batchResults = await Promise.allSettled(batch.map(img => generateOne(img.name, img.prompt)));
    results.push(...batchResults);
  }
  
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  console.log(`\nDone: ${succeeded} succeeded, ${failed} failed`);
  
  if (failed > 0) {
    results.filter(r => r.status === 'rejected').forEach(r => console.error(r.reason));
  }
}

runBatch().catch(err => { console.error(err); process.exit(1); });
