const db = require('./db');

async function addLudoToCatalog() {
  try {
    console.log("Adding Ludo Hero (Play vs AI) to Neon DB...");
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
        18500,
        true
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        game_url = EXCLUDED.game_url,
        is_featured = true;
    `);
    console.log("Ludo Hero (vs AI) added to games catalog!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to add Ludo:", err);
    process.exit(1);
  }
}

addLudoToCatalog();
