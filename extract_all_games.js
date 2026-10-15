const fs = require('fs');

const docXmlPath = 'C:\\Users\\DELL\\.gemini\\antigravity\\scratch\\docx_extracted\\word\\document.xml';
const docXml = fs.readFileSync(docXmlPath, 'utf8');

// The docx contains tables (<w:tbl>) with rows (<w:tr>) and cells (<w:tc>)
const rows = docXml.split(/<\/w:tr>/);
console.log(`Total table rows found: ${rows.length}`);

const games = [];

// Curated high quality gaming thumbnails by category & keyword
const thumbMap = {
  'snake': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=60',
  '2048': 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=60',
  'tetris': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60',
  'pong': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=60',
  'slope': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=60',
  'flappy': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60',
  'pacman': 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=500&auto=format&fit=crop&q=60',
  'space': 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=500&auto=format&fit=crop&q=60',
  'car': 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=500&auto=format&fit=crop&q=60',
  'racing': 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=500&auto=format&fit=crop&q=60',
  'chess': 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=500&auto=format&fit=crop&q=60',
  'checkers': 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=500&auto=format&fit=crop&q=60',
  'ludo': 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=500&auto=format&fit=crop&q=60',
  'sudoku': 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=60',
  'solitaire': 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=500&auto=format&fit=crop&q=60',
  'puzzle': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=60',
  'soccer': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=60',
  'football': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=60',
  'basketball': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&auto=format&fit=crop&q=60',
  'runner': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=60',
  'default': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=60'
};

function getThumbnail(title, cat) {
  const t = title.toLowerCase();
  for (const k of Object.keys(thumbMap)) {
    if (t.includes(k)) return thumbMap[k];
  }
  if (cat.includes('arcade')) return 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=500&auto=format&fit=crop&q=60';
  if (cat.includes('action')) return 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60';
  if (cat.includes('puzzle')) return 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60';
  if (cat.includes('sports')) return 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=60';
  return thumbMap.default;
}

function normalizeCategory(catStr) {
  const c = catStr.toLowerCase();
  if (c.includes('puzzle')) return 'puzzle';
  if (c.includes('sports') || c.includes('racing')) return 'sports';
  if (c.includes('action')) return 'action';
  if (c.includes('board') || c.includes('card')) return 'arcade';
  return 'arcade';
}

for (const row of rows) {
  // Extract cells in this row
  const cells = row.split(/<\/w:tc>/);
  if (cells.length < 4) continue;

  const cellTexts = cells.map(c => {
    const textMatches = c.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    return textMatches.map(t => t.replace(/<[^>]*>/g, '')).join('').trim();
  });

  // Expected columns: [#, Title, Category, Embed URL, Free]
  const num = cellTexts[0];
  const title = cellTexts[1];
  const categoryRaw = cellTexts[2];
  const url = cellTexts[3];

  if (num && !isNaN(parseInt(num)) && title && url && url.startsWith('http')) {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const category = normalizeCategory(categoryRaw);
    const thumbnail = getThumbnail(title, category);

    games.push({
      id: parseInt(num),
      slug,
      title,
      category,
      category_raw: categoryRaw,
      thumbnail,
      game_url: url,
      rating: (4.6 + Math.random() * 0.35).toFixed(1),
      plays_count: Math.floor(Math.random() * 15000 + 4000),
      is_featured: games.length < 6
    });
  }
}

console.log(`Successfully parsed ${games.length} games from docx!`);
fs.writeFileSync('D:\\projects\\gaming app\\parsed_games_57.json', JSON.stringify(games, null, 2));

console.log('Sample parsed games:');
console.log(games.slice(0, 5));
