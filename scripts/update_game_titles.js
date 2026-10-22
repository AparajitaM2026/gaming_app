const path = require('path');
const db = require(path.join(__dirname, '..', 'db'));

async function updateTitles() {
  // 1. Standard original user game titles
  const userOriginals = [
    { id: 43, title: 'Mahjong Solitaire' },
    { id: 51, title: 'Drive Fury' },
    { id: 73, title: 'Cars Arena 3D' },
    { id: 79, title: 'Om Nom Run 3D' },
    { id: 80, title: 'Om Nom Bubbles' },
    { id: 81, title: 'TNT Bomb 3D' },
    { id: 82, title: 'Cannon Balls 3D' },
    { id: 83, title: 'Tower Crash 3D' },
    { id: 84, title: 'Drift Cup Racing' },
    { id: 87, title: '8 Ball Billiards Classic' }
  ];

  for (const g of userOriginals) {
    await db.query('UPDATE games SET title = $1 WHERE id = $2', [g.title, g.id]);
    console.log(`Updated ID ${g.id} -> ${g.title}`);
  }

  // 2. VIP OTT games with official OTT naming
  const ottGames = [
    { id: 88, title: 'OTT Low-Poly Speedster' },
    { id: 89, title: 'OTT Turbo Drift Unleashed' },
    { id: 90, title: 'OTT Striker King 3D' },
    { id: 91, title: 'OTT Power Puck Hockey' },
    { id: 92, title: 'OTT Vector Arena Shooter' },
    { id: 93, title: 'OTT Lost Tomb Runner' },
    { id: 94, title: 'OTT Pond Rescue IO' },
    { id: 95, title: 'OTT ZigZag Drift King' },
    { id: 96, title: 'OTT Pro Billiards 3D' },
    { id: 97, title: 'OTT Stack Smash 3D' },
    { id: 98, title: 'OTT Cannon Target Smash' },
    { id: 99, title: 'OTT Wipeout Dash 3D' },
    { id: 100, title: 'OTT Garden Tile Match' },
    { id: 101, title: 'OTT Bubble Column Match' },
    { id: 102, title: 'OTT TNT Demolition' }
  ];

  for (const g of ottGames) {
    await db.query('UPDATE games SET title = $1 WHERE id = $2', [g.title, g.id]);
    console.log(`Updated VIP ID ${g.id} -> ${g.title}`);
  }

  console.log('All titles updated successfully!');
  process.exit(0);
}

updateTitles().catch(err => {
  console.error(err);
  process.exit(1);
});
