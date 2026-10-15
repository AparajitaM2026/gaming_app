const fs = require('fs');
const db = require('../db');

async function updateAll() {
  const file1 = './parsed_games_57.json';
  const file2 = './public/parsed_games_57.json';

  [file1, file2].forEach(f => {
    if (fs.existsSync(f)) {
      const data = JSON.parse(fs.readFileSync(f, 'utf8'));
      data.forEach(g => {
        if (g.is_premium) {
          g.thumbnail = '/assets/posters/' + g.slug + '.svg';
        }
      });
      fs.writeFileSync(f, JSON.stringify(data, null, 2), 'utf8');
      console.log('Updated file:', f);
    }
  });

  // Update in Neon DB
  const res = await db.query("UPDATE games SET thumbnail = '/assets/posters/' || slug || '.svg' WHERE is_premium = true");
  console.log('Updated Neon DB rows:', res.rowCount);
  process.exit(0);
}

updateAll().catch(err => {
  console.error(err);
  process.exit(1);
});
