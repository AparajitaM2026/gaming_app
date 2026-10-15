const fs = require('fs');
const path = require('path');

const postersDir = path.join(__dirname, '..', 'public', 'assets', 'posters');
if (!fs.existsSync(postersDir)) {
  fs.mkdirSync(postersDir, { recursive: true });
}

const vipPosters = [
  {
    slug: 'low-poly-speedster',
    bg: ['#0f051d', '#05020a'],
    grid: '#a855f7',
    glow: '#8b5cf6',
    art: `
      <!-- 3D Poly Tunnel / Spaceship -->
      <polygon points='150,55 215,190 150,170 85,190' fill='#a855f7' stroke='#e9d5ff' stroke-width='3' filter='url(#glow)'/>
      <polygon points='150,55 150,170 85,190' fill='#7c3aed' opacity='0.85'/>
      <polygon points='150,55 215,190 150,170' fill='#c084fc' opacity='0.9'/>
      <!-- Cockpit Core -->
      <polygon points='150,95 165,145 150,140 135,145' fill='#38bdf8' filter='url(#brightGlow)'/>
      <!-- Thruster Exhaust -->
      <polygon points='150,170 162,235 150,215 138,235' fill='#06b6d4' opacity='0.9' filter='url(#brightGlow)'/>
      <polygon points='150,175 156,250 150,230 144,250' fill='#f43f5e' filter='url(#brightGlow)'/>
      <!-- Speed Tunnel Rings -->
      <polygon points='150,25 265,260 35,260' fill='none' stroke='#c084fc' stroke-width='2' stroke-dasharray='12 8' opacity='0.4'/>
      <polygon points='150,45 225,230 75,230' fill='none' stroke='#06b6d4' stroke-width='2' opacity='0.3'/>
    `
  },
  {
    slug: 'turbo-drift-unleashed',
    bg: ['#200808', '#0d0202'],
    grid: '#ef4444',
    glow: '#f97316',
    art: `
      <!-- Burning Drift Car -->
      <ellipse cx='150' cy='210' rx='105' ry='36' fill='none' stroke='#f97316' stroke-width='4' stroke-dasharray='10 6' filter='url(#glow)'/>
      <!-- Skid Flame Trails -->
      <path d='M60 210 Q 110 190 160 215' fill='none' stroke='#ef4444' stroke-width='6' stroke-linecap='round' opacity='0.8'/>
      <path d='M80 220 Q 130 200 190 225' fill='none' stroke='#eab308' stroke-width='4' stroke-linecap='round' opacity='0.9'/>
      <!-- Supercar Silhouette -->
      <rect x='105' y='140' width='90' height='46' rx='12' fill='#dc2626' stroke='#fecaca' stroke-width='2' filter='url(#glow)'/>
      <polygon points='122,140 138,112 178,112 188,140' fill='#09090b' stroke='#f87171' stroke-width='2'/>
      <rect x='134' y='118' width='38' height='18' rx='4' fill='#38bdf8' opacity='0.85'/>
      <!-- Dual Racing Wheels -->
      <circle cx='122' cy='186' r='16' fill='#18181b' stroke='#f59e0b' stroke-width='4'/>
      <circle cx='178' cy='186' r='16' fill='#18181b' stroke='#f59e0b' stroke-width='4'/>
      <!-- Turbo Flames from exhaust -->
      <path d='M98 160 Q 70 155 60 162 Q 72 168 98 166' fill='#f97316' filter='url(#brightGlow)'/>
      <circle cx='55' cy='162' r='8' fill='#fde047' filter='url(#brightGlow)'/>
    `
  },
  {
    slug: 'striker-king-3d',
    bg: ['#041a12', '#020b08'],
    grid: '#10b981',
    glow: '#10b981',
    art: `
      <!-- Goal Net Wireframe -->
      <path d='M50 100 L250 100 L230 210 L70 210 Z' fill='none' stroke='#34d399' stroke-width='2' stroke-dasharray='6 6' opacity='0.35'/>
      <line x1='50' y1='100' x2='250' y2='100' stroke='#ecfdf5' stroke-width='4'/>
      <!-- Burning Golden Soccer Ball -->
      <circle cx='150' cy='150' r='54' fill='#fef08a' stroke='#eab308' stroke-width='3' filter='url(#glow)'/>
      <circle cx='150' cy='150' r='52' fill='none' stroke='#1e293b' stroke-width='3'/>
      <!-- Soccer Hexagon Pattern -->
      <polygon points='150,132 165,142 160,160 140,160 135,142' fill='#0f172a'/>
      <polygon points='150,110 158,118 142,118' fill='#0f172a'/>
      <polygon points='180,130 188,142 178,146' fill='#0f172a'/>
      <polygon points='120,130 112,142 122,146' fill='#0f172a'/>
      <!-- Motion Comet Streaks -->
      <path d='M100 150 C70 140 50 170 30 160' fill='none' stroke='#f59e0b' stroke-width='5' stroke-linecap='round' filter='url(#brightGlow)'/>
      <path d='M110 170 C80 180 60 195 40 190' fill='none' stroke='#10b981' stroke-width='4' stroke-linecap='round'/>
      <polygon points='200,95 215,80 230,100' fill='#fde047' filter='url(#brightGlow)'/>
    `
  },
  {
    slug: 'power-puck-hockey',
    bg: ['#041226', '#020713'],
    grid: '#0ea5e9',
    glow: '#0284c7',
    art: `
      <!-- Air Hockey Rink Neon Ring -->
      <ellipse cx='150' cy='150' rx='95' ry='65' fill='none' stroke='#0284c7' stroke-width='3' opacity='0.5'/>
      <line x1='150' y1='85' x2='150' y2='215' stroke='#ef4444' stroke-width='3' stroke-dasharray='8 6'/>
      <!-- Striker Mallet -->
      <circle cx='105' cy='140' r='36' fill='#ef4444' stroke='#fee2e2' stroke-width='3' filter='url(#glow)'/>
      <circle cx='105' cy='140' r='18' fill='#991b1b'/>
      <!-- Glowing Blue Puck -->
      <circle cx='175' cy='160' r='26' fill='#38bdf8' stroke='#e0f2fe' stroke-width='3' filter='url(#brightGlow)'/>
      <circle cx='175' cy='160' r='14' fill='#0284c7'/>
      <!-- Impact Shockwave -->
      <circle cx='175' cy='160' r='38' fill='none' stroke='#38bdf8' stroke-width='2' opacity='0.6'/>
      <path d='M145 130 L185 170' stroke='#f8fafc' stroke-width='3' stroke-linecap='round' filter='url(#brightGlow)'/>
    `
  },
  {
    slug: 'vector-arena-shooter',
    bg: ['#051515', '#010909'],
    grid: '#14b8a6',
    glow: '#2dd4bf',
    art: `
      <!-- Retro Vector Starship -->
      <polygon points='150,65 195,200 150,175 105,200' fill='none' stroke='#2dd4bf' stroke-width='4' filter='url(#glow)'/>
      <polygon points='150,90 180,185 150,165 120,185' fill='none' stroke='#5eead4' stroke-width='2'/>
      <line x1='150' y1='65' x2='150' y2='175' stroke='#f0fdfa' stroke-width='2'/>
      <!-- Dual Laser Beams -->
      <line x1='130' y1='65' x2='130' y2='25' stroke='#f43f5e' stroke-width='4' stroke-linecap='round' filter='url(#brightGlow)'/>
      <line x1='170' y1='65' x2='170' y2='25' stroke='#f43f5e' stroke-width='4' stroke-linecap='round' filter='url(#brightGlow)'/>
      <!-- Vector Enemy Polygon -->
      <polygon points='150,220 180,245 150,270 120,245' fill='none' stroke='#f59e0b' stroke-width='3' stroke-dasharray='4 4'/>
      <circle cx='150' cy='245' r='6' fill='#ef4444' filter='url(#glow)'/>
    `
  },
  {
    slug: 'lost-tomb-runner',
    bg: ['#211202', '#0c0601'],
    grid: '#d97706',
    glow: '#f59e0b',
    art: `
      <!-- Ancient Golden Aztec/Tomb Idol -->
      <rect x='100' y='90' width='100' height='115' rx='14' fill='#b45309' stroke='#fde68a' stroke-width='3' filter='url(#glow)'/>
      <!-- Idol Face Carvings -->
      <rect x='118' y='115' width='22' height='16' rx='3' fill='#fef08a'/>
      <rect x='160' y='115' width='22' height='16' rx='3' fill='#fef08a'/>
      <polygon points='150,135 158,155 142,155' fill='#78350f'/>
      <rect x='128' y='165' width='44' height='14' rx='4' fill='#78350f' stroke='#fef08a' stroke-width='1.5'/>
      <!-- Temple Pillars -->
      <rect x='60' y='80' width='24' height='140' fill='#78350f' stroke='#d97706' stroke-width='2'/>
      <rect x='216' y='80' width='24' height='140' fill='#78350f' stroke='#d97706' stroke-width='2'/>
      <!-- Blazing Torch Flames -->
      <circle cx='72' cy='70' r='14' fill='#ea580c' filter='url(#brightGlow)'/>
      <circle cx='228' cy='70' r='14' fill='#ea580c' filter='url(#brightGlow)'/>
      <circle cx='72' cy='70' r='7' fill='#fef08a'/>
      <circle cx='228' cy='70' r='7' fill='#fef08a'/>
    `
  },
  {
    slug: 'pond-rescue-io',
    bg: ['#021b1b', '#010c0c'],
    grid: '#06b6d4',
    glow: '#22d3ee',
    art: `
      <!-- Water Ripples -->
      <ellipse cx='150' cy='150' rx='95' ry='55' fill='none' stroke='#0891b2' stroke-width='3' opacity='0.6'/>
      <ellipse cx='150' cy='150' rx='70' ry='38' fill='none' stroke='#22d3ee' stroke-width='2' opacity='0.8'/>
      <!-- Floating Lily Pad -->
      <ellipse cx='150' cy='150' rx='58' ry='32' fill='#059669' stroke='#6ee7b7' stroke-width='3' filter='url(#glow)'/>
      <polygon points='150,150 175,130 185,145' fill='#021b1b'/>
      <!-- Golden Duckling / Rescued Creature -->
      <circle cx='140' cy='135' r='18' fill='#facc15' stroke='#ca8a04' stroke-width='2' filter='url(#brightGlow)'/>
      <circle cx='154' cy='124' r='12' fill='#fde047' stroke='#ca8a04' stroke-width='2'/>
      <polygon points='164,124 175,127 164,130' fill='#f97316'/>
      <circle cx='156' cy='121' r='2.5' fill='#000'/>
      <!-- Sparkling Rescue Star -->
      <polygon points='195,95 200,108 214,110 203,119 206,132 195,124 184,132 187,119 176,110 190,108' fill='#fef08a' filter='url(#brightGlow)'/>
    `
  },
  {
    slug: 'zigzag-drift-king',
    bg: ['#1c0c26', '#09030e'],
    grid: '#c084fc',
    glow: '#a855f7',
    art: `
      <!-- 3D Isometric Zigzag Track -->
      <path d='M60 230 L110 180 L190 220 L240 170 L190 120 L230 80' fill='none' stroke='#a855f7' stroke-width='24' stroke-linecap='round' stroke-linejoin='round' opacity='0.4'/>
      <path d='M60 230 L110 180 L190 220 L240 170 L190 120 L230 80' fill='none' stroke='#e9d5ff' stroke-width='16' stroke-linecap='round' stroke-linejoin='round' filter='url(#glow)'/>
      <!-- Drift Racer Cube / Car -->
      <polygon points='190,120 215,105 215,125 190,140' fill='#ec4899'/>
      <polygon points='190,120 165,105 165,125 190,140' fill='#db2777'/>
      <polygon points='190,120 215,105 190,90 165,105' fill='#f472b6' stroke='#fdf2f8' stroke-width='2' filter='url(#brightGlow)'/>
      <!-- Drift Sparkles -->
      <circle cx='150' cy='125' r='6' fill='#fde047' filter='url(#brightGlow)'/>
      <circle cx='140' cy='135' r='4' fill='#38bdf8'/>
    `
  },
  {
    slug: 'pro-billiards-3d',
    bg: ['#021b10', '#010c07'],
    grid: '#10b981',
    glow: '#059669',
    art: `
      <!-- Billiards Table Pocket & Surface -->
      <ellipse cx='150' cy='150' rx='105' ry='68' fill='#047857' stroke='#065f46' stroke-width='8' filter='url(#glow)'/>
      <ellipse cx='150' cy='150' rx='98' ry='62' fill='none' stroke='#34d399' stroke-width='2' opacity='0.6'/>
      <!-- Iconic 8-Ball -->
      <circle cx='130' cy='145' r='28' fill='#09090b' stroke='#27272a' stroke-width='2' filter='url(#glow)'/>
      <circle cx='130' cy='145' r='13' fill='#ffffff'/>
      <text x='130' y='150' font-size='14' font-weight='900' fill='#000000' text-anchor='middle' font-family='Arial, sans-serif'>8</text>
      <!-- Cue Ball (White) -->
      <circle cx='185' cy='165' r='24' fill='#f8fafc' stroke='#cbd5e1' stroke-width='2' filter='url(#brightGlow)'/>
      <!-- Cue Stick -->
      <line x1='245' y1='215' x2='205' y2='180' stroke='#d97706' stroke-width='7' stroke-linecap='round'/>
      <line x1='205' y1='180' x2='195' y2='172' stroke='#38bdf8' stroke-width='5' stroke-linecap='round'/>
    `
  },
  {
    slug: 'stack-smash-3d',
    bg: ['#220606', '#0e0202'],
    grid: '#f43f5e',
    glow: '#fb7185',
    art: `
      <!-- 3D Helix Center Pillar -->
      <rect x='138' y='50' width='24' height='200' rx='6' fill='#18181b' stroke='#52525b' stroke-width='2'/>
      <!-- Stack Platforms -->
      <ellipse cx='150' cy='190' rx='80' ry='22' fill='#e11d48' stroke='#fda4af' stroke-width='3' filter='url(#glow)'/>
      <ellipse cx='150' cy='150' rx='80' ry='22' fill='#ea580c' stroke='#fed7aa' stroke-width='3' filter='url(#glow)'/>
      <ellipse cx='150' cy='110' rx='80' ry='22' fill='#eab308' stroke='#fef08a' stroke-width='3' filter='url(#glow)'/>
      <!-- Smash Ball -->
      <circle cx='150' cy='75' r='22' fill='#38bdf8' stroke='#e0f2fe' stroke-width='3' filter='url(#brightGlow)'/>
      <!-- Debris Blast Particles -->
      <circle cx='110' cy='140' r='6' fill='#f97316' filter='url(#brightGlow)'/>
      <circle cx='195' cy='155' r='8' fill='#e11d48' filter='url(#brightGlow)'/>
      <polygon points='95,115 105,105 110,120' fill='#fde047'/>
    `
  },
  {
    slug: 'cannon-target-smash',
    bg: ['#1c1005', '#0a0501'],
    grid: '#f59e0b',
    glow: '#ea580c',
    art: `
      <!-- Heavy Iron Cannon Barrel -->
      <polygon points='90,195 160,115 185,135 115,215' fill='#27272a' stroke='#71717a' stroke-width='3' filter='url(#glow)'/>
      <ellipse cx='172' cy='125' rx='18' ry='12' fill='#09090b' stroke='#ea580c' stroke-width='3' transform='rotate(-40 172 125)'/>
      <!-- Wheels / Base Mount -->
      <circle cx='95' cy='210' r='26' fill='#78350f' stroke='#d97706' stroke-width='4'/>
      <circle cx='95' cy='210' r='9' fill='#1c1917'/>
      <!-- Cannonball In Flight -->
      <circle cx='215' cy='85' r='20' fill='#18181b' stroke='#fca5a5' stroke-width='2' filter='url(#brightGlow)'/>
      <!-- Muzzle Flash & Target Explosion -->
      <circle cx='185' cy='110' r='20' fill='#ea580c' opacity='0.7' filter='url(#brightGlow)'/>
      <circle cx='185' cy='110' r='10' fill='#fde047'/>
      <!-- Target BullsEye -->
      <circle cx='255' cy='65' r='24' fill='none' stroke='#ef4444' stroke-width='4'/>
      <circle cx='255' cy='65' r='12' fill='#ef4444'/>
    `
  },
  {
    slug: 'wipeout-dash-3d',
    bg: ['#041a22', '#01090d'],
    grid: '#06b6d4',
    glow: '#0891b2',
    art: `
      <!-- Curved Anti-Gravity Race Tube -->
      <ellipse cx='150' cy='170' rx='110' ry='48' fill='none' stroke='#06b6d4' stroke-width='4' stroke-dasharray='14 8' filter='url(#glow)'/>
      <path d='M45 170 C90 120 210 120 255 170' fill='none' stroke='#38bdf8' stroke-width='6' stroke-linecap='round'/>
      <!-- AG Hover Craft -->
      <polygon points='150,90 190,170 150,155 110,170' fill='#0284c7' stroke='#bae6fd' stroke-width='3' filter='url(#glow)'/>
      <polygon points='150,105 170,160 150,150 130,160' fill='#38bdf8'/>
      <!-- Jet Engine Thruster Trails -->
      <polygon points='130,160 125,195 135,185' fill='#ec4899' filter='url(#brightGlow)'/>
      <polygon points='170,160 175,195 165,185' fill='#ec4899' filter='url(#brightGlow)'/>
      <!-- Boost Speed Rings -->
      <circle cx='150' cy='90' r='28' fill='none' stroke='#f43f5e' stroke-width='3' opacity='0.7'/>
    `
  },
  {
    slug: 'garden-tile-match',
    bg: ['#051c0e', '#010d06'],
    grid: '#22c55e',
    glow: '#16a34a',
    art: `
      <!-- Garden Mahjong Gem Tiles -->
      <rect x='85' y='105' width='58' height='72' rx='10' fill='#14532d' stroke='#86efac' stroke-width='3' filter='url(#glow)'/>
      <rect x='155' y='105' width='58' height='72' rx='10' fill='#14532d' stroke='#86efac' stroke-width='3' filter='url(#glow)'/>
      <!-- Flower & Fruit Icons inside tiles -->
      <!-- Left: Radiant Lotus Flower -->
      <circle cx='114' cy='141' r='14' fill='#ec4899' filter='url(#brightGlow)'/>
      <circle cx='114' cy='141' r='6' fill='#fde047'/>
      <!-- Right: Emerald Clover Leaf -->
      <circle cx='184' cy='133' r='10' fill='#4ade80'/>
      <circle cx='176' cy='147' r='10' fill='#4ade80'/>
      <circle cx='192' cy='147' r='10' fill='#4ade80'/>
      <circle cx='184' cy='143' r='5' fill='#166534'/>
      <!-- Floating Leaves & Sparkles -->
      <path d='M75 90 Q90 80 85 65 Q70 75 75 90' fill='#86efac' filter='url(#brightGlow)'/>
      <circle cx='225' cy='95' r='5' fill='#fde047' filter='url(#brightGlow)'/>
    `
  },
  {
    slug: 'bubble-column-match',
    bg: ['#170624', '#09020f'],
    grid: '#d946ef',
    glow: '#c026d3',
    art: `
      <!-- Column Tubes -->
      <rect x='85' y='75' width='40' height='155' rx='20' fill='#3b0764' stroke='#e879f9' stroke-width='2' opacity='0.7'/>
      <rect x='130' y='75' width='40' height='155' rx='20' fill='#3b0764' stroke='#e879f9' stroke-width='2' opacity='0.7'/>
      <rect x='175' y='75' width='40' height='155' rx='20' fill='#3b0764' stroke='#e879f9' stroke-width='2' opacity='0.7'/>
      <!-- Stacked Glowing Bubbles -->
      <circle cx='105' cy='195' r='16' fill='#ec4899' stroke='#fbcfe8' stroke-width='2' filter='url(#glow)'/>
      <circle cx='105' cy='155' r='16' fill='#ec4899' stroke='#fbcfe8' stroke-width='2' filter='url(#glow)'/>
      <circle cx='150' cy='195' r='16' fill='#06b6d4' stroke='#cffafe' stroke-width='2' filter='url(#glow)'/>
      <circle cx='150' cy='155' r='16' fill='#a855f7' stroke='#f3e8ff' stroke-width='2' filter='url(#glow)'/>
      <circle cx='150' cy='115' r='16' fill='#a855f7' stroke='#f3e8ff' stroke-width='2' filter='url(#glow)'/>
      <circle cx='195' cy='195' r='16' fill='#eab308' stroke='#fef9c3' stroke-width='2' filter='url(#glow)'/>
      <!-- Bubble highlights -->
      <circle cx='100' cy='190' r='4' fill='#fff' opacity='0.8'/>
      <circle cx='145' cy='110' r='4' fill='#fff' opacity='0.8'/>
    `
  },
  {
    slug: 'tnt-demolition',
    bg: ['#220902', '#0c0300'],
    grid: '#ea580c',
    glow: '#dc2626',
    art: `
      <!-- Red Dynamite Bundle -->
      <rect x='90' y='125' width='26' height='75' rx='5' fill='#dc2626' stroke='#fca5a5' stroke-width='2' filter='url(#glow)'/>
      <rect x='120' y='120' width='26' height='80' rx='5' fill='#ef4444' stroke='#fee2e2' stroke-width='2' filter='url(#glow)'/>
      <rect x='150' y='120' width='26' height='80' rx='5' fill='#ef4444' stroke='#fee2e2' stroke-width='2' filter='url(#glow)'/>
      <rect x='180' y='125' width='26' height='75' rx='5' fill='#dc2626' stroke='#fca5a5' stroke-width='2' filter='url(#glow)'/>
      <!-- Yellow TNT Label Band -->
      <rect x='85' y='145' width='126' height='26' rx='3' fill='#facc15' stroke='#1c1917' stroke-width='1.5'/>
      <text x='148' y='163' font-size='16' font-weight='900' fill='#000000' text-anchor='middle' font-family='Arial Black, sans-serif' letter-spacing='2'>TNT</text>
      <!-- Sparking Fuse Wire -->
      <path d='M133 120 Q145 95 160 85' fill='none' stroke='#f59e0b' stroke-width='3'/>
      <!-- Sizzling Fuse Spark -->
      <circle cx='162' cy='83' r='12' fill='#ea580c' filter='url(#brightGlow)'/>
      <circle cx='162' cy='83' r='6' fill='#fef08a'/>
      <polygon points='162,65 166,77 178,79 168,88 171,100 162,93 153,100 156,88 146,79 158,77' fill='#fde047' filter='url(#brightGlow)'/>
    `
  }
];

vipPosters.forEach(p => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.bg[0]}" />
      <stop offset="100%" stop-color="${p.bg[1]}" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="brightGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 2 0" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="${p.grid}" stroke-width="1" stroke-opacity="0.15" />
    </pattern>
  </defs>

  <!-- Background Layer -->
  <rect width="300" height="300" fill="url(#bgGrad)" />
  <rect width="300" height="300" fill="url(#gridPattern)" />
  <circle cx="150" cy="150" r="110" fill="${p.glow}" opacity="0.16" filter="url(#brightGlow)" />

  <!-- VIP Crown Badge Accent on Artwork -->
  <g transform="translate(242, 18) scale(0.7)">
    <polygon points="12,0 16,10 24,4 20,20 4,20 0,4 8,10" fill="#eab308" filter="url(#brightGlow)"/>
  </g>

  <!-- High-Def Custom 3D Vector Art -->
  <g transform="translate(0, 0)">
    ${p.art}
  </g>
</svg>`;

  fs.writeFileSync(path.join(postersDir, p.slug + '.svg'), svg, 'utf8');
  console.log('Created poster:', p.slug + '.svg');
});

console.log('Successfully generated all 15 VIP posters!');
