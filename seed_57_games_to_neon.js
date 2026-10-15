const fs = require('fs');
const db = require('./db');

async function seedGames() {
  try {
    const rawGames = JSON.parse(fs.readFileSync('D:\\projects\\gaming app\\parsed_games_57.json', 'utf8'));
    console.log(`Loading ${rawGames.length} games into Neon DB...`);

    // Clear old catalog to avoid duplicate placeholders
    await db.query(`DELETE FROM games;`);

    // 1. First add Ludo Hero vs Smart AI as Featured #1
    await db.query(`
      INSERT INTO games (slug, title, category, thumbnail, game_url, is_multiplayer, min_players, max_players, entry_fee_coins, orientation, rating, plays_count, is_featured)
      VALUES (
        'ludo-hero-ai',
        'Ludo Hero (vs Smart AI)',
        'arcade',
        'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=500&auto=format&fit=crop&q=60',
        '/games/ludo_ai.html',
        false,
        1,
        1,
        0,
        'portrait',
        4.9,
        24500,
        true
      );
    `);
    console.log(" Added featured Ludo Hero (vs AI).");

    // 2. Insert all 57 games from the catalog docx
    for (const g of rawGames) {
      await db.query(`
        INSERT INTO games (slug, title, category, thumbnail, game_url, is_multiplayer, min_players, max_players, entry_fee_coins, orientation, rating, plays_count, is_featured)
        VALUES ($1, $2, $3, $4, $5, false, 1, 1, 0, 'portrait', $6, $7, $8)
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          thumbnail = EXCLUDED.thumbnail,
          game_url = EXCLUDED.game_url,
          rating = EXCLUDED.rating,
          plays_count = EXCLUDED.plays_count,
          is_featured = EXCLUDED.is_featured;
      `, [
        g.slug,
        g.title,
        g.category,
        g.thumbnail,
        g.game_url,
        parseFloat(g.rating),
        g.plays_count,
        g.is_featured
      ]);
    }

    const countRes = await db.query(`SELECT COUNT(*) FROM games;`);
    console.log(`Total games now live in Neon Database: ${countRes.rows[0].count}`);
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seedGames();
