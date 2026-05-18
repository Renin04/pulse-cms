const checks = [
  ['branch', 'pulse-branch'],
  ['conditional', 'pulse-conditional'],
  ['code-playground', 'code-playground'],
  ['quiz', 'pulse-quiz'],
  ['poll', 'pulse-poll'],
  ['tabs', 'pulse-tabs'],
  ['spoiler', 'pulse-spoiler'],
  ['carousel', 'data-slide-index'],
  ['gallery', 'data-block-type="gallery"'],
  ['before-after', 'data-block-type="before-after"'],
  ['annotated-image', 'data-hotspot-layer'],
  ['manga-panel', 'data-block-type="manga-panel"'],
  ['hero-section', 'data-block-type="hero-section"'],
  ['chart', 'data-block-type="chart"'],
  ['map', 'data-block-type="map"'],
  ['timeline', 'data-block-type="timeline"'],
  ['comparison', 'data-block-type="comparison"'],
  ['diagram', 'data-block-type="diagram"'],
  ['math-equation', 'data-block-type="math-equation"'],
  ['flashcard', 'data-block-type="flashcard"'],
  ['accordion', 'data-block-type="accordion"'],
  ['toggle', 'data-block-type="toggle"'],
  ['callout', 'data-block-type="callout"'],
  ['alert', 'data-block-type="alert"'],
  ['card', 'data-block-type="card"'],
  ['speech-bubble', 'data-block-type="speech-bubble"'],
];

const html = await (await fetch('http://localhost:3000/blog/flavors')).text();

console.log('Block render checks:');
let pass = 0;
let fail = 0;
for (const [name, marker] of checks) {
  const found = html.includes(marker);
  console.log(`  ${found ? '✅' : '❌'} ${name}`);
  if (found) pass++; else fail++;
}
console.log(`\n${pass}/${checks.length} blocks rendering correctly`);
