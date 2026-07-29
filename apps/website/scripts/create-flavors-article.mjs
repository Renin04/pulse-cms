/**
 * Create the "Flavors" masterpiece article via Pulse CMS API
 */

const BASE_URL = 'http://localhost:3000';
const LOGIN = { email: process.env.ADMIN_EMAIL || 'admin@pulse.local', password: process.env.ADMIN_PASSWORD };
const IMG_BASE = '/images/flavors';

let token = null;

async function api(path, opts = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function login() {
  const data = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(LOGIN),
  });
  token = data.data.accessToken;
  console.log('Logged in, token acquired');
}

function uid(prefix = 'b') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function makeBlocks() {
  const blocks = [];

  // 1. Hero Section
  blocks.push({
    id: uid(), type: 'hero-section',
    data: {
      title: 'FLAVORS: The Invisible Architecture of Pleasure',
      subtitle: 'A journey through the five realms of taste, the secret sixth sense, and the future of how we eat.',
      backgroundUrl: `${IMG_BASE}/hero.png`,
      ctaLabel: 'Begin the Journey',
      ctaUrl: 'http://localhost:3000/blog/flavors',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 2. H1 Heading
  blocks.push({
    id: uid(), type: 'heading',
    data: { text: 'Flavors: The Invisible Architecture of Pleasure', level: 1, anchorId: 'the-hook' },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 3. Paragraph - The Hook
  blocks.push({
    id: uid(), type: 'text',
    data: {
      text: `I still remember the moment flavor stopped being background noise and became everything. I was sitting on a plastic stool in Tehran's Grand Bazaar, knees touching a stranger's, when a woman handed me a plate of tahchin — saffron rice with a crust of golden yogurt and egg. I took one bite, and the world narrowed to a single point: the honeyed bitterness of saffron, the tang of yogurt, the crunch of burnt rice edges that tasted like caramel and memory combined. That bite didn't just feed me. It rewired me.\n\nFlavor is not fuel. It is information. It is culture, chemistry, and storytelling compressed into a millisecond of sensory data. In this article, I want to take you on the same journey I have been on for twenty years — across continents, into laboratories, through fermentation cellars and Michelin kitchens — to understand what flavor really is, why it matters, and where it is heading.`,
      marks: { bold: false, italic: false, underline: false, code: false },
      align: 'left',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 4. Image - hook image (reuse hero or vanilla)
  blocks.push({
    id: uid(), type: 'image',
    data: {
      src: `${IMG_BASE}/vanilla-orchid.png`,
      alt: 'Golden turmeric powder cascading from a wooden scoop into an iron bowl, catching late-afternoon light',
      width: 1200, height: 675, fit: 'cover', status: 'ready',
      caption: 'The moment flavor becomes everything.',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 5. H2 - Five Flavor Realms
  blocks.push({
    id: uid(), type: 'heading',
    data: { text: 'The Five Flavor Realms', level: 2 },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 6. Paragraph intro
  blocks.push({
    id: uid(), type: 'text',
    data: {
      text: `For centuries, we thought there were four tastes: sweet, sour, salty, bitter. Then, in 1985, umami was officially recognized as the fifth. These five are not just categories. They are evolutionary tools. Sweet signals energy. Sour warns of spoilage. Salt maintains electrolyte balance. Bitter alerts us to potential toxins. Umami screams protein. Together, they form the alphabet of appetite.`,
      marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 7. H3 - Sweet
  blocks.push({
    id: uid(), type: 'heading',
    data: { text: 'Sweet: The Taste of Energy', level: 3 },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  blocks.push({
    id: uid(), type: 'text',
    data: {
      text: `Sweet is the first taste we love. Breast milk is sweet. Ripe fruit is sweet. Our brains are wired to chase sugar because, for most of human history, it meant survival. But sweet is also the most abused realm. Refined sugar has hijacked our reward systems, creating a nation of addicts who no longer taste nuance.\n\nReal sweetness — the kind in a ripe mango, a Medjool date, or a carrot pulled from cold soil — carries information. It tells you about soil, season, and sunlight. In Kyoto, I watched a wagashi master spend three hours shaping a single sweet bean paste into a chrysanthemum. "Sweetness is not the point," he told me. "The point is the pause."`,
      marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 8. H3 - Sour
  blocks.push({
    id: uid(), type: 'heading',
    data: { text: 'Sour: The Taste of Alertness', level: 3 },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  blocks.push({
    id: uid(), type: 'text',
    data: {
      text: `Sour is the taste that makes you pay attention. A squeeze of lime over grilled fish in Mexico City. A splash of tamarind in Mumbai's chaat. The fermented sharpness of German sauerkraut. Sour is preservation, transformation, and wakefulness.\n\nI once ate a Warheads candy with a sommelier in Bordeaux. He spat it out and laughed. "That is not sour. That is acid as assault. Real sour is a conversation." He was right. The sour of a perfect ceviche — lime, onion, chili, fish — is a dialogue between ingredients, not a monologue.`,
      marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 9. H3 - Salty
  blocks.push({
    id: uid(), type: 'heading',
    data: { text: 'Salty: The Taste of the Sea', level: 3 },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  blocks.push({
    id: uid(), type: 'text',
    data: {
      text: `Salt is the only mineral we eat on purpose. It is essential for life, and our bodies know it. A craving for salt is a craving for existence itself. But salt is also the great amplifier. Without it, chocolate is flat, bread is sad, and tomatoes taste like wet cardboard.\n\nIn Sicily, I visited salt flats where seawater evaporates into geometric pink pools. The salt harvested there — fleur de sel — tastes like the ocean distilled. "Every crystal holds a storm," the harvester told me. I believed him.`,
      marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 10. H3 - Bitter
  blocks.push({
    id: uid(), type: 'heading',
    data: { text: 'Bitter: The Taste of Maturity', level: 3 },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  blocks.push({
    id: uid(), type: 'text',
    data: {
      text: `We are born hating bitter. It is an evolutionary defense — many toxins are bitter alkaloids. But cultures that learn to love bitter gain access to some of the most complex flavors on earth: coffee, dark chocolate, Campari, kale, beer.\n\nBitter is the taste of adulthood. A child cannot appreciate espresso. An adult cannot live without it. In Ethiopia, the coffee ceremony is a three-hour ritual of roasting, grinding, and brewing. The coffee is bitter, smoky, and profound. "Bitter," my host explained, "is how the earth talks to the soul."`,
      marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 11. H3 - Umami
  blocks.push({
    id: uid(), type: 'heading',
    data: { text: 'Umami: The Taste of Life Itself', level: 3 },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  blocks.push({
    id: uid(), type: 'text',
    data: {
      text: `Umami was discovered by Kikunae Ikeda in 1908 while he was eating dashi — a simple broth of kelp and dried bonito. He isolated the compound responsible: glutamate. But umami is more than glutamate. It is the savory depth of aged parmesan, the meaty richness of a slow-cooked ragu, the mysterious satisfaction of a perfectly ripe tomato.\n\nUmami is why a bowl of plain white rice with soy sauce can feel like a feast. It is the taste of amino acids, of protein, of growth and repair. Without umami, food is flat. With it, food breathes.`,
      marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 12. Image - umami abstract
  blocks.push({
    id: uid(), type: 'image',
    data: {
      src: `${IMG_BASE}/umami-waves.png`,
      alt: 'Abstract warm golden waves representing the taste of umami',
      width: 1200, height: 675, fit: 'cover', status: 'ready',
      caption: 'Umami: the invisible depth beneath every great dish.',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 13. Horizontal Rule
  blocks.push({
    id: uid(), type: 'horizontal-rule',
    data: {},
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 14. H2 - The Secret Sixth
  blocks.push({
    id: uid(), type: 'heading',
    data: { text: 'The Secret Sixth: Beyond Taste', level: 2 },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  blocks.push({
    id: uid(), type: 'text',
    data: {
      text: `Flavor is not just taste. It is mouthfeel, temperature, texture, sound, and aroma. These are the invisible architects of pleasure. A potato chip crackles at 5 kilohertz — the frequency our brains associate with freshness. Warm soup feels comforting because heat activates TRPV1 receptors, the same ones that sense emotional warmth.\n\nAroma is the most powerful flavor component. Without smell, an apple and an onion taste identical. I learned this the hard way during a cold in Bangkok, when my favorite street noodles tasted like wet paper. When my smell returned three days later, I nearly wept with joy.`,
      marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 15. Unordered List - invisible flavors
  blocks.push({
    id: uid(), type: 'list',
    data: {
      style: 'unordered',
      items: [
        'Aroma: 80% of what we call "taste" is actually smell',
        'Mouthfeel: Creaminess, astringency, pungency, and cooling',
        'Temperature: Hot foods release more volatile aromatic compounds',
        'Texture: Crunch, snap, chew, and dissolve each change perception',
        'Sound: The crackle of fresh bread crust signals freshness to the brain',
        'Pain: Capsaicin, piperine, and allyl isothiocyanate create pleasurable heat',
      ],
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 16. Callout
  blocks.push({
    id: uid(), type: 'callout',
    data: {
      variant: 'tip',
      title: 'Pro Tip',
      body: 'Toast your spices before grinding. Heat unlocks volatile oils that transform a flat dish into a symphony.',
      icon: '💡',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 17. Alert
  blocks.push({
    id: uid(), type: 'alert',
    data: {
      severity: 'warning',
      title: 'Warning',
      message: 'This section contains descriptions of extremely spicy food that may cause sympathetic sweating.',
      dismissible: true,
      isDismissed: false,
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 18. H2 - The Flavor Map
  blocks.push({
    id: uid(), type: 'heading',
    data: { text: 'The Flavor Map: One Ingredient, Many Lives', level: 2 },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  blocks.push({
    id: uid(), type: 'text',
    data: {
      text: `Take the tomato. In Italy, it becomes a slow-simmered ragù, sweet and concentrated. In Mexico, it is roasted and blended with chilies into a salsa that burns and brightens. In India, it is cooked down with cumin and coriander into a gravy that carries spice like a river carries silt. Same fruit. Three universes.\n\nThis is what I call the Flavor Map — the way geography, history, and culture transform identical ingredients into entirely different experiences.`,
      marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 19. Tabs - Flavor by Continent
  blocks.push({
    id: uid(), type: 'tabs',
    data: {
      activeTabId: 'tab-asia',
      tabs: [
        { id: 'tab-asia', label: 'Asia', content: 'Asia is the birthplace of umami. From Japanese dashi to Chinese soy sauce, Korean doenjang to Vietnamese nuoc mam, fermented complexity defines the continent\'s palate. Fermentation is not preservation here — it is transformation. A soybean becomes a hundred different things, each with its own soul.' },
        { id: 'tab-europe', label: 'Europe', content: 'Europe built its flavor identity on dairy, wine, and slow reduction. French sauces are architecture — layers of stock, butter, and wine reduced to essence. Italian cuisine achieves maximum flavor with minimum ingredients: a perfect tomato, good olive oil, salt. The Nordic countries have revived fermentation, creating new traditions from old caves.' },
        { id: 'tab-americas', label: 'Americas', content: 'The Americas gave the world chilies, tomatoes, chocolate, vanilla, and potatoes. Mexican mole contains twenty-plus ingredients and takes days to make. Peruvian cuisine fuses indigenous ingredients with Japanese technique into something entirely new. The Americas are where ancient and modern collide on the plate.' },
        { id: 'tab-africa', label: 'Africa', content: 'African flavors are the most underappreciated on earth. Ethiopian berbere is a complex blend of up to sixteen spices. North African tagines slow-cook meat with dried fruit and preserved lemons. West African jollof rice is a party in a pot. The continent\'s biodiversity — from kola nuts to teff — holds flavors the world has barely discovered.' },
      ],
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 20. Map - Route of the Spice Trade
  blocks.push({
    id: uid(), type: 'map',
    data: {
      provider: 'openstreetmap',
      latitude: 15.0,
      longitude: 55.0,
      zoom: 4,
      label: 'The ancient spice trade routes connected India, the Middle East, and Europe.',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 21. H2 - The Future of Flavor
  blocks.push({
    id: uid(), type: 'heading',
    data: { text: 'The Future of Flavor', level: 2 },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  blocks.push({
    id: uid(), type: 'text',
    data: {
      text: `We are standing at the edge of a flavor revolution. Three forces are reshaping what we will eat in the next fifty years: fermentation science, cellular agriculture, and artificial intelligence.`,
      marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 22. Ordered List - future forces
  blocks.push({
    id: uid(), type: 'list',
    data: {
      style: 'ordered',
      items: [
        'Fermentation 2.0: Precision fermentation creates dairy proteins without cows, using microbes programmed to produce exact milk proteins',
        'Lab-Grown Meat: Cultured meat eliminates the animal while preserving the muscle structure and flavor compounds',
        'AI-Designed Pairings: Machine learning models now predict successful flavor combinations by analyzing molecular structures across thousands of ingredients',
      ],
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 23. Code Block - flavor pairing algorithm
  blocks.push({
    id: uid(), type: 'code',
    data: {
      code: `function flavorPairingScore(ingredientA, ingredientB) {
  const sharedCompounds = intersect(
    ingredientA.aromaticCompounds,
    ingredientB.aromaticCompounds
  );
  const molecularCompatibility = computeMolecularAffinity(
    ingredientA.profile,
    ingredientB.profile
  );
  const culturalPairingWeight = getCulturalFrequency(ingredientA, ingredientB);
  
  return (
    sharedCompounds.length * 0.4 +
    molecularCompatibility * 0.35 +
    culturalPairingWeight * 0.25
  );
}

// Example: chocolate + chili = high shared aromatics
// coffee + cardamom = high cultural pairing weight`,
      language: 'typescript',
      theme: 'github-light',
      showLineNumbers: true,
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 24. Inline code example (using text block with code marks)
  blocks.push({
    id: uid(), type: 'text',
    data: {
      text: 'The science behind flavor comes down to molecules. capsaicin creates heat by binding to TRPV1 receptors. glutamate triggers umami through G-protein-coupled receptors. piperine in black pepper enhances bioavailability and adds pungency. These are not just ingredients — they are chemical keys unlocking specific neurological doors.',
      marks: { bold: false, italic: false, underline: false, code: true },
      align: 'left',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 25. Video
  blocks.push({
    id: uid(), type: 'video',
    data: {
      url: 'https://www.youtube.com/embed/8q4L5XpaJzI',
      provider: 'youtube',
      title: 'The Science of Flavor: How We Taste',
      caption: 'A deep dive into the neuroscience of taste and flavor perception.',
      autoplay: false,
      startAtSeconds: 0,
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 26. Audio
  blocks.push({
    id: uid(), type: 'audio',
    data: {
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      title: 'Ambient Market Sounds',
      artist: 'Field Recording',
      caption: 'The sound of a spice market in Marrakech — the ambient backdrop of flavor commerce.',
      autoplay: false,
      loop: false,
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 27. File
  blocks.push({
    id: uid(), type: 'file',
    data: {
      name: 'The Flavor Wheel.pdf',
      url: 'https://www.coffeeinstitute.org/wp-content/uploads/2021/02/SCA-Flavor-Wheel.pdf',
      description: 'Download the official Coffee Flavor Wheel — a map of 100+ aromatic descriptors used by professional tasters worldwide.',
      openInNewTab: true,
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 28. Embed - Spotify
  blocks.push({
    id: uid(), type: 'embed',
    data: {
      url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX9Rwf3t1xU27',
      title: 'Flavor Moods Playlist',
      provider: 'spotify',
      aspectRatio: '16:9',
      allowFullscreen: false,
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 29. Blockquote
  blocks.push({
    id: uid(), type: 'blockquote',
    data: {
      quote: 'Cooking is not about having the best equipment or the most expensive ingredients. It is about understanding flavor — how to build it, balance it, and respect it.',
      citation: '— Samin Nosrat, Salt Fat Acid Heat',
      align: 'left',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 30. Link block
  blocks.push({
    id: uid(), type: 'link',
    data: {
      text: 'Serious Eats — The home of food science and culinary deep dives',
      url: 'https://www.seriouseats.com',
      openInNewTab: true,
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 31. Quiz
  blocks.push({
    id: uid(), type: 'quiz',
    data: {
      question: 'Can You Guess the Spice? Which compound gives chili peppers their heat?',
      options: [
        { id: 'q1-opt1', text: 'Piperine', isCorrect: false, explanation: 'Piperine is the active compound in black pepper, not chili.' },
        { id: 'q1-opt2', text: 'Capsaicin', isCorrect: true, explanation: 'Correct! Capsaicin binds to TRPV1 receptors, creating the sensation of heat.' },
        { id: 'q1-opt3', text: 'Curcumin', isCorrect: false, explanation: 'Curcumin is the main active ingredient in turmeric.' },
        { id: 'q1-opt4', text: 'Eugenol', isCorrect: false, explanation: 'Eugenol is found in cloves and allspice.' },
        { id: 'q1-opt5', text: 'Cinnamaldehyde', isCorrect: false, explanation: 'Cinnamaldehyde gives cinnamon its distinctive flavor.' },
      ],
      allowMultiple: false,
      randomizeOptions: true,
      showExplanations: true,
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 32. Poll
  blocks.push({
    id: uid(), type: 'poll',
    data: {
      question: 'Which flavor realm rules your palate?',
      options: [
        { id: 'poll-sweet', label: 'Sweet', votes: 42 },
        { id: 'poll-sour', label: 'Sour', votes: 28 },
        { id: 'poll-salty', label: 'Salty', votes: 35 },
        { id: 'poll-bitter', label: 'Bitter', votes: 19 },
        { id: 'poll-umami', label: 'Umami', votes: 56 },
      ],
      allowMultiple: false,
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 33. Survey
  blocks.push({
    id: uid(), type: 'survey',
    data: {
      title: 'Build Your Flavor Profile',
      description: 'Answer a few questions and we will reveal your dominant flavor personality.',
      questions: [
        { id: 'sq1', prompt: 'How do you take your coffee?', type: 'single', required: true, options: ['Black and bitter', 'With milk', 'Sweet and creamy', 'I do not drink coffee'] },
        { id: 'sq2', prompt: 'Pick a comfort food:', type: 'single', required: true, options: ['Mac and cheese', 'Spicy noodles', 'Dark chocolate', 'Fresh fruit'] },
        { id: 'sq3', prompt: 'Rate your spice tolerance:', type: 'rating', required: true, scaleMax: 5 },
        { id: 'sq4', prompt: 'What is your favorite cuisine?', type: 'text', required: false },
      ],
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 34. Flashcard
  blocks.push({
    id: uid(), type: 'flashcard',
    data: {
      title: 'Spice Memory Cards',
      shuffle: true,
      cards: [
        { id: 'fc1', front: 'Saffron', back: 'Origin: Iran/Spain. Derived from the stigma of Crocus sativus. Use: Rice, paella, desserts. World\'s most expensive spice by weight.', hint: 'Red threads, golden color' },
        { id: 'fc2', front: 'Cardamom', back: 'Origin: India/Guatemala. Seed pods of Elettaria cardamomum. Use: Chai, Scandinavian baking, Middle Eastern coffee.', hint: 'Green pods, floral and citrusy' },
        { id: 'fc3', front: 'Sumac', back: 'Origin: Middle East. Dried berries of Rhus coriaria. Use: Za\'atar, salads, grilled meats. Adds lemony tang without acidity.', hint: 'Deep red powder' },
        { id: 'fc4', front: 'Fenugreek', back: 'Origin: Mediterranean/South Asia. Seeds and leaves used. Use: Curry powders, maple flavoring, Ethiopian berbere.', hint: 'Bitter seeds, sweet maple aroma when toasted' },
        { id: 'fc5', front: 'Star Anise', back: 'Origin: China/Vietnam. Fruit of Illicium verum. Use: Pho, Chinese five spice, liqueurs. Contains shikimic acid (Tamiflu precursor).', hint: 'Star-shaped pod, licorice flavor' },
      ],
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 35. Accordion
  blocks.push({
    id: uid(), type: 'accordion',
    data: {
      allowMultiple: true,
      items: [
        { id: 'acc1', title: 'How to taste wine like a sommelier', content: 'Look at the color against a white background. Swirl to release aromas. Stick your nose deep into the glass and inhale. Take a small sip and suck air through it. This volatilizes aromatic compounds so you can detect subtle notes.', defaultOpen: false },
        { id: 'acc2', title: 'The secret to perfect seasoning', content: 'Season in layers, not all at once. Salt at the beginning to build flavor, in the middle to adjust, and at the end to brighten. Taste constantly. Your palate is the only tool that matters.', defaultOpen: false },
        { id: 'acc3', title: 'Why resting meat changes everything', content: 'When meat cooks, muscle fibers tighten and push juices toward the center. Resting allows fibers to relax and juices to redistribute. Cut too early, and flavor bleeds onto the cutting board.', defaultOpen: false },
        { id: 'acc4', title: 'The truth about "fresh" vs dried herbs', content: 'Fresh herbs shine at the end of cooking — their volatile oils are fragile. Dried herbs need time to rehydrate and release flavor. Rule of thumb: use three times more fresh than dried.', defaultOpen: false },
      ],
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 36. Toggle
  blocks.push({
    id: uid(), type: 'toggle',
    data: {
      label: 'Reveal: The Hidden Ingredient in Ketchup',
      content: 'The secret ingredient that makes ketchup taste like ketchup is not tomatoes — it is cloves. Just a tiny amount of ground clove adds a warm, sweet depth that balances the acidity of vinegar and the sweetness of sugar. Without cloves, ketchup is just sweet tomato paste. With them, it is an icon.',
      defaultOn: false,
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 37. Spoiler
  blocks.push({
    id: uid(), type: 'spoiler',
    data: {
      label: 'Spoiler: The world\'s most expensive spice is not what you think',
      content: 'Most people guess saffron — and they are half right. Saffron is the most expensive spice by weight, with top-grade Iranian threads costing up to $10,000 per pound. But by use-per-dollar, vanilla is actually more expensive in most kitchens. A single vanilla bean can cost $5-10, and most recipes need the whole pod. Saffron stretches further because a few threads flavor an entire dish.',
      revealed: false,
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 38. Table - Scoville Scale
  blocks.push({
    id: uid(), type: 'table',
    data: {
      caption: 'The Scoville Scale: Pepper Heat Index',
      columns: ['Pepper', 'Scoville Heat Units (SHU)', 'Flavor Notes'],
      rows: [
        ['Bell Pepper', '0', 'Sweet, grassy, no heat'],
        ['Poblano', '1,000 - 2,000', 'Earthy, mild, raisin-like'],
        ['Jalapeño', '2,500 - 8,000', 'Bright, vegetal, medium heat'],
        ['Serrano', '10,000 - 23,000', 'Crisp, grassy, sharp heat'],
        ['Cayenne', '30,000 - 50,000', 'Neutral heat, powder-friendly'],
        ['Thai Bird', '50,000 - 100,000', 'Intense, immediate, fruity'],
        ['Habanero', '100,000 - 350,000', 'Tropical, floral, delayed burn'],
        ['Ghost Pepper', '855,000 - 1,041,000', 'Fruity start, nuclear finish'],
        ['Carolina Reaper', '1,500,000 - 2,200,000', 'Sweet cherry notes, then agony'],
      ],
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 39. Chart
  blocks.push({
    id: uid(), type: 'chart',
    data: {
      title: 'Global Umami Consumption by Country',
      chartType: 'bar',
      labels: ['Japan', 'China', 'Korea', 'Italy', 'USA', 'Thailand', 'Mexico'],
      datasets: [
        { id: 'ds1', label: 'Umami-Rich Meals per Week', values: [18, 16, 14, 10, 7, 12, 9] },
      ],
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 40. Math Equation
  blocks.push({
    id: uid(), type: 'math-equation',
    data: {
      latex: 'R = -\\frac{d[C]}{dt} = k [A]^m [B]^n \\quad \\text{(Maillard reaction rate)}',
      displayMode: true,
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 41. Diagram
  blocks.push({
    id: uid(), type: 'diagram',
    data: {
      engine: 'mermaid',
      source: `graph LR
    A[Taste Receptors<br/>on Tongue] --> B[Signals to<br/>Brainstem]
    B --> C[Thalamus]
    C --> D[Insular Cortex<br/>Taste Perception]
    D --> E[Orbitofrontal Cortex<br/>Pleasure & Reward]
    E --> F[Hippocampus<br/>Memory & Context]
    F --> G[Emotional<br/>Response]`,
      caption: 'How Taste Works: From Tongue to Brain to Memory',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 42. Timeline
  blocks.push({
    id: uid(), type: 'timeline',
    data: {
      title: 'History of Flavor: 3000 BCE to 2030',
      entries: [
        { id: 't1', title: 'First Spice Trade', date: '3000-01-01T00:00:00.000Z', description: 'Ancient Egyptians import cinnamon and cassia from the Horn of Africa.' },
        { id: 't2', title: 'Silk Road Opens', date: '0130-01-01T00:00:00.000Z', description: 'Spices, tea, and fermentation techniques flow between East and West.' },
        { id: 't3', title: 'Columbian Exchange', date: '1492-01-01T00:00:00.000Z', description: 'Chilies, tomatoes, vanilla, and potatoes spread globally.' },
        { id: 't4', title: 'Ikeda Discovers Umami', date: '1908-01-01T00:00:00.000Z', description: 'Kikunae Ikeda isolates glutamate from kelp broth.' },
        { id: 't5', title: 'Sous Vide Revolution', date: '1970-01-01T00:00:00.000Z', description: 'Precision temperature control transforms restaurant cooking.' },
        { id: 't6', title: 'Noma Redefines Cuisine', date: '2003-01-01T00:00:00.000Z', description: 'René Redzepi puts foraging and fermentation at the center of fine dining.' },
        { id: 't7', title: 'First Lab-Grown Burger', date: '2013-01-01T00:00:00.000Z', description: 'Mark Post serves a $330,000 cultured beef patty in London.' },
        { id: 't8', title: 'AI Flavor Design', date: '2030-01-01T00:00:00.000Z', description: 'Machine learning models create novel flavor pairings beyond human intuition.' },
      ],
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 43. Comparison
  blocks.push({
    id: uid(), type: 'comparison',
    data: {
      leftTitle: 'Fresh Herbs',
      rightTitle: 'Dried Herbs',
      rows: [
        { id: 'c1', label: 'Flavor Intensity', leftValue: 'Delicate, bright, volatile', rightValue: 'Concentrated, muted, stable' },
        { id: 'c2', label: 'Best Added', leftValue: 'End of cooking', rightValue: 'Beginning of cooking' },
        { id: 'c3', label: 'Shelf Life', leftValue: 'Days to weeks', rightValue: 'Months to years' },
        { id: 'c4', label: 'Cost', leftValue: 'Higher per use', rightValue: 'Lower per use' },
        { id: 'c5', label: 'Examples', leftValue: 'Basil, cilantro, parsley', rightValue: 'Oregano, thyme, bay leaf' },
      ],
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 44. Before/After
  blocks.push({
    id: uid(), type: 'before-after',
    data: {
      beforeUrl: `${IMG_BASE}/onion-raw.png`,
      afterUrl: `${IMG_BASE}/onion-caramelized.png`,
      beforeLabel: 'Before Caramelization',
      afterLabel: 'After Caramelization',
      position: 50,
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 45. Manga Panel
  blocks.push({
    id: uid(), type: 'manga-panel',
    data: {
      title: 'Day in the Life of a Sous Chef',
      layout: 'strip',
      readingDirection: 'ltr',
      panels: [
        { id: 'mp1', imageUrl: `${IMG_BASE}/manga-chef.png`, caption: '5:00 AM: Prep station. Mise en place before the sun rises.', dialogue: '"Forty onions to brunoise. The knife is an extension of your mind."' },
        { id: 'mp2', imageUrl: `${IMG_BASE}/manga-chef.png`, caption: '7:30 AM: The first orders hit. Tickets stack like a deck of cards.', dialogue: '"Oui, Chef! Two coq au vin, one bouillabaisse!"' },
        { id: 'mp3', imageUrl: `${IMG_BASE}/manga-chef.png`, caption: '10:00 PM: Service ends. Hands burned. Mind quiet.', dialogue: '"Tomorrow we do it again. But better."' },
      ],
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 46. Speech Bubble - Sweet vs Bitter
  blocks.push({
    id: uid(), type: 'speech-bubble',
    data: {
      speaker: 'Sweet',
      text: 'I am the taste everyone loves first. I bring joy, celebration, and energy. Without me, life is just survival.',
      tone: 'happy',
      align: 'left',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  blocks.push({
    id: uid(), type: 'speech-bubble',
    data: {
      speaker: 'Bitter',
      text: 'Joy fades. I am the taste of maturity, of complexity, of truth. Coffee. Dark chocolate. Campari. I am what you learn to love when you grow up.',
      tone: 'angry',
      align: 'right',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 47. Card - Black Garlic
  blocks.push({
    id: uid(), type: 'card',
    data: {
      title: 'Flavor Profile: Black Garlic',
      body: 'Whole garlic bulbs fermented at 60-77°C for weeks. The Maillard reaction transforms harsh sulfur compounds into sweet, syrupy notes of balsamic, tamarind, and molasses. Zero bitterness. Maximum umami.',
      mediaUrl: `${IMG_BASE}/black-garlic.png`,
      linkUrl: 'https://www.seriouseats.com/black-garlic',
      ctaLabel: 'Learn More',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 48. Gallery
  blocks.push({
    id: uid(), type: 'gallery',
    data: {
      title: 'The Colors of Spice Markets',
      layout: 'grid',
      columns: 3,
      images: [
        { id: 'g1', src: `${IMG_BASE}/gallery-1.png`, alt: 'Dried red chili peppers hanging in clusters at a spice market', caption: 'Chilies of every heat' },
        { id: 'g2', src: `${IMG_BASE}/gallery-2.png`, alt: 'Saffron threads glowing like liquid gold in a glass bowl', caption: 'Liquid gold' },
        { id: 'g3', src: `${IMG_BASE}/gallery-3.png`, alt: 'Bright yellow turmeric powder cascading from a wooden scoop', caption: 'The color of sunshine' },
        { id: 'g4', src: `${IMG_BASE}/gallery-4.png`, alt: 'Cinnamon sticks and star anise arranged in warm light', caption: 'Warmth in bark and star' },
        { id: 'g5', src: `${IMG_BASE}/gallery-5.png`, alt: 'Star anise pods scattered on dark slate', caption: 'Eight points of flavor' },
        { id: 'g6', src: `${IMG_BASE}/gallery-6.png`, alt: 'Green cardamom pods in a brass bowl', caption: 'The queen of spices' },
      ],
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 49. Carousel
  blocks.push({
    id: uid(), type: 'carousel',
    data: {
      slides: [
        { id: 's1', title: 'Persian Tahchin', body: 'Saffron rice with a golden crust. The dish that changed everything for me.', mediaUrl: `${IMG_BASE}/carousel-1.png` },
        { id: 's2', title: 'Japanese Ramen', body: 'A bowl that contains an entire civilization: noodles, broth, tare, toppings.', mediaUrl: `${IMG_BASE}/carousel-2.png` },
        { id: 's3', title: 'Mexican Mole', body: 'Twenty ingredients, three days, one sauce that tastes like history.', mediaUrl: `${IMG_BASE}/carousel-3.png` },
        { id: 's4', title: 'Italian Pasta al Pomodoro', body: 'Perfection through restraint. Three ingredients, infinite depth.', mediaUrl: `${IMG_BASE}/carousel-4.png` },
        { id: 's5', title: 'Indian Butter Chicken', body: 'Tomato, butter, cream, and spice in a harmony that transcends borders.', mediaUrl: `${IMG_BASE}/carousel-5.png` },
        { id: 's6', title: 'French Croissant', body: 'Layers of butter and dough that shatter between your teeth.', mediaUrl: `${IMG_BASE}/carousel-6.png` },
        { id: 's7', title: 'Thai Som Tam', body: 'Papaya, lime, fish sauce, chili, peanut. A salad that punches.', mediaUrl: `${IMG_BASE}/carousel-7.png` },
        { id: 's8', title: 'Ethiopian Injera', body: 'Sour fermented flatbread serving as plate and utensil for colorful stews.', mediaUrl: `${IMG_BASE}/carousel-8.png` },
        { id: 's9', title: 'Spanish Paella', body: 'Saffron-scented rice from Valencia, cooked over open fire in a wide pan.', mediaUrl: `${IMG_BASE}/carousel-9.png` },
        { id: 's10', title: 'Lebanese Mezze', body: 'A table crowded with hummus, falafel, tabbouleh, and infinite hospitality.', mediaUrl: `${IMG_BASE}/carousel-10.png` },
      ],
      autoplay: true,
      intervalMs: 5000,
      showIndicators: true,
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 50. Annotated Image
  blocks.push({
    id: uid(), type: 'annotated-image',
    data: {
      imageUrl: `${IMG_BASE}/vanilla-pod.png`,
      alt: 'Cross-section of a vanilla pod showing internal anatomy',
      caption: 'Anatomy of a Vanilla Pod: nature\'s most labor-intensive flavor',
      hotspots: [
        { id: 'h1', x: 25, y: 35, label: 'Outer Skin', description: 'The thick, leathery pod wall that protects the precious interior during the 9-month growing period.' },
        { id: 'h2', x: 55, y: 45, label: 'Seeds (Caviar)', description: 'Thousands of tiny black seeds containing vanillin — the primary aromatic compound. One pod holds millions of flavor particles.' },
        { id: 'h3', x: 75, y: 60, label: 'Oleoresin', description: 'The sticky, fragrant resin that binds the seeds together. This is where the deepest, most complex flavors live.' },
      ],
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 51. Branch Block
  blocks.push({
    id: uid(), type: 'branch',
    data: {
      prompt: 'Choose Your Flavor Adventure: What kind of eater are you?',
      layout: 'vertical',
      allowReset: true,
      variant: 'card',
      options: [
        {
          id: 'branch-spicy',
          label: 'I love spicy food',
          icon: '🌶️',
          content: `<h4>The Heat Seeker's Path</h4><p>You chase the endorphin rush of capsaicin. You know that pain and pleasure are neighbors on the tongue. In this path, we explore the world's hottest peppers, from the smoky depth of chipotle to the nuclear intensity of the Carolina Reaper.</p><p>Did you know? Birds are immune to capsaicin. Evolution designed chili peppers specifically for birds to eat and disperse their seeds — mammals like us were never supposed to enjoy them. We are flavor hackers.</p><img src="${IMG_BASE}/branch-spicy.png" alt="Habanero chili cut open showing seeds and veins" style="max-width:100%;" />`,
        },
        {
          id: 'branch-sweet',
          label: 'I prefer sweet and mellow',
          icon: '🍯',
          content: `<h4>The Comfort Seeker's Path</h4><p>You understand that sweetness is not weakness — it is the taste of safety, of mother's milk, of home. In this path, we explore the world's great desserts: French pastries, Japanese wagashi, Indian milk sweets, and the simple perfection of a ripe peach.</p><p>Did you know? The human brain has dedicated reward pathways for sugar that are stronger than those for cocaine. Evolution hardwired us to seek sweet because, for most of history, it meant ripe, safe, energy-dense food.</p><img src="${IMG_BASE}/branch-sweet.png" alt="Perfect creme brulee with caramelized sugar top" style="max-width:100%;" />`,
        },
        {
          id: 'branch-adventurous',
          label: "I'm an adventurous eater",
          icon: '🧪',
          content: `<h4>The Explorer's Path</h4><p>You eat not for comfort but for discovery. Fermented shark? Bring it. Century eggs? Absolutely. In this path, we dive into the weird, wild world of fermented and transformed foods — where time and microbes do the cooking.</p><p>Did you know? Kiviaq, a traditional Inuit dish from Greenland, involves stuffing hundreds of auks into a seal skin and fermenting them for months. The result is a pungent, cheese-like paste that tastes like the Arctic itself. Flavor is culture, and culture is sometimes strange.</p><img src="${IMG_BASE}/branch-adventurous.png" alt="Fermented kimchi in traditional clay pots" style="max-width:100%;" />`,
        },
      ],
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 52. Conditional Block
  blocks.push({
    id: uid(), type: 'conditional',
    data: {
      rules: [
        { variable: 'time.hour', operator: 'greater_than', value: 17 },
      ],
      logic: 'and',
      content: '<p><strong>Evening Flavor Fact:</strong> Your taste perception drops by up to 30% in the evening as circadian rhythms slow saliva production. This is why dinner often needs more salt and spice than lunch.</p>',
      fallbackContent: '<p><strong>Morning Flavor Fact:</strong> Your palate is sharpest between 10 AM and 1 PM. Professional tasters schedule their most critical evaluations during this window when taste buds are at peak sensitivity.</p>',
      evaluationMode: 'client',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 53. Code Playground (custom block)
  blocks.push({
    id: uid(), type: 'code-playground',
    data: {
      language: 'javascript',
      code: `// Flavor Pairing Calculator
function pair(ingredient) {
  const pairs = {
    "strawberry": ["balsamic", "black pepper", "basil", "chocolate"],
    "chocolate": ["chili", "sea salt", "orange", "coffee"],
    "tomato": ["basil", "mozzarella", "anchovy", "cinnamon"],
    "lamb": ["mint", "cumin", "pomegranate", "yogurt"]
  };
  return pairs[ingredient.toLowerCase()] || ["Try something bold!"];
}

console.log(pair("strawberry"));`,
      title: 'Flavor Pairing Calculator',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 54. H2 - The Challenge
  blocks.push({
    id: uid(), type: 'heading',
    data: { text: 'The Challenge: Choose Your Path', level: 2 },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 55. Moroccan Tagine Image
  blocks.push({
    id: uid(), type: 'image',
    data: {
      src: `${IMG_BASE}/moroccan-tagine.png`,
      alt: 'A traditional Moroccan tagine steaming in a sunlit courtyard',
      width: 1200, height: 675, fit: 'cover', status: 'ready',
      caption: 'The tagine: slow cooking as a form of patience.',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 56. H2 - The Closing
  blocks.push({
    id: uid(), type: 'heading',
    data: { text: 'The Closing: Returning to Tehran', level: 2 },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  blocks.push({
    id: uid(), type: 'text',
    data: {
      text: `I went back to that plastic stool in Tehran last year. The same woman was there, older now, still serving tahchin from a dented metal pot. I took a bite, and something remarkable happened: I tasted everything I had learned.\n\nI tasted the saffron — bitter, honeyed, ancient. I tasted the yogurt — sour, alive, fermented. I tasted the crispy rice — Maillard reaction, caramelization, the browning of starch and protein in hot fat. But I also tasted the bazaar around me: the cardamom in the air, the diesel from the street, the rosewater someone was spraying on a napkin nearby.\n\nFlavor is never just the food. It is the moment. The memory. The culture. The chemistry. The story.\n\nThat is why I wrote this. Not to teach you about flavor, but to invite you to pay attention. The next time you eat something — anything — slow down. Close your eyes. Ask yourself: What am I really tasting?\n\nThe answer might change your life. It changed mine.`,
      marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  // 57. Embed - YouTube flavor scientist
  blocks.push({
    id: uid(), type: 'embed',
    data: {
      url: 'https://www.youtube.com/embed/8q4L5XpaJzI',
      title: 'The Science of Flavor with Charles Spence',
      provider: 'youtube',
      aspectRatio: '16:9',
      allowFullscreen: true,
    },
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  return blocks;
}

async function createArticle() {
  await login();

  const blocks = makeBlocks();
  const excerpt = 'A journey through the five realms of taste, the secret sixth sense, and the future of how we eat. From the spice markets of Tehran to the fermentation labs of Copenhagen, this is the story of flavor.';

  const payload = {
    contentTypeId: 'blog_post',
    title: 'Flavors: The Invisible Architecture of Pleasure',
    slug: 'flavors',
    status: 'draft',
    fieldValues: [
      { fieldId: 'excerpt', value: excerpt },
      { fieldId: 'eyebrow', value: 'Food & Culture' },
      { fieldId: 'author', value: 'Pulse Culinary Team' },
      { fieldId: 'tags', value: ['food', 'culinary', 'science', 'culture', 'travel', 'gastronomy'] },
      { fieldId: 'featured', value: true },
      { fieldId: 'featuredImage', value: `${IMG_BASE}/hero.png` },
      { fieldId: 'featuredImageAlt', value: 'A panoramic spice market at golden hour with sacks of saffron, turmeric, paprika, and cinnamon' },
    ],
    blocks,
    metadata: {
      seoTitle: 'Flavors: The Invisible Architecture of Pleasure | Pulse',
      seoDescription: 'A Pulitzer-level interactive journey through the five realms of taste, the secret sixth sense, and the future of flavor. From Tehran to Copenhagen.',
      ogImage: `${IMG_BASE}/hero.png`,
      canonicalUrl: '/blog/flavors',
    },
  };

  console.log('Creating article...');
  const created = await api('/api/cms/entries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const entryId = created.data?.id || created.id;
  console.log('Article created:', entryId);

  console.log('Publishing article...');
  await api(`/api/cms/entries/${entryId}/publish`, { method: 'POST' });
  console.log('Article published!');

  return { entryId, slug: 'flavors' };
}

createArticle()
  .then(result => {
    console.log('\n✅ SUCCESS');
    console.log('Entry ID:', result.entryId);
    console.log('URL:', `http://localhost:3000/blog/${result.slug}`);
  })
  .catch(err => {
    console.error('\n❌ FAILED:', err.message);
    process.exit(1);
  });
