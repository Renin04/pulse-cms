/**
 * Create the "Eastern Fruits" masterpiece article via Pulse CMS API
 * Uses ALL 37+ block types including the critical Branch block
 */

const BASE_URL = 'http://localhost:3001';
const LOGIN = { email: 'mmshfa@pulse.local', password: '**removed**' };
const IMG_BASE = '/images/eastern-fruits';

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

function B(type, data) {
  return { id: uid(), type, data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

function makeBlocks() {
  const blocks = [];

  // 1. Hero Section
  blocks.push(B('hero-section', {
    title: "Eastern Fruits: Asia's Most Extraordinary Harvest",
    subtitle: "From frost-kissed yuzu groves to pungent durian stalls — discover fruits that shaped cultures, cuisines, and myths for millennia.",
    backgroundUrl: `${IMG_BASE}/hero-banner.png`,
    ctaLabel: 'Begin the Journey',
    ctaUrl: `${BASE_URL}/blog/eastern-fruits`,
  }));

  // 2. H1 Heading
  blocks.push(B('heading', { text: "Eastern Fruits: Nature's Most Daring Creations", level: 1, anchorId: 'the-hook' }));

  // 3. Opening paragraph
  blocks.push(B('text', {
    text: "I remember the first time a fruit made me cry. Not from sadness — from awe. I was standing in a night market in Bangkok when a vendor handed me a slice of mangosteen. I bit through the leathery purple rind, and the flesh exploded — sweet, tangy, floral, like someone had distilled a tropical garden into a single white segment.\n\nThat moment changed how I think about fruit. In the West, fruit is snack food. In the East, fruit is philosophy, medicine, mythology, and art. This article is a journey through the most extraordinary fruits Asia has to offer.",
    marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
  }));

  // 4. Image - feast flat-lay
  blocks.push(B('image', {
    src: `${IMG_BASE}/feast.png`, alt: 'A vibrant flat-lay of exotic eastern fruits on dark slate',
    width: 1200, height: 675, fit: 'cover', status: 'ready',
    caption: 'The eastern fruit feast: every color, every texture, every story.',
  }));

  // 5. H2 - Yuzu
  blocks.push(B('heading', { text: 'The Frost Survivor: Yuzu', level: 2 }));

  // 6. Yuzu paragraph
  blocks.push(B('text', {
    text: "The yuzu is not an orange. It is not a lemon. It is something older and stranger — a citrus fruit that has grown wild in the mountains of China and Japan for over a thousand years. Yuzu trees survive temperatures that would kill other citrus. They produce fruit with a knobby, uneven skin and an aroma so complex it has been described as a cross between grapefruit, mandarin, and something that does not exist anywhere else on Earth.\n\nIn Japan, yuzu is not eaten raw. It is floated in hot baths on the winter solstice — a tradition called yuzuyu — where the essential oils fill the steam and the bather emerges with skin like silk. The juice seasons ponzu sauce. The zest garnishes miso soup. Every part of the fruit is used, and nothing is wasted.",
    marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
  }));

  // 7. Yuzu image
  blocks.push(B('image', {
    src: `${IMG_BASE}/yuzu.png`, alt: 'Fresh yuzu fruits with knobby golden-yellow skin arranged on a wooden board',
    width: 1200, height: 675, fit: 'cover', status: 'ready',
    caption: 'Yuzu: the mountain citrus that perfumes Japanese winter baths.',
  }));

  // 8. H2 - Mangosteen
  blocks.push(B('heading', { text: 'The Queen of Fruits: Mangosteen', level: 2 }));

  // 9. Mangosteen paragraph
  blocks.push(B('text', {
    text: "If yuzu is the philosopher of eastern fruits, mangosteen is the queen. The purple rind is thick and bitter, designed by nature to protect what lies within: segments of pure white flesh that taste like strawberry, peach, and ice cream had a baby.\n\nQueen Victoria is said to have offered a reward of one hundred pounds to anyone who could bring her a fresh mangosteen. She never tasted one. The fruit is so delicate that it ferments within days of harvest, making long-distance transport nearly impossible before modern cold chains. Even now, a perfect mangosteen is a luxury.",
    marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
  }));

  // 10. Mangosteen image
  blocks.push(B('image', {
    src: `${IMG_BASE}/mangosteen.png`, alt: 'A mangosteen cut open revealing snowy white segments against deep purple rind',
    width: 1200, height: 675, fit: 'cover', status: 'ready',
    caption: 'Mangosteen: the fruit so precious that queens offered gold for a single taste.',
  }));

  // 11. H2 - The Controversial King
  blocks.push(B('heading', { text: 'The Controversial King: Durian', level: 2 }));

  // 12. Durian paragraph
  blocks.push(B('text', {
    text: "Durian does not ask for your approval. It enters a room like a rock star with a reputation — loved by millions, banned by airlines, hotels, and public transit systems across Southeast Asia. The smell has been compared to rotting onions, turpentine, and raw sewage. The taste has been compared to sweet almond custard, caramel, and heaven.\n\nThe contradiction is the point. Durian contains over fifty different aromatic compounds, including ones found in onions, skunks, and honey. It is the only fruit that smells like decay and tastes like dessert. In Thailand, they say: 'When the durian falls, the sarong rises' — meaning the smell is so powerful it lifts your clothes.",
    marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
  }));

  // 13. Durian image
  blocks.push(B('image', {
    src: `${IMG_BASE}/durian.png`, alt: 'A spiky durian split open revealing rich golden pods',
    width: 1200, height: 675, fit: 'cover', status: 'ready',
    caption: 'Durian: banned in hotels, worshipped in temples, unforgettable everywhere.',
  }));

  // 14. Horizontal Rule
  blocks.push(B('horizontal-rule', {}));

  // 15. H2 - The Jewels of the Tropics
  blocks.push(B('heading', { text: "The Jewels of the Tropics: Lychee, Longan & Rambutan", level: 2 }));

  // 16. Intro paragraph
  blocks.push(B('text', {
    text: "Three cousins, three personalities, one family. The Sapindaceae clan has given Asia some of its most beloved fruits — each wrapped in a leathery shell, each hiding translucent flesh around a dark seed, each tasting like a different kind of love letter.",
    marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
  }));

  // 17. Tabs - compare the three
  blocks.push(B('tabs', {
    activeTabId: 'tab-lychee',
    tabs: [
      { id: 'tab-lychee', label: 'Lychee', content: "The lychee is the romantic. Its rough pink shell cracks open to reveal flesh that is floral, honeyed, and slightly acidic. In Chinese poetry, lychees symbolize love and longing — the Tang Emperor Xuanzong had them carried by horseback relay from Guangdong to his concubine in Chang'an, a journey of thousands of miles, just so she could taste their freshness." },
      { id: 'tab-longan', label: 'Longan', content: 'The longan is the quiet sibling. Smaller, less flashy, but somehow more profound. Its name means "dragon eye" in Chinese because the black seed shows through the translucent flesh like a pupil. Dried longans are used in traditional Chinese medicine to calm the spirit and improve sleep. They taste like brown sugar and rain.' },
      { id: 'tab-rambutan', label: 'Rambutan', content: 'The rambutan is the wild child. Covered in soft red spines that look like hair — rambut means "hair" in Malay — this fruit looks like it came from another planet. Inside, the flesh is firmer than lychee, with a subtle grape-like sweetness and a hint of acidity. It is the most fun to eat because peeling it feels like unwrapping a gift.' },
    ],
  }));

  // 18. Gallery - three fruits
  blocks.push(B('gallery', {
    title: 'The Sapindaceae Family Portrait',
    layout: 'grid',
    columns: 3,
    images: [
      { id: 'g1', src: `${IMG_BASE}/lychee.png`, alt: 'Fresh lychees with rough pink shells', caption: "Lychee: the emperor's favorite" },
      { id: 'g2', src: `${IMG_BASE}/longan.png`, alt: 'Golden longans in a woven basket', caption: "Longan: the dragon's eye" },
      { id: 'g3', src: `${IMG_BASE}/rambutan.png`, alt: 'Bright red rambutans with soft spines', caption: 'Rambutan: the hairy alien' },
    ],
  }));

  // 19. H2 - The Giants
  blocks.push(B('heading', { text: "The Giants: Jackfruit & Buddha's Hand", level: 2 }));

  // 20. Jackfruit paragraph
  blocks.push(B('text', {
    text: "Jackfruit is the largest tree-borne fruit in the world. A single fruit can weigh up to eighty pounds — heavier than a toddler. The exterior is covered in blunt spikes. The interior contains hundreds of yellow bulbs, each surrounding a seed, all suspended in a fibrous matrix that looks like shredded cheese.\n\nUnripe jackfruit has become a vegan sensation because its fibrous texture mimics pulled pork when cooked. But ripe jackfruit is something else entirely — intensely sweet, with an aroma like Juicy Fruit gum and pineapple had a love child. In India, it is called kathal, and it is treated with the reverence usually reserved for meat.",
    marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
  }));

  // 21. Jackfruit image
  blocks.push(B('image', {
    src: `${IMG_BASE}/jackfruit.png`, alt: 'A massive jackfruit split open showing golden pods inside',
    width: 1200, height: 675, fit: 'cover', status: 'ready',
    caption: 'Jackfruit: eighty pounds of tropical ambition.',
  }));

  // 22. Buddha's Hand paragraph
  blocks.push(B('text', {
    text: "Buddha's hand is not a fruit you eat. It is a fruit you admire, you perfume your house with, you offer at temple altars. It looks like a lemon that has exploded into a hundred yellow fingers — a citron with no juice, no pulp, only rind.\n\nThe rind is pure essential oil. In China, it symbolizes happiness and long life. In Japan, it is candied and eaten at New Year. In California, where it is now grown, mixologists use it to garnish cocktails that cost twenty dollars. It is the most expensive citrus per pound because there is nothing inside but fragrance.",
    marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
  }));

  // 23. Buddha's Hand image
  blocks.push(B('image', {
    src: `${IMG_BASE}/buddha-hand.png`, alt: "A yellow Buddha's hand citron with finger-like segments",
    width: 1200, height: 675, fit: 'cover', status: 'ready',
    caption: "Buddha's Hand: all perfume, no pulp, pure presence.",
  }));

  // 24. H2 - Dragon Fruit & Persimmon
  blocks.push(B('heading', { text: 'The Shape-Shifters: Dragon Fruit & Persimmon', level: 2 }));

  // 25. Dragon fruit paragraph
  blocks.push(B('text', {
    text: "Dragon fruit looks like it was designed by a fantasy novelist. Hot pink skin with green-tipped scales. White or magenta flesh dotted with black seeds. It is the fruit of a cactus that climbs trees in Central America but has become an icon of Southeast Asian markets.\n\nThe taste is surprisingly mild — like a cross between kiwi and pear, with a subtle sweetness and a crunchy texture from the seeds. It is not the most flavorful fruit, but it is undeniably the most photogenic. Instagram has made dragon fruit a star, and the fruit does not seem to mind the attention.",
    marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
  }));

  // 26. Dragon fruit image
  blocks.push(B('image', {
    src: `${IMG_BASE}/dragon-fruit.png`, alt: 'A vibrant pink dragon fruit sliced to reveal white flesh with black seeds',
    width: 1200, height: 675, fit: 'cover', status: 'ready',
    caption: 'Dragon fruit: the Instagram model of the fruit world.',
  }));

  // 27. Persimmon paragraph
  blocks.push(B('text', {
    text: "The persimmon is a lesson in patience. Eat an unripe Hachiya persimmon, and your mouth will feel like it has been vacuum-sealed — the tannins are so astringent they literally bind to the proteins in your saliva. But wait. Wait until the fruit is so soft it feels like a water balloon. Then spoon the flesh out, and it tastes like honey, apricot, and brown sugar melted together.\n\nIn Japan, dried persimmons — hoshigaki — are massaged daily for weeks until their surface develops a powdery bloom of natural sugar. They are given as gifts at New Year. They are hung under eaves like amber lanterns. They are, quite simply, one of the most beautiful things humans do to fruit.",
    marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
  }));

  // 28. Persimmon image
  blocks.push(B('image', {
    src: `${IMG_BASE}/persimmon.png`, alt: 'Glowing orange persimmons on bare autumn branches',
    width: 1200, height: 675, fit: 'cover', status: 'ready',
    caption: 'Persimmon: the fruit that teaches patience.',
  }));

  // 29. Callout
  blocks.push(B('callout', {
    variant: 'tip',
    title: 'Pro Tip',
    body: 'To speed-ripen a Hachiya persimmon, place it in a paper bag with an apple. The ethylene gas from the apple will soften the persimmon in 24-48 hours.',
    icon: '💡',
  }));

  // 30. Alert
  blocks.push(B('alert', {
    severity: 'warning',
    title: 'Warning',
    message: 'Never eat an unripe Hachiya persimmon. The astringency is so intense it can cause gagging. Wait until it feels like a water balloon.',
    dismissible: true,
    isDismissed: false,
  }));

  // 31. H2 - Market Life
  blocks.push(B('heading', { text: 'Market Life: Where Fruit Becomes Theater', level: 2 }));

  // 32. Market paragraph
  blocks.push(B('text', {
    text: "Asian fruit markets are not supermarkets. They are theaters. Vendors call out like auctioneers. Housewives squeeze and sniff with the expertise of sommeliers. Trucks unload durian at 4 AM while the city still sleeps. Mango sellers arrange their fruit in pyramids that would make Pharaohs jealous.\n\nIn Bangkok's Khlong Toei market, I watched a woman buy a single mangosteen. She pressed the rind with her thumb, listened for a crack, smelled the stem, and nodded. The vendor opened it with a twist of his wrist, revealing perfect white segments. She ate it standing there, juice running down her chin, and then bought twenty more. That is how you buy fruit in Asia — not with a shopping list, but with your senses.",
    marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
  }));

  // 33. Gallery - market scenes
  blocks.push(B('gallery', {
    title: 'Fruit Markets of Asia',
    layout: 'masonry',
    columns: 3,
    images: [
      { id: 'm1', src: `${IMG_BASE}/market-1.png`, alt: 'A bustling night market in Bangkok with fruit stalls glowing under neon', caption: 'Bangkok after dark' },
      { id: 'm2', src: `${IMG_BASE}/market-2.png`, alt: 'An elderly vendor arranging mangosteens in perfect pyramids', caption: 'The pyramid builder' },
      { id: 'm3', src: `${IMG_BASE}/market-3.png`, alt: 'Fresh lychees cascading from woven baskets in Guangzhou', caption: 'Guangzhou morning' },
      { id: 'm4', src: `${IMG_BASE}/market-4.png`, alt: 'A durian stall with workers wearing protective gloves', caption: 'The danger zone' },
      { id: 'm5', src: `${IMG_BASE}/market-5.png`, alt: 'Colorful dragon fruits stacked like jewels at a Vietnamese market', caption: 'Vietnamese jewels' },
      { id: 'm6', src: `${IMG_BASE}/market-6.png`, alt: 'Yuzu harvest in a misty Japanese mountain village', caption: 'Mountain harvest' },
    ],
  }));

  // 34. H2 - Dishes
  blocks.push(B('heading', { text: 'From Tree to Table: Eastern Fruit Dishes', level: 2 }));

  // 35. Carousel - fruit dishes
  blocks.push(B('carousel', {
    slides: [
      { id: 's1', title: 'Yuzu Kosho', body: 'A fiery Japanese paste made from yuzu zest, chili, and salt. Used to season hot pots, grilled meats, and noodles.', mediaUrl: `${IMG_BASE}/dish-1.png` },
      { id: 's2', title: 'Mangosteen Smoothie', body: 'Fresh mangosteen blended with coconut milk and ice. The purple rind is steeped for color and antioxidants.', mediaUrl: `${IMG_BASE}/dish-2.png` },
      { id: 's3', title: 'Durian Pancakes', body: 'A Southeast Asian street food where durian flesh is wrapped in thin crepes with whipped cream.', mediaUrl: `${IMG_BASE}/dish-3.png` },
      { id: 's4', title: 'Lychee Rose Martini', body: 'Muddled lychees, rose water, gin, and a splash of lychee syrup. Garnished with a single fresh lychee.', mediaUrl: `${IMG_BASE}/dish-4.png` },
      { id: 's5', title: 'Jackfruit Curry', body: 'Young jackfruit simmered in coconut curry with mustard seeds and curry leaves. A South Indian classic.', mediaUrl: `${IMG_BASE}/dish-5.png` },
      { id: 's6', title: 'Buddha Hand Marmalade', body: 'The entire fruit is sliced paper-thin and candied in sugar syrup until translucent and jewel-like.', mediaUrl: `${IMG_BASE}/dish-6.png` },
      { id: 's7', title: 'Dragon Fruit Bowl', body: 'Scooped dragon fruit filled with tropical granola, coconut yogurt, and fresh berries.', mediaUrl: `${IMG_BASE}/dish-7.png` },
      { id: 's8', title: 'Hoshigaki', body: 'Japanese dried persimmons massaged daily for weeks until they develop a powdery sugar bloom.', mediaUrl: `${IMG_BASE}/dish-8.png` },
      { id: 's9', title: 'Rambutan Salad', body: 'Fresh rambutan combined with mint, lime, chili, and toasted coconut. A Thai refreshing salad.', mediaUrl: `${IMG_BASE}/dish-9.png` },
      { id: 's10', title: 'Longan Tong Sui', body: 'A Chinese sweet soup of dried longans, red dates, and snow fungus — believed to improve sleep and complexion.', mediaUrl: `${IMG_BASE}/dish-10.png` },
    ],
    autoplay: true,
    intervalMs: 5000,
    showIndicators: true,
  }));

  // 36. H2 - Science & Nutrition
  blocks.push(B('heading', { text: 'The Science of Eastern Fruits', level: 2 }));

  // 37. Unordered list - health benefits
  blocks.push(B('list', {
    style: 'unordered',
    items: [
      'Mangosteen contains xanthones — powerful antioxidants with anti-inflammatory properties',
      'Durian is richer in potassium than bananas and contains tryptophan, which aids sleep',
      'Yuzu is packed with vitamin C and nomilin, a compound that may reduce blood sugar spikes',
      'Lychee provides polyphenols that support heart health and copper for red blood cell formation',
      'Jackfruit seeds are edible and contain protein, iron, and B vitamins',
      'Dragon fruit is high in fiber, prebiotics, and betalains that support gut health',
      'Persimmons contain beta-carotene, manganese, and tannins that have antimicrobial effects',
    ],
  }));

  // 38. Blockquote
  blocks.push(B('blockquote', {
    quote: "The fruit is the most honest food. It does not pretend to be something it is not. A durian smells like death and tastes like heaven. A mangosteen looks like armor and melts like silk. They teach us that contradiction is not hypocrisy — it is complexity.",
    citation: "— Fuchsia Dunlop, The Food of Sichuan",
    align: 'left',
  }));

  // 39. Video
  blocks.push(B('video', {
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    provider: 'youtube',
    title: 'The Secret World of Asian Fruit Markets',
    caption: 'A documentary journey through the fruit markets of Bangkok, Hong Kong, and Tokyo.',
    autoplay: false,
    startAtSeconds: 0,
  }));

  // 40. Audio
  blocks.push(B('audio', {
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    title: 'Morning Market Ambience',
    artist: 'Field Recording',
    caption: 'The sounds of a Bangkok fruit market at dawn — chopping, calling, bargaining, laughing.',
    autoplay: false,
    loop: false,
  }));

  // 41. File
  blocks.push(B('file', {
    name: 'Eastern Fruits Field Guide.pdf',
    url: `${IMG_BASE}/file-thumb.png`,
    description: 'Download the complete Eastern Fruits field guide with identification tips, seasonal availability, and buying advice.',
    openInNewTab: true,
  }));

  // 42. Embed - Spotify
  blocks.push(B('embed', {
    url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX9Rwf3t1xU27',
    title: 'Tropical Fruits Playlist',
    provider: 'spotify',
    aspectRatio: '16:9',
    allowFullscreen: false,
  }));

  // 43. Link block
  blocks.push(B('link', {
    text: 'Smithsonian Magazine — The Strange History of Durian',
    url: 'https://www.smithsonianmag.com/travel/durian-fruit-smell-thailand-180960876/',
    openInNewTab: true,
  }));

  // 44. Code block
  blocks.push(B('code', {
    code: `function ripenessScore(fruit) {
  const scores = {
    mangosteen: (f) => f.rindYieldsToPressure ? 10 : 3,
    durian: (f) => f.stemIsGreen && f.smellIsPungent ? 9 : 5,
    persimmon: (f) => f.feelsLikeWaterBalloon ? 10 : 2,
    yuzu: (f) => f.skinIsSlightlySoft && f.aromaIsStrong ? 10 : 6,
  };
  return scores[fruit.type]?.(fruit) || 5;
}`,
    language: 'javascript',
    theme: 'github-light',
    showLineNumbers: true,
  }));

  // 45. Table - fruit comparison
  blocks.push(B('table', {
    caption: 'Eastern Fruits at a Glance',
    columns: ['Fruit', 'Origin', 'Peak Season', 'Flavor Profile', 'Aroma Intensity'],
    rows: [
      ['Yuzu', 'China/Japan', 'Nov-Feb', 'Tart, floral, complex', 'High'],
      ['Mangosteen', 'Malaysia/Thailand', 'May-Sep', 'Sweet, tangy, floral', 'Low'],
      ['Durian', 'Malaysia/Thailand', 'Jun-Aug', 'Sweet, creamy, sulfurous', 'Extreme'],
      ['Lychee', 'China', 'May-Jul', 'Floral, honeyed, acidic', 'Medium'],
      ['Longan', 'China/Thailand', 'Jul-Sep', 'Mild, sweet, musky', 'Low'],
      ['Rambutan', 'Malaysia/Indonesia', 'Jun-Sep', 'Grape-like, acidic', 'Low'],
      ['Jackfruit', 'India/Sri Lanka', 'Mar-Jun', 'Sweet, tropical, bubblegum', 'High'],
      ['Dragon Fruit', 'Mexico/Vietnam', 'Jun-Oct', 'Mild, kiwi-like, crunchy', 'Low'],
      ['Persimmon', 'China/Japan', 'Oct-Dec', 'Honeyed, apricot, brown sugar', 'Medium'],
      ["Buddha's Hand", 'India/China', 'Nov-Jan', 'No flesh — pure citrus oil', 'Very High'],
    ],
  }));

  // 46. Chart
  blocks.push(B('chart', {
    title: 'Vitamin C Content by Fruit (mg per 100g)',
    chartType: 'bar',
    labels: ['Yuzu', 'Guava', 'Lychee', 'Persimmon', 'Dragon Fruit', 'Mangosteen', 'Durian'],
    datasets: [
      { id: 'ds1', label: 'Vitamin C (mg)', values: [90, 228, 72, 66, 20, 3, 20] },
    ],
  }));

  // 47. Math Equation
  blocks.push(B('math-equation', {
    latex: '\\text{Ripeness Index} = \\frac{\\text{sugar} \\times \\text{aroma}}{\\text{acidity} + \\text{firmness}}',
    displayMode: true,
  }));

  // 48. Diagram
  blocks.push(B('diagram', {
    engine: 'mermaid',
    source: `graph TD
    A[Fruit on Tree] --> B{Harvested Ripe?}
    B -->|Yes| C[Local Market]
    B -->|No| D[Cold Storage Ripening]
    D --> C
    C --> E{Buyer Inspect}
    E -->|Pass| F[Home Kitchen]
    E -->|Fail| G[Compost/Vendor Eats]
    F --> H[Peel/Cut]
    H --> I{How to Eat?}
    I -->|Fresh| J[Raw Enjoyment]
    I -->|Cook| K[Recipe Transformation]
    I -->|Preserve| L[Dried/Candied]`,
    caption: 'The Life Cycle of an Eastern Fruit: From Tree to Table',
  }));

  // 49. Map
  blocks.push(B('map', {
    provider: 'openstreetmap',
    latitude: 15.0,
    longitude: 105.0,
    zoom: 4,
    label: 'Southeast Asia: the global epicenter of tropical fruit biodiversity.',
  }));

  // 50. Timeline
  blocks.push(B('timeline', {
    title: 'A Thousand Years of Eastern Fruits',
    entries: [
      { id: 't1', title: 'First Lychee Cultivation', date: '2000-01-01T00:00:00.000Z', description: 'Chinese farmers in Guangdong begin selective breeding of wild lychee trees.' },
      { id: 't2', title: 'Persimmon Arrives in Japan', date: '0800-01-01T00:00:00.000Z', description: 'Buddhist monks bring persimmon cultivars from China to Japan.' },
      { id: 't3', title: 'Yuzuyu Tradition Begins', date: '1200-01-01T00:00:00.000Z', description: 'Japanese nobility begin floating yuzu in hot baths on the winter solstice.' },
      { id: 't4', title: 'Mangosteen Reaches Europe', date: '1650-01-01T00:00:00.000Z', description: 'Dutch traders describe mangosteen as the most delicious fruit in the Indies.' },
      { id: 't5', title: "Buddha's Hand in California", date: '1980-01-01T00:00:00.000Z', description: 'California citrus growers begin cultivating Buddha hand citron for the specialty market.' },
      { id: 't6', title: 'Jackfruit Goes Vegan', date: '2015-01-01T00:00:00.000Z', description: 'Western vegan chefs discover young jackfruit as a meat substitute.' },
      { id: 't7', title: 'Dragon Fruit Goes Viral', date: '2020-01-01T00:00:00.000Z', description: 'Social media makes dragon fruit bowls and smoothies a global phenomenon.' },
    ],
  }));

  // 51. Comparison
  blocks.push(B('comparison', {
    leftTitle: 'Ripe Durian',
    rightTitle: 'Unripe Durian',
    rows: [
      { id: 'c1', label: 'Smell', leftValue: 'Pungent, sulfurous, complex', rightValue: 'Green, grassy, mild' },
      { id: 'c2', label: 'Texture', leftValue: 'Creamy, custard-like', rightValue: 'Firm, starchy, rubbery' },
      { id: 'c3', label: 'Color', leftValue: 'Bright golden yellow', rightValue: 'Pale white or pinkish' },
      { id: 'c4', label: 'Taste', leftValue: 'Sweet, caramel, almond', rightValue: 'Bland, chalky, astringent' },
      { id: 'c5', label: 'Edibility', leftValue: 'Divine experience', rightValue: 'Cook only, do not eat raw' },
    ],
  }));

  // 52. Before/After
  blocks.push(B('before-after', {
    beforeUrl: `${IMG_BASE}/before-after.png`,
    afterUrl: `${IMG_BASE}/before-after.png`,
    beforeLabel: 'Unripe Mangosteen',
    afterLabel: 'Perfectly Ripe Mangosteen',
    position: 50,
  }));

  // 53. Manga Panel
  blocks.push(B('manga-panel', {
    title: 'A Day at the Bangkok Fruit Market',
    layout: 'strip',
    readingDirection: 'ltr',
    panels: [
      { id: 'mp1', imageUrl: `${IMG_BASE}/manga-panel.png`, caption: '5:00 AM: The trucks arrive. Durian, mangosteen, rambutan — mountains of fruit in the dark.', dialogue: '"First pick of the day. The best fruit never sees the sun."' },
      { id: 'mp2', imageUrl: `${IMG_BASE}/manga-panel.png`, caption: '8:00 AM: The market explodes with color. Vendors shout prices like auctioneers.', dialogue: '"Mangosteen! Fifty baht per kilo! Sweet as honey!"' },
      { id: 'mp3', imageUrl: `${IMG_BASE}/manga-panel.png`, caption: '6:00 PM: The last durian is sold. The floor is sticky with juice and dreams.', dialogue: '"Tomorrow we do it again. But the fruit will be different."' },
    ],
  }));

  // 54. Speech Bubble - Mangosteen
  blocks.push(B('speech-bubble', {
    speaker: 'Mangosteen',
    text: 'I am called the Queen of Fruits. My rind is bitter armor. My heart is white silk. I do not travel well. I do not wait. Eat me now, or regret me forever.',
    tone: 'happy',
    align: 'left',
  }));

  // 55. Speech Bubble - Durian
  blocks.push(B('speech-bubble', {
    speaker: 'Durian',
    text: 'You think I smell bad? I smell like truth. Like nature unfiltered. Like life and death in the same breath. Either love me or leave me. I will not change for you.',
    tone: 'angry',
    align: 'right',
  }));

  // 56. Card - Jackfruit
  blocks.push(B('card', {
    title: 'Fruit Profile: Jackfruit',
    body: 'The largest tree-borne fruit in the world. Unripe flesh mimics pulled pork. Ripe flesh tastes like tropical bubblegum. Seeds are edible and nutritious. One tree can produce 200 fruits per year.',
    mediaUrl: `${IMG_BASE}/card.png`,
    linkUrl: 'https://en.wikipedia.org/wiki/Jackfruit',
    ctaLabel: 'Learn More',
  }));

  // 57. Annotated Image
  blocks.push(B('annotated-image', {
    imageUrl: `${IMG_BASE}/annotated.png`,
    alt: 'Cross-section of a mangosteen showing internal anatomy',
    caption: 'Anatomy of a Mangosteen: nature\'s most perfect packaging',
    hotspots: [
      { id: 'h1', x: 20, y: 30, label: 'Thick Rind', description: 'The leathery purple rind contains xanthones — powerful antioxidants. It is bitter and astringent, protecting the delicate flesh inside.' },
      { id: 'h2', x: 50, y: 45, label: 'White Aril', description: 'The edible flesh that surrounds each seed. Sweet, tangy, and floral with a texture like soft butter.' },
      { id: 'h3', x: 75, y: 60, label: 'Seed', description: 'The bitter seed inside each segment. In some cultures, the seeds are roasted and eaten like nuts.' },
    ],
  }));

  // 58. Quiz
  blocks.push(B('quiz', {
    question: 'Which eastern fruit is known as the "King of Fruits" and is banned on many airlines?',
    options: [
      { id: 'q1-opt1', text: 'Mangosteen', isCorrect: false, explanation: 'Mangosteen is actually called the "Queen of Fruits."' },
      { id: 'q1-opt2', text: 'Durian', isCorrect: true, explanation: 'Correct! Durian is called the "King of Fruits" and its pungent smell has led to bans on planes, trains, and hotels across Southeast Asia.' },
      { id: 'q1-opt3', text: 'Jackfruit', isCorrect: false, explanation: 'Jackfruit is the largest tree-borne fruit but is not known for a strong smell.' },
      { id: 'q1-opt4', text: 'Yuzu', isCorrect: false, explanation: 'Yuzu is prized for its delicate aroma, not banned for it.' },
    ],
    allowMultiple: false,
    randomizeOptions: true,
    showExplanations: true,
  }));

  // 59. Poll
  blocks.push(B('poll', {
    question: 'Which eastern fruit would you try first?',
    options: [
      { id: 'poll-yuzu', label: 'Yuzu', votes: 34 },
      { id: 'poll-mangosteen', label: 'Mangosteen', votes: 67 },
      { id: 'poll-durian', label: 'Durian', votes: 28 },
      { id: 'poll-lychee', label: 'Lychee', votes: 45 },
      { id: 'poll-jackfruit', label: 'Jackfruit', votes: 22 },
    ],
    allowMultiple: false,
  }));

  // 60. Survey
  blocks.push(B('survey', {
    title: 'Your Eastern Fruit Profile',
    description: 'Answer a few questions and we will reveal your fruit personality.',
    questions: [
      { id: 'sq1', prompt: 'How adventurous are you with food?', type: 'single', required: true, options: ['Very cautious', 'Somewhat open', 'Pretty adventurous', 'I will eat anything'] },
      { id: 'sq2', prompt: 'Pick a flavor profile:', type: 'single', required: true, options: ['Sweet and floral', 'Tart and complex', 'Creamy and rich', 'Mild and refreshing'] },
      { id: 'sq3', prompt: 'Rate your tolerance for strong smells:', type: 'rating', required: true, scaleMax: 5 },
      { id: 'sq4', prompt: 'What is your favorite cuisine?', type: 'text', required: false },
    ],
  }));

  // 61. Flashcard
  blocks.push(B('flashcard', {
    title: 'Eastern Fruit Memory Cards',
    shuffle: true,
    cards: [
      { id: 'fc1', front: 'Yuzu', back: 'Origin: China/Japan. A knobby citrus with complex aroma. Used in baths, sauces, and perfumes. Survives frost that kills other citrus.', hint: 'Japanese winter solstice bath' },
      { id: 'fc2', front: 'Mangosteen', back: 'Origin: Southeast Asia. Purple rind, white segments. Called the Queen of Fruits. Ferments within days of harvest.', hint: 'Queen Victoria offered 100 pounds for one' },
      { id: 'fc3', front: 'Durian', back: 'Origin: Malaysia/Thailand. Spiky husk, creamy golden pods. Banned on airlines. Contains 50+ aromatic compounds.', hint: 'Smells like hell, tastes like heaven' },
      { id: 'fc4', front: 'Longan', back: 'Origin: China. Small, translucent flesh around black seed. Name means "dragon eye." Used in Chinese medicine for sleep.', hint: 'Looks like a reptile eyeball' },
      { id: 'fc5', front: "Buddha's Hand", back: 'Origin: India/China. Citron with no juice or pulp — only fragrant rind. Used in temples and cocktails.', hint: 'A lemon that exploded into fingers' },
    ],
  }));

  // 62. Accordion
  blocks.push(B('accordion', {
    allowMultiple: true,
    items: [
      { id: 'acc1', title: 'How to pick a perfect mangosteen', content: 'Press the rind gently with your thumb. It should yield slightly but not feel mushy. The stem should be green and fresh. The shell should be deep purple, not brown. Shake it — if you hear a rattle, the fruit is old and the segments have shrunk.', defaultOpen: false },
      { id: 'acc2', title: 'The secret to cutting durian without injury', content: 'Use a heavy cleaver and a cutting board you do not mind scarring. Cut along the natural seams on the bottom of the fruit. The seams are where the pods meet — cutting here separates the fruit cleanly without fighting the spikes.', defaultOpen: false },
      { id: 'acc3', title: 'Why yuzu is so expensive outside Japan', content: 'Yuzu trees take 15+ years to bear fruit. The fruit is delicate and does not travel well. Most countries ban import of fresh yuzu due to citrus disease concerns. Almost all yuzu outside Japan is either frozen pulp or bottled juice.', defaultOpen: false },
      { id: 'acc4', title: 'How to eat a persimmon without trauma', content: 'Fuyu persimmons are flat and can be eaten firm like apples. Hachiya persimmons are acorn-shaped and MUST be soft as jelly before eating. If in doubt, squeeze gently — if it feels like a full water balloon, it is ready.', defaultOpen: false },
    ],
  }));

  // 63. Toggle
  blocks.push(B('toggle', {
    label: 'Reveal: The Hidden Secret of Durian',
    content: 'The reason durian smells so intense is not the fruit itself — it is the bacteria that ferment the fruit the moment it falls from the tree. Within hours of hitting the ground, microbial action begins, producing sulfur compounds, esters, and alcohols. A durian picked from the tree is actually much milder than one that has sat on the ground. This is why premium durians are harvested by hand, not allowed to fall naturally.',
    defaultOn: false,
  }));

  // 64. Spoiler
  blocks.push(B('spoiler', {
    label: 'Spoiler: The most expensive fruit in the world is not what you think',
    content: 'Most people guess durian or mangosteen, but the actual answer is the Yubari King melon from Japan. A pair of these perfect cantaloupes sold at auction for $29,000 in 2019. They are grown in greenhouses in Hokkaido, massaged daily, and given personalized care. The second most expensive is the Taiyo no Tamago mango from Miyazaki, which can cost $3,000 per pair.',
    revealed: false,
  }));

  // 65. H2 - Branch Adventure
  blocks.push(B('heading', { text: 'Choose Your Fruit Adventure', level: 2 }));

  // 66. BRANCH BLOCK (CRITICAL)
  blocks.push(B('branch', {
    prompt: 'Which eastern fruit calling speaks to your soul?',
    layout: 'vertical',
    allowReset: true,
    variant: 'card',
    options: [
      {
        id: 'branch-adventurous',
        label: 'I want the wild experience',
        icon: '🌶️',
        content: `<h4>The Durian Daredevil Path</h4><p>You do not shy away from intensity. You understand that the most extraordinary experiences often come wrapped in the most challenging packages. In this path, we explore the world's most divisive fruit — from the bustling stalls of Bangkok to the Michelin-starred kitchens of Singapore.</p><p>Did you know? In Singapore, durian is taken so seriously that there are luxury hotels with dedicated durian suites — sealed, ventilated rooms where guests can enjoy the fruit in climate-controlled comfort. The Ritz-Carlton even offers a durian high tea.</p><img src="${IMG_BASE}/branch.png" alt="A durian stall in Bangkok at night" style="max-width:100%;" />`,
      },
      {
        id: 'branch-refined',
        label: 'I prefer elegance and subtlety',
        icon: '🍷',
        content: `<h4>The Mangosteen Connoisseur Path</h4><p>You appreciate the finer things. You know that true luxury is not about flash — it is about rarity, delicacy, and a flavor so perfect it feels like a secret. In this path, we explore the Queen of Fruits and her court of refined tropical delights.</p><p>Did you know? Mangosteen was so prized in Victorian England that a single fresh fruit cost more than a month's wages for a factory worker. Sailors who brought mangosteens back alive were given bonuses equivalent to a year's salary.</p><img src="${IMG_BASE}/mangosteen.png" alt="Perfect mangosteens arranged like jewels" style="max-width:100%;" />`,
      },
      {
        id: 'branch-curious',
        label: 'I am a curious explorer',
        icon: '🔬',
        content: `<h4>The Yuzu Scientist Path</h4><p>You are driven by curiosity. You want to understand not just what something tastes like, but why it tastes that way. In this path, we dive deep into the chemistry, history, and cultural significance of Asia's most fascinating citrus.</p><p>Did you know? Yuzu contains a unique compound called yuzunone that is not found in any other citrus. Scientists are studying it for potential neuroprotective effects. The fruit is also one of the few citrus varieties that can survive temperatures as low as -9°C (15°F).</p><img src="${IMG_BASE}/yuzu.png" alt="Yuzu fruits in a snowy Japanese garden" style="max-width:100%;" />`,
      },
    ],
  }));

  // 67. Conditional
  blocks.push(B('conditional', {
    rules: [
      { variable: 'time.hour', operator: 'greater_than', value: 17 },
    ],
    logic: 'and',
    content: '<p><strong>Evening Fruit Fact:</strong> Your sense of smell is sharpest in the evening, making after-dinner fruit tastings the most flavorful. This is why traditional Japanese kaiseki meals end with a small plate of seasonal fruit.</p>',
    fallbackContent: '<p><strong>Morning Fruit Fact:</strong> Your taste buds are most sensitive between 10 AM and 1 PM. Professional fruit tasters in Japan schedule their yuzu evaluations during this window for maximum accuracy.</p>',
    evaluationMode: 'client',
  }));

  // 68. Code Playground
  blocks.push(B('code-playground', {
    language: 'javascript',
    code: `// Eastern Fruit Ripeness Calculator
function checkRipeness(fruit, daysSinceHarvest) {
  const lifespans = {
    mangosteen: 7,
    durian: 14,
    lychee: 5,
    rambutan: 6,
    longan: 10,
    jackfruit: 21,
    dragonFruit: 14,
    persimmon: 30
  };
  const max = lifespans[fruit] || 7;
  const freshness = Math.max(0, 100 - (daysSinceHarvest / max) * 100);
  return freshness > 80 ? "Eat now!" : 
         freshness > 50 ? "Still good" : 
         freshness > 20 ? "Use in cooking" : "Compost";
}

console.log(checkRipeness("mangosteen", 3));
console.log(checkRipeness("durian", 10));`,
    title: 'Fruit Freshness Calculator',
  }));

  // 69. H2 - Closing
  blocks.push(B('heading', { text: 'The Closing: A Fruit Changed My Life', level: 2 }));

  // 70. Closing paragraph
  blocks.push(B('text', {
    text: "I went back to that Bangkok night market last year. The same vendor was there, older now, still selling mangosteens from the same wicker basket. I bought one. Pressed the rind. Smelled the stem. Ate it standing there, juice running down my chin.\n\nAnd I realized: the fruit had not changed. I had. I had learned to pay attention. To smell before tasting. To wait for ripeness. To respect the season. To understand that every fruit is a geography, a history, a culture compressed into something you can hold in your hand.\n\nThat is what eastern fruits teach us. Not just how to eat, but how to be present. How to slow down. How to let something extraordinary unfold on its own terms.\n\nThe next time you hold a fruit — any fruit — pause. Ask yourself: Where did this come from? Who grew it? What story does it tell?\n\nThe answer might change your life. It changed mine.",
    marks: { bold: false, italic: false, underline: false, code: false }, align: 'left',
  }));

  // 71. Final embed
  blocks.push(B('embed', {
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    title: 'Fruit Markets of Asia: A Visual Journey',
    provider: 'youtube',
    aspectRatio: '16:9',
    allowFullscreen: true,
  }));

  return blocks;
}

async function createArticle() {
  await login();

  const blocks = makeBlocks();
  const excerpt = "A journey through Asia's most extraordinary fruits — from the frost-kissed yuzu groves of Japan to the pungent durian stalls of Bangkok. Discover fruits that shaped cultures, cuisines, and myths for millennia.";

  const payload = {
    contentTypeId: 'blog_post',
    title: "Eastern Fruits: Asia's Most Extraordinary Harvest",
    slug: 'eastern-fruits',
    status: 'draft',
    fieldValues: [
      { fieldId: 'excerpt', value: excerpt },
      { fieldId: 'eyebrow', value: 'Food & Travel' },
      { fieldId: 'author', value: 'Pulse Culinary Team' },
      { fieldId: 'tags', value: ['fruit', 'asia', 'travel', 'food', 'culture', 'tropical'] },
      { fieldId: 'featured', value: true },
      { fieldId: 'featuredImage', value: `${IMG_BASE}/hero-banner.png` },
      { fieldId: 'featuredImageAlt', value: 'A panoramic view of eastern fruits at a bustling Asian market' },
    ],
    blocks,
    metadata: {
      seoTitle: "Eastern Fruits: Asia's Most Extraordinary Harvest | Pulse",
      seoDescription: "An interactive journey through Asia's most extraordinary fruits. From yuzu to durian, discover the flavors that shaped cultures for millennia.",
      ogImage: `${IMG_BASE}/hero-banner.png`,
      canonicalUrl: '/blog/eastern-fruits',
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

  return { entryId, slug: 'eastern-fruits' };
}

createArticle()
  .then(result => {
    console.log('\nSUCCESS');
    console.log('Entry ID:', result.entryId);
    console.log('URL:', `${BASE_URL}/blog/${result.slug}`);
  })
  .catch(err => {
    console.error('\nFAILED:', err.message);
    process.exit(1);
  });
