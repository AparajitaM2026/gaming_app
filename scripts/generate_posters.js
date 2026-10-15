const fs = require('fs');
const path = require('path');

const postersDir = path.join(__dirname, '..', 'public', 'assets', 'posters');
if (!fs.existsSync(postersDir)) {
  fs.mkdirSync(postersDir, { recursive: true });
}

// 63 100% Unique Themed Hero Artworks — Zero generic fallbacks!
const HERO_ART = {
  // 1. Classic Snake
  'classic-snake': {
    theme: 'emerald',
    renderArt: () => `
      <g filter="url(#glow)">
        <path d="M30 60 H270 M30 110 H270 M30 160 H270 M30 210 H270 M30 260 H270" stroke="#10b981" stroke-opacity="0.15" stroke-dasharray="4 4" />
        <path d="M60 30 V290 M110 30 V290 M160 30 V290 M210 30 V290 M260 30 V290" stroke="#10b981" stroke-opacity="0.15" stroke-dasharray="4 4" />
        <path d="M60 240 H180 V150 H100 V90 H220" fill="none" stroke="#059669" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M60 240 H180 V150 H100 V90 H220" fill="none" stroke="#10b981" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M60 240 H180 V150 H100 V90 H220" fill="none" stroke="#6ee7b7" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="225" cy="90" r="16" fill="#34d399" />
        <circle cx="225" cy="84" r="4" fill="#064e3b" /><circle cx="225" cy="96" r="4" fill="#064e3b" />
        <path d="M241 90 H254 L260 85 M254 90 L260 95" stroke="#ef4444" stroke-width="3.5" stroke-linecap="round" />
        <circle cx="140" cy="240" r="12" fill="#ef4444" filter="url(#brightGlow)" />
        <circle cx="137" cy="237" r="4" fill="#fca5a5" />
      </g>`
  },

  // 2. 2048 Galaxy
  '2048-galaxy': {
    theme: 'amber',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="35" y="55" width="65" height="65" rx="14" fill="#291807" stroke="#78350f" stroke-width="2" />
        <text x="67" y="97" font-family="'Orbitron', sans-serif" font-weight="900" font-size="24" fill="#d97706" text-anchor="middle">512</text>
        <rect x="110" y="55" width="65" height="65" rx="14" fill="#451a03" stroke="#92400e" stroke-width="2" />
        <text x="142" y="97" font-family="'Orbitron', sans-serif" font-weight="900" font-size="22" fill="#f59e0b" text-anchor="middle">1024</text>
        <rect x="185" y="55" width="65" height="65" rx="14" fill="#291807" stroke="#78350f" stroke-width="2" />
        <text x="217" y="97" font-family="'Orbitron', sans-serif" font-weight="900" font-size="26" fill="#fbbf24" text-anchor="middle">256</text>
        <rect x="55" y="140" width="190" height="130" rx="22" fill="url(#goldGradient)" stroke="#fef08a" stroke-width="4" filter="url(#brightGlow)" />
        <text x="150" y="222" font-family="'Orbitron', sans-serif" font-weight="950" font-size="52" fill="#451a03" text-anchor="middle" letter-spacing="2">2048</text>
      </g>`
  },

  // 3. Tetris
  'tetris': {
    theme: 'cyber',
    renderArt: () => `
      <g filter="url(#glow)">
        <path d="M40 50 H260 M40 100 H260 M40 150 H260 M40 200 H260 M40 250 H260" stroke="#00f0ff" stroke-opacity="0.1" />
        <rect x="45" y="65" width="35" height="35" rx="6" fill="#00f0ff" stroke="#a5f3fc" stroke-width="2" />
        <rect x="83" y="65" width="35" height="35" rx="6" fill="#00f0ff" stroke="#a5f3fc" stroke-width="2" />
        <rect x="121" y="65" width="35" height="35" rx="6" fill="#00f0ff" stroke="#a5f3fc" stroke-width="2" />
        <rect x="159" y="65" width="35" height="35" rx="6" fill="#00f0ff" stroke="#a5f3fc" stroke-width="2" />
        <rect x="140" y="125" width="36" height="36" rx="6" fill="#e879f9" stroke="#f5d0fe" stroke-width="2" />
        <rect x="102" y="163" width="36" height="36" rx="6" fill="#e879f9" stroke="#f5d0fe" stroke-width="2" />
        <rect x="140" y="163" width="36" height="36" rx="6" fill="#e879f9" stroke="#f5d0fe" stroke-width="2" />
        <rect x="178" y="163" width="36" height="36" rx="6" fill="#e879f9" stroke="#f5d0fe" stroke-width="2" />
        <rect x="205" y="205" width="36" height="36" rx="6" fill="#facc15" stroke="#fef08a" stroke-width="2" />
        <rect x="243" y="205" width="36" height="36" rx="6" fill="#facc15" stroke="#fef08a" stroke-width="2" />
        <rect x="205" y="243" width="36" height="36" rx="6" fill="#facc15" stroke="#fef08a" stroke-width="2" />
        <rect x="243" y="243" width="36" height="36" rx="6" fill="#facc15" stroke="#fef08a" stroke-width="2" />
      </g>`
  },

  // 4. Slope
  'slope': {
    theme: 'speed',
    renderArt: () => `
      <g filter="url(#glow)">
        <polygon points="150,70 135,270 165,270" fill="#0284c7" opacity="0.3" />
        <line x1="150" y1="70" x2="20" y2="280" stroke="#00f0ff" stroke-width="3" />
        <line x1="150" y1="70" x2="280" y2="280" stroke="#00f0ff" stroke-width="3" />
        <line x1="130" y1="110" x2="170" y2="110" stroke="#10b981" stroke-width="2" />
        <line x1="100" y1="150" x2="200" y2="150" stroke="#10b981" stroke-width="3" />
        <line x1="60" y1="200" x2="240" y2="200" stroke="#10b981" stroke-width="4" />
        <line x1="30" y1="260" x2="270" y2="260" stroke="#10b981" stroke-width="5" />
        <polygon points="165,180 195,180 210,200 175,200" fill="#ef4444" stroke="#f87171" stroke-width="2" />
        <circle cx="150" cy="140" r="30" fill="url(#cyanSphere)" filter="url(#brightGlow)" />
        <circle cx="140" cy="130" r="10" fill="#ffffff" opacity="0.8" />
        <path d="M150 110 V50" stroke="#00f0ff" stroke-width="5" stroke-dasharray="10 8" />
      </g>`
  },

  // 5. Pong
  'pong': {
    theme: 'cyber',
    renderArt: () => `
      <g filter="url(#glow)">
        <line x1="150" y1="40" x2="150" y2="280" stroke="#ffffff" stroke-width="4" stroke-dasharray="14 14" opacity="0.3" />
        <rect x="35" y="100" width="16" height="85" rx="8" fill="#00f0ff" filter="url(#brightGlow)" />
        <rect x="249" y="130" width="16" height="85" rx="8" fill="#f43f5e" filter="url(#brightGlow)" />
        <path d="M55 140 Q 140 120 220 165" fill="none" stroke="#facc15" stroke-width="3" stroke-dasharray="6 6" opacity="0.7" />
        <circle cx="225" cy="168" r="14" fill="#ffffff" filter="url(#brightGlow)" />
      </g>`
  },

  // 6. Brick Breaker
  'brick-breaker': {
    theme: 'fire',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="30" y="60" width="44" height="18" rx="4" fill="#ef4444" />
        <rect x="80" y="60" width="44" height="18" rx="4" fill="#ef4444" />
        <rect x="130" y="60" width="44" height="18" rx="4" fill="#ef4444" />
        <rect x="180" y="60" width="44" height="18" rx="4" fill="#ef4444" />
        <rect x="230" y="60" width="44" height="18" rx="4" fill="#ef4444" />
        <rect x="30" y="84" width="44" height="18" rx="4" fill="#f59e0b" />
        <rect x="80" y="84" width="44" height="18" rx="4" fill="#f59e0b" />
        <rect x="180" y="84" width="44" height="18" rx="4" fill="#f59e0b" />
        <rect x="230" y="84" width="44" height="18" rx="4" fill="#f59e0b" />
        <rect x="30" y="108" width="44" height="18" rx="4" fill="#10b981" />
        <rect x="80" y="108" width="44" height="18" rx="4" fill="#10b981" />
        <rect x="130" y="108" width="44" height="18" rx="4" fill="#10b981" />
        <circle cx="140" cy="150" r="14" fill="#ffffff" filter="url(#brightGlow)" />
        <rect x="95" y="245" width="110" height="20" rx="10" fill="url(#cyanSphere)" stroke="#ffffff" stroke-width="2" filter="url(#brightGlow)" />
      </g>`
  },

  // 7. T-Rex Dino Runner
  't-rex-dino-runner': {
    theme: 'amber',
    renderArt: () => `
      <g filter="url(#glow)">
        <circle cx="150" cy="110" r="58" fill="url(#goldGradient)" filter="url(#brightGlow)" />
        <line x1="80" y1="110" x2="220" y2="110" stroke="#080c18" stroke-width="3" />
        <line x1="90" y1="125" x2="210" y2="125" stroke="#080c18" stroke-width="4" />
        <line x1="105" y1="140" x2="195" y2="140" stroke="#080c18" stroke-width="5" />
        <line x1="20" y1="230" x2="280" y2="230" stroke="#f59e0b" stroke-width="3.5" />
        <path d="M60 170 H80 V145 H110 V125 H145 V150 H125 V175 H115 V200 H105 V230 H95 V210 H85 V230 H75 V195 H60 Z" fill="#22d3ee" filter="url(#brightGlow)" />
        <path d="M210 230 V175 H218 V230 M200 190 H210 V200 H200 M218 195 H228 V205 H218" stroke="#10b981" stroke-width="6" stroke-linecap="square" />
      </g>`
  },

  // 8. Cyberpunk Flappy
  'cyberpunk-flappy': {
    theme: 'cyber',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="200" y="20" width="45" height="95" rx="6" fill="#10b981" stroke="#34d399" stroke-width="3" filter="url(#brightGlow)" />
        <rect x="200" y="195" width="45" height="95" rx="6" fill="#10b981" stroke="#34d399" stroke-width="3" filter="url(#brightGlow)" />
        <circle cx="100" cy="150" r="28" fill="#facc15" stroke="#ffffff" stroke-width="3" filter="url(#brightGlow)" />
        <circle cx="114" cy="144" r="8" fill="#ffffff" /><circle cx="117" cy="144" r="4" fill="#0f172a" />
        <polygon points="125,148 145,155 125,162" fill="#f97316" stroke="#c2410c" stroke-width="2" />
        <ellipse cx="85" cy="155" rx="15" ry="10" fill="#00f0ff" stroke="#ffffff" stroke-width="2" />
      </g>`
  },

  // 9. Fruit Slash
  'fruit-slash': {
    theme: 'fire',
    renderArt: () => `
      <g filter="url(#glow)">
        <path d="M50 130 A 55 55 0 0 0 145 175 Z" fill="#22c55e" stroke="#15803d" stroke-width="4" />
        <path d="M57 135 A 46 46 0 0 0 137 172 Z" fill="#ef4444" />
        <path d="M165 90 A 55 55 0 0 0 240 165 Z" fill="#22c55e" stroke="#15803d" stroke-width="4" />
        <path d="M172 96 A 46 46 0 0 0 233 160 Z" fill="#ef4444" />
        <circle cx="90" cy="225" r="36" fill="#f97316" stroke="#fbbf24" stroke-width="4" />
        <path d="M25 70 Q 150 170 275 190" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" filter="url(#brightGlow)" />
        <circle cx="145" cy="130" r="5" fill="#ef4444" /><circle cx="160" cy="145" r="6" fill="#ef4444" />
      </g>`
  },

  // 10. Bubble Shooter
  'bubble-shooter': {
    theme: 'purple',
    renderArt: () => `
      <g filter="url(#glow)">
        <circle cx="65" cy="70" r="24" fill="#ec4899" filter="url(#brightGlow)" />
        <circle cx="115" cy="70" r="24" fill="#3b82f6" filter="url(#brightGlow)" />
        <circle cx="165" cy="70" r="24" fill="#10b981" filter="url(#brightGlow)" />
        <circle cx="215" cy="70" r="24" fill="#f59e0b" filter="url(#brightGlow)" />
        <circle cx="90" cy="112" r="24" fill="#8b5cf6" filter="url(#brightGlow)" />
        <circle cx="140" cy="112" r="24" fill="#ec4899" filter="url(#brightGlow)" />
        <circle cx="190" cy="112" r="24" fill="#3b82f6" filter="url(#brightGlow)" />
        <line x1="150" y1="240" x2="140" y2="140" stroke="#ffffff" stroke-width="3.5" stroke-dasharray="6 6" />
        <circle cx="150" cy="245" r="28" fill="#ec4899" filter="url(#brightGlow)" />
      </g>`
  },

  // 11. Steam Whacker
  'steam-whacker': {
    theme: 'amber',
    renderArt: () => `
      <g filter="url(#glow)">
        <ellipse cx="150" cy="220" rx="90" ry="35" fill="#291807" stroke="#78350f" stroke-width="5" />
        <ellipse cx="150" cy="220" rx="70" ry="25" fill="#000000" />
        <ellipse cx="150" cy="165" rx="45" ry="55" fill="#92400e" stroke="#d97706" stroke-width="4" />
        <circle cx="132" cy="145" r="14" fill="#fef08a" stroke="#78350f" stroke-width="4" />
        <circle cx="168" cy="145" r="14" fill="#fef08a" stroke="#78350f" stroke-width="4" />
        <ellipse cx="150" cy="175" rx="16" ry="10" fill="#fca5a5" />
        <!-- Big Wooden Mallet Swinging -->
        <g transform="translate(195, 70) rotate(35)">
          <rect x="-15" y="-10" width="30" height="70" rx="8" fill="#b45309" stroke="#fde68a" stroke-width="3" filter="url(#brightGlow)" />
          <rect x="-8" y="60" width="16" height="80" rx="4" fill="#78350f" />
        </g>
      </g>`
  },

  // 12. Classic Sudoku
  'classic-sudoku': {
    theme: 'emerald',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="45" y="45" width="210" height="210" rx="16" fill="#042f2e" stroke="#14b8a6" stroke-width="3.5" />
        <line x1="115" y1="45" x2="115" y2="255" stroke="#2dd4bf" stroke-width="2.5" />
        <line x1="185" y1="45" x2="185" y2="255" stroke="#2dd4bf" stroke-width="2.5" />
        <line x1="45" y1="115" x2="255" y2="115" stroke="#2dd4bf" stroke-width="2.5" />
        <line x1="45" y1="185" x2="255" y2="185" stroke="#2dd4bf" stroke-width="2.5" />
        <text x="80" y="96" font-family="'Orbitron', sans-serif" font-weight="900" font-size="34" fill="#5eead4" text-anchor="middle">5</text>
        <text x="150" y="96" font-family="'Orbitron', sans-serif" font-weight="900" font-size="34" fill="#facc15" text-anchor="middle">3</text>
        <text x="220" y="96" font-family="'Orbitron', sans-serif" font-weight="900" font-size="34" fill="#5eead4" text-anchor="middle">8</text>
        <text x="150" y="165" font-family="'Orbitron', sans-serif" font-weight="900" font-size="34" fill="#5eead4" text-anchor="middle">7</text>
        <text x="220" y="235" font-family="'Orbitron', sans-serif" font-weight="900" font-size="34" fill="#5eead4" text-anchor="middle">4</text>
      </g>`
  },

  // 13. Crossword Puzzle
  'crossword-puzzle': {
    theme: 'cyber',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="55" y="55" width="190" height="190" rx="10" fill="#0f172a" stroke="#38bdf8" stroke-width="3" />
        <line x1="118" y1="55" x2="118" y2="245" stroke="#38bdf8" stroke-width="2" />
        <line x1="181" y1="55" x2="181" y2="245" stroke="#38bdf8" stroke-width="2" />
        <line x1="55" y1="118" x2="245" y2="118" stroke="#38bdf8" stroke-width="2" />
        <line x1="55" y1="181" x2="245" y2="181" stroke="#38bdf8" stroke-width="2" />
        <rect x="118" y="118" width="63" height="63" fill="#0284c7" opacity="0.7" />
        <text x="86" y="100" font-family="'Orbitron', sans-serif" font-weight="900" font-size="28" fill="#38bdf8" text-anchor="middle">W</text>
        <text x="150" y="100" font-family="'Orbitron', sans-serif" font-weight="900" font-size="28" fill="#38bdf8" text-anchor="middle">O</text>
        <text x="213" y="100" font-family="'Orbitron', sans-serif" font-weight="900" font-size="28" fill="#38bdf8" text-anchor="middle">R</text>
        <text x="150" y="225" font-family="'Orbitron', sans-serif" font-weight="900" font-size="28" fill="#38bdf8" text-anchor="middle">D</text>
      </g>`
  },

  // 14. Nonogram Puzzle
  'nonogram-puzzle': {
    theme: 'cyber',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="50" y="50" width="200" height="200" rx="14" fill="#082f49" stroke="#0ea5e9" stroke-width="3" />
        <rect x="75" y="75" width="40" height="40" fill="#38bdf8" filter="url(#brightGlow)" />
        <rect x="135" y="75" width="40" height="40" fill="#38bdf8" filter="url(#brightGlow)" />
        <rect x="75" y="135" width="100" height="40" fill="#38bdf8" filter="url(#brightGlow)" />
        <rect x="75" y="195" width="40" height="40" fill="#38bdf8" filter="url(#brightGlow)" />
        <text x="62" y="102" font-family="'Orbitron', sans-serif" font-weight="900" font-size="16" fill="#facc15" text-anchor="middle">2</text>
        <text x="62" y="162" font-family="'Orbitron', sans-serif" font-weight="900" font-size="16" fill="#facc15" text-anchor="middle">3</text>
      </g>`
  },

  // 15. Classic Minesweeper
  'classic-minesweeper': {
    theme: 'fire',
    renderArt: () => `
      <g filter="url(#glow)">
        <circle cx="150" cy="140" r="48" fill="#18181b" stroke="#71717a" stroke-width="4.5" />
        <rect x="144" y="78" width="12" height="24" rx="4" fill="#a1a1aa" />
        <rect x="144" y="178" width="12" height="24" rx="4" fill="#a1a1aa" />
        <rect x="88" y="134" width="24" height="12" rx="4" fill="#a1a1aa" />
        <rect x="188" y="134" width="24" height="12" rx="4" fill="#a1a1aa" />
        <circle cx="150" cy="140" r="16" fill="#ef4444" filter="url(#brightGlow)" />
        <polygon points="50,210 50,165 95,188" fill="#ef4444" stroke="#ffffff" stroke-width="2" filter="url(#brightGlow)" />
        <line x1="50" y1="165" x2="50" y2="255" stroke="#d4d4d8" stroke-width="4.5" stroke-linecap="round" />
        <rect x="200" y="200" width="50" height="50" rx="10" fill="#27272a" stroke="#52525b" stroke-width="2.5" />
        <text x="225" y="236" font-family="'Orbitron', sans-serif" font-weight="900" font-size="32" fill="#ef4444" text-anchor="middle">3</text>
      </g>`
  },

  // 16. Jigsaw Puzzle
  'jigsaw-puzzle': {
    theme: 'purple',
    renderArt: () => `
      <g filter="url(#glow)">
        <path d="M70 70 H130 C130 95 155 95 155 70 H215 V130 C240 130 240 155 215 155 V215 H155 C155 190 130 190 130 215 H70 V155 C45 155 45 130 70 130 Z" fill="#9333ea" stroke="#f3e8ff" stroke-width="4.5" filter="url(#brightGlow)" />
        <circle cx="142" cy="142" r="10" fill="#facc15" filter="url(#brightGlow)" />
      </g>`
  },

  // 17. Unblock Me
  'unblock-me': {
    theme: 'amber',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="40" y="45" width="220" height="210" rx="16" fill="#3e2723" stroke="#8d6e63" stroke-width="5" />
        <rect x="55" y="60" width="45" height="100" rx="8" fill="#a1887f" stroke="#d7ccc8" stroke-width="2" />
        <rect x="55" y="170" width="100" height="45" rx="8" fill="#a1887f" stroke="#d7ccc8" stroke-width="2" />
        <rect x="115" y="115" width="135" height="45" rx="10" fill="#dc2626" stroke="#ffffff" stroke-width="3" filter="url(#brightGlow)" />
        <polygon points="255,138 245,128 245,148" fill="#ffffff" />
      </g>`
  },

  // 18. Flow Connect
  'flow-connect': {
    theme: 'cyber',
    renderArt: () => `
      <g filter="url(#glow)">
        <path d="M60 60 H150 V150 H240" fill="none" stroke="#00f0ff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" filter="url(#brightGlow)" />
        <circle cx="60" cy="60" r="18" fill="#00f0ff" stroke="#ffffff" stroke-width="3.5" />
        <circle cx="240" cy="150" r="18" fill="#00f0ff" stroke="#ffffff" stroke-width="3.5" />
        <path d="M60 240 V150 H110 V240 H240" fill="none" stroke="#e11d48" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" filter="url(#brightGlow)" />
        <circle cx="60" cy="240" r="18" fill="#e11d48" stroke="#ffffff" stroke-width="3.5" />
        <circle cx="240" cy="240" r="18" fill="#e11d48" stroke="#ffffff" stroke-width="3.5" />
      </g>`
  },

  // 19. Word Connections
  'word-connections': {
    theme: 'gold',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="45" y="80" width="50" height="50" rx="10" fill="#ca8a04" stroke="#fef08a" stroke-width="3" filter="url(#brightGlow)" />
        <text x="70" y="116" font-family="'Orbitron', sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">L</text>
        <rect x="105" y="80" width="50" height="50" rx="10" fill="#ca8a04" stroke="#fef08a" stroke-width="3" filter="url(#brightGlow)" />
        <text x="130" y="116" font-family="'Orbitron', sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">I</text>
        <rect x="165" y="80" width="50" height="50" rx="10" fill="#ca8a04" stroke="#fef08a" stroke-width="3" filter="url(#brightGlow)" />
        <text x="190" y="116" font-family="'Orbitron', sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">N</text>
        <rect x="205" y="145" width="50" height="50" rx="10" fill="#e11d48" stroke="#ffffff" stroke-width="3" filter="url(#brightGlow)" />
        <text x="230" y="181" font-family="'Orbitron', sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">K</text>
        <line x1="190" y1="130" x2="230" y2="145" stroke="#facc15" stroke-width="4" stroke-dasharray="4 4" />
      </g>`
  },

  // 20. Chess
  'chess': {
    theme: 'gold',
    renderArt: () => `
      <g filter="url(#glow)">
        <polygon points="50,210 250,210 280,275 20,275" fill="#1c1917" stroke="#ca8a04" stroke-width="2" />
        <path d="M150 55 V75 M140 65 H160" stroke="#fef08a" stroke-width="4.5" stroke-linecap="round" filter="url(#brightGlow)" />
        <path d="M125 85 Q 150 70 175 85 L 170 110 H 130 Z" fill="url(#goldGradient)" stroke="#fef08a" stroke-width="2.5" />
        <path d="M135 110 Q 130 160 120 195 H 180 Q 170 160 165 110 Z" fill="url(#goldGradient)" stroke="#fef08a" stroke-width="2.5" filter="url(#brightGlow)" />
        <ellipse cx="150" cy="200" rx="44" ry="15" fill="#a16207" stroke="#fef08a" stroke-width="2.5" />
      </g>`
  },

  // 21. Little Alchemy
  'little-alchemy': {
    theme: 'purple',
    renderArt: () => `
      <g filter="url(#glow)">
        <path d="M135 60 H165 V105 L215 195 A 30 30 0 0 1 185 240 H115 A 30 30 0 0 1 85 195 L135 105 Z" fill="none" stroke="#a855f7" stroke-width="5" />
        <path d="M105 185 H195 L185 235 H115 Z" fill="#06b6d4" opacity="0.85" filter="url(#brightGlow)" />
        <circle cx="135" cy="155" r="8" fill="#facc15" filter="url(#brightGlow)" />
        <circle cx="165" cy="175" r="10" fill="#f43f5e" filter="url(#brightGlow)" />
        <circle cx="150" cy="210" r="12" fill="#22c55e" filter="url(#brightGlow)" />
      </g>`
  },

  // 22. The Impossible Quiz
  'the-impossible-quiz': {
    theme: 'fire',
    renderArt: () => `
      <g filter="url(#glow)">
        <circle cx="150" cy="155" r="58" fill="#18181b" stroke="#71717a" stroke-width="4.5" />
        <path d="M150 97 Q 175 65 190 55" stroke="#f59e0b" stroke-width="5" stroke-linecap="round" />
        <polygon points="190,55 198,48 200,58 193,62" fill="#ef4444" filter="url(#brightGlow)" />
        <text x="150" y="180" font-family="'Impact', sans-serif" font-size="64" fill="#ef4444" text-anchor="middle" filter="url(#brightGlow)">?</text>
      </g>`
  },

  // 23. Checkers
  'checkers': {
    theme: 'fire',
    renderArt: () => `
      <g filter="url(#glow)">
        <polygon points="40,180 260,180 280,265 20,265" fill="#1c1917" stroke="#ca8a04" stroke-width="2" />
        <ellipse cx="150" cy="140" rx="48" ry="22" fill="#ef4444" stroke="#ffffff" stroke-width="3.5" filter="url(#brightGlow)" />
        <ellipse cx="150" cy="132" rx="38" ry="16" fill="#dc2626" />
        <polygon points="135,130 140,115 150,123 160,115 165,130" fill="#facc15" stroke="#ffffff" stroke-width="1.5" />
      </g>`
  },

  // 24. Go
  'go': {
    theme: 'amber',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="45" y="45" width="210" height="210" rx="14" fill="#78350f" stroke="#ca8a04" stroke-width="4" />
        <line x1="85" y1="45" x2="85" y2="255" stroke="#ca8a04" stroke-width="2" />
        <line x1="150" y1="45" x2="150" y2="255" stroke="#ca8a04" stroke-width="2" />
        <line x1="215" y1="45" x2="215" y2="255" stroke="#ca8a04" stroke-width="2" />
        <line x1="45" y1="85" x2="255" y2="85" stroke="#ca8a04" stroke-width="2" />
        <line x1="45" y1="150" x2="255" y2="150" stroke="#ca8a04" stroke-width="2" />
        <line x1="45" y1="215" x2="255" y2="215" stroke="#ca8a04" stroke-width="2" />
        <!-- Black and White Stones -->
        <circle cx="85" cy="85" r="22" fill="#090d16" stroke="#475569" stroke-width="2" />
        <circle cx="150" cy="150" r="22" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" filter="url(#brightGlow)" />
        <circle cx="215" cy="85" r="22" fill="#090d16" stroke="#475569" stroke-width="2" />
        <circle cx="150" cy="85" r="22" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" filter="url(#brightGlow)" />
      </g>`
  },

  // 25. Solitaire
  'solitaire': {
    theme: 'gold',
    renderArt: () => `
      <g filter="url(#glow)">
        <g transform="rotate(8 150 150)">
          <rect x="90" y="65" width="125" height="175" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="3" filter="url(#brightGlow)" />
          <text x="108" y="100" font-family="'Orbitron', sans-serif" font-weight="900" font-size="28" fill="#0f172a">A</text>
          <path d="M152 125 C 130 152 115 168 152 190 C 189 168 174 152 152 125 Z" fill="#0f172a" filter="url(#brightGlow)" />
          <path d="M152 185 L 144 205 H 160 Z" fill="#0f172a" />
        </g>
      </g>`
  },

  // 26. Reversi
  'reversi': {
    theme: 'emerald',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="45" y="45" width="210" height="210" rx="16" fill="#064e3b" stroke="#10b981" stroke-width="4" />
        <line x1="150" y1="45" x2="150" y2="255" stroke="#047857" stroke-width="3" />
        <line x1="45" y1="150" x2="255" y2="150" stroke="#047857" stroke-width="3" />
        <circle cx="100" cy="100" r="32" fill="#ffffff" stroke="#94a3b8" stroke-width="3" filter="url(#brightGlow)" />
        <circle cx="200" cy="100" r="32" fill="#0f172a" stroke="#475569" stroke-width="3" />
        <circle cx="100" cy="200" r="32" fill="#0f172a" stroke="#475569" stroke-width="3" />
        <circle cx="200" cy="200" r="32" fill="#ffffff" stroke="#94a3b8" stroke-width="3" filter="url(#brightGlow)" />
      </g>`
  },

  // 27. Dots and Boxes
  'dots-and-boxes': {
    theme: 'cyber',
    renderArt: () => `
      <g filter="url(#glow)">
        <circle cx="80" cy="80" r="7" fill="#ffffff" /><circle cx="150" cy="80" r="7" fill="#ffffff" /><circle cx="220" cy="80" r="7" fill="#ffffff" />
        <circle cx="80" cy="150" r="7" fill="#ffffff" /><circle cx="150" cy="150" r="7" fill="#ffffff" /><circle cx="220" cy="150" r="7" fill="#ffffff" />
        <circle cx="80" cy="220" r="7" fill="#ffffff" /><circle cx="150" cy="220" r="7" fill="#ffffff" /><circle cx="220" cy="220" r="7" fill="#ffffff" />
        <line x1="80" y1="80" x2="150" y2="80" stroke="#00f0ff" stroke-width="7" />
        <line x1="80" y1="80" x2="80" y2="150" stroke="#00f0ff" stroke-width="7" />
        <line x1="150" y1="80" x2="150" y2="150" stroke="#00f0ff" stroke-width="7" />
        <line x1="80" y1="150" x2="150" y2="150" stroke="#00f0ff" stroke-width="7" />
        <rect x="85" y="85" width="60" height="60" rx="8" fill="#0284c7" opacity="0.65" />
        <text x="115" y="125" font-family="'Orbitron', sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">P1</text>
      </g>`
  },

  // 28. Queens Puzzle
  'queens-puzzle': {
    theme: 'gold',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="45" y="45" width="210" height="210" rx="14" fill="#1e1b4b" stroke="#ca8a04" stroke-width="3" />
        <!-- 3 Royal Crowns -->
        <polygon points="65,120 75,90 90,105 105,90 115,120" fill="url(#goldGradient)" stroke="#ffffff" stroke-width="2" filter="url(#brightGlow)" />
        <polygon points="125,180 135,150 150,165 165,150 175,180" fill="url(#goldGradient)" stroke="#ffffff" stroke-width="2" filter="url(#brightGlow)" />
        <polygon points="185,90 195,60 210,75 225,60 235,90" fill="url(#goldGradient)" stroke="#ffffff" stroke-width="2" filter="url(#brightGlow)" />
        <circle cx="90" cy="85" r="4" fill="#ef4444" /><circle cx="150" cy="145" r="4" fill="#3b82f6" /><circle cx="210" cy="55" r="4" fill="#10b981" />
      </g>`
  },

  // 29. Mahjong Solitaire
  'mahjong-solitaire': {
    theme: 'emerald',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="75" y="70" width="70" height="95" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3.5" />
        <rect x="80" y="75" width="60" height="85" rx="6" fill="#047857" />
        <text x="110" y="132" font-family="'Noto Sans', sans-serif" font-weight="900" font-size="44" fill="#fef08a" text-anchor="middle">中</text>
        <rect x="155" y="70" width="70" height="95" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3.5" />
        <rect x="160" y="75" width="60" height="85" rx="6" fill="#047857" />
        <text x="190" y="132" font-family="'Noto Sans', sans-serif" font-weight="900" font-size="44" fill="#f87171" text-anchor="middle">發</text>
        <rect x="115" y="145" width="70" height="95" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3.5" />
        <rect x="120" y="150" width="60" height="85" rx="6" fill="#047857" />
        <text x="150" y="208" font-family="'Noto Sans', sans-serif" font-weight="900" font-size="44" fill="#38bdf8" text-anchor="middle">萬</text>
      </g>`
  },

  // 30. Sliding Puzzle
  'sliding-puzzle': {
    theme: 'amber',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="45" y="45" width="210" height="210" rx="16" fill="#1e293b" stroke="#f59e0b" stroke-width="4" />
        <rect x="55" y="55" width="60" height="60" rx="10" fill="#d97706" stroke="#fef3c7" stroke-width="2" />
        <text x="85" y="96" font-family="'Orbitron', sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">1</text>
        <rect x="120" y="55" width="60" height="60" rx="10" fill="#d97706" stroke="#fef3c7" stroke-width="2" />
        <text x="150" y="96" font-family="'Orbitron', sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">2</text>
        <rect x="185" y="55" width="60" height="60" rx="10" fill="#d97706" stroke="#fef3c7" stroke-width="2" />
        <text x="215" y="96" font-family="'Orbitron', sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">3</text>
        <rect x="55" y="120" width="60" height="60" rx="10" fill="#d97706" stroke="#fef3c7" stroke-width="2" />
        <text x="85" y="161" font-family="'Orbitron', sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">4</text>
        <rect x="120" y="120" width="60" height="60" rx="10" fill="#d97706" stroke="#fef3c7" stroke-width="2" />
        <text x="150" y="161" font-family="'Orbitron', sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">5</text>
        <!-- Blank Space Indicator Arrow -->
        <polygon points="215,140 205,150 225,150" fill="#00f0ff" filter="url(#brightGlow)" />
      </g>`
  },

  // 31. Tic Tac Toe
  'tic-tac-toe': {
    theme: 'purple',
    renderArt: () => `
      <g filter="url(#glow)">
        <line x1="110" y1="50" x2="110" y2="250" stroke="#a855f7" stroke-width="6" stroke-linecap="round" filter="url(#brightGlow)" />
        <line x1="190" y1="50" x2="190" y2="250" stroke="#a855f7" stroke-width="6" stroke-linecap="round" filter="url(#brightGlow)" />
        <line x1="40" y1="115" x2="260" y2="115" stroke="#a855f7" stroke-width="6" stroke-linecap="round" filter="url(#brightGlow)" />
        <line x1="40" y1="185" x2="260" y2="185" stroke="#a855f7" stroke-width="6" stroke-linecap="round" filter="url(#brightGlow)" />
        <line x1="55" y1="60" x2="95" y2="100" stroke="#00f0ff" stroke-width="8" stroke-linecap="round" />
        <line x1="95" y1="60" x2="55" y2="100" stroke="#00f0ff" stroke-width="8" stroke-linecap="round" />
        <circle cx="150" cy="150" r="22" fill="none" stroke="#ec4899" stroke-width="8" filter="url(#brightGlow)" />
      </g>`
  },

  // 32. Trivia Crack
  'trivia-crack': {
    theme: 'purple',
    renderArt: () => `
      <g filter="url(#glow)">
        <circle cx="150" cy="150" r="70" fill="#1e1b4b" stroke="#c084fc" stroke-width="6" filter="url(#brightGlow)" />
        <path d="M150 150 L 150 80 A 70 70 0 0 1 220 150 Z" fill="#ef4444" />
        <path d="M150 150 L 220 150 A 70 70 0 0 1 150 220 Z" fill="#3b82f6" />
        <path d="M150 150 L 150 220 A 70 70 0 0 1 80 150 Z" fill="#eab308" />
        <path d="M150 150 L 80 150 A 70 70 0 0 1 150 80 Z" fill="#10b981" />
        <circle cx="150" cy="150" r="25" fill="#ffffff" stroke="#0f172a" stroke-width="3" />
        <text x="150" y="160" font-family="'Orbitron', sans-serif" font-weight="900" font-size="28" fill="#0f172a" text-anchor="middle">?</text>
      </g>`
  },

  // 33. Cut the Rope
  'cut-the-rope': {
    theme: 'emerald',
    renderArt: () => `
      <g filter="url(#glow)">
        <circle cx="150" cy="180" r="58" fill="#22c55e" stroke="#15803d" stroke-width="5" filter="url(#brightGlow)" />
        <ellipse cx="130" cy="165" rx="14" ry="18" fill="#ffffff" /><circle cx="132" cy="165" r="7" fill="#0f172a" />
        <ellipse cx="170" cy="165" rx="14" ry="18" fill="#ffffff" /><circle cx="168" cy="165" r="7" fill="#0f172a" />
        <path d="M110 50 Q 130 95 150 120" stroke="#b45309" stroke-width="4.5" stroke-dasharray="6 3" />
        <circle cx="150" cy="120" r="20" fill="#ef4444" stroke="#ffffff" stroke-width="3" filter="url(#brightGlow)" />
        <circle cx="145" cy="115" r="5" fill="#ffffff" />
      </g>`
  },

  // 34. Ludo
  'ludo': {
    theme: 'gold',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="40" y="45" width="105" height="105" rx="16" fill="#dc2626" />
        <rect x="155" y="45" width="105" height="105" rx="16" fill="#16a34a" />
        <rect x="40" y="160" width="105" height="105" rx="16" fill="#2563eb" />
        <rect x="155" y="160" width="105" height="105" rx="16" fill="#eab308" />
        <rect x="115" y="120" width="70" height="70" rx="18" fill="#ffffff" stroke="#e2e8f0" stroke-width="3.5" filter="url(#brightGlow)" />
        <circle cx="130" cy="135" r="5" fill="#dc2626" /><circle cx="170" cy="135" r="5" fill="#dc2626" />
        <circle cx="150" cy="155" r="6" fill="#dc2626" />
        <circle cx="130" cy="175" r="5" fill="#dc2626" /><circle cx="170" cy="175" r="5" fill="#dc2626" />
      </g>`
  },

  // 35. Carrom Pool
  'carrom-pool': {
    theme: 'gold',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="35" y="35" width="230" height="230" rx="30" fill="#78350f" stroke="#ca8a04" stroke-width="5" />
        <rect x="60" y="60" width="180" height="180" fill="#fef3c7" />
        <circle cx="150" cy="150" r="40" fill="none" stroke="#dc2626" stroke-width="2.5" />
        <circle cx="150" cy="150" r="12" fill="#dc2626" stroke="#ffffff" stroke-width="2.5" filter="url(#brightGlow)" />
        <circle cx="125" cy="135" r="10" fill="#1c1917" stroke="#ffffff" stroke-width="2" />
        <circle cx="175" cy="135" r="10" fill="#ffffff" stroke="#78350f" stroke-width="2" />
        <circle cx="150" cy="220" r="20" fill="url(#cyanSphere)" stroke="#ffffff" stroke-width="3" filter="url(#brightGlow)" />
      </g>`
  },

  // 36. Neon Run
  'neon-run': {
    theme: 'speed',
    renderArt: () => `
      <g filter="url(#glow)">
        <line x1="20" y1="210" x2="280" y2="210" stroke="#00f0ff" stroke-width="4.5" filter="url(#brightGlow)" />
        <g transform="rotate(25 100 145)">
          <rect x="75" y="120" width="52" height="52" rx="10" fill="#00f0ff" stroke="#ffffff" stroke-width="3" filter="url(#brightGlow)" />
          <rect x="90" y="135" width="22" height="22" rx="4" fill="#0284c7" />
        </g>
        <polygon points="170,210 185,155 200,210" fill="#ef4444" stroke="#fca5a5" stroke-width="2" filter="url(#brightGlow)" />
        <polygon points="200,210 215,155 230,210" fill="#ef4444" stroke="#fca5a5" stroke-width="2" filter="url(#brightGlow)" />
      </g>`
  },

  // 37. Drive Fury
  'drive-fury': {
    theme: 'speed',
    renderArt: () => `
      <g filter="url(#glow)">
        <polygon points="150,50 20,280 280,280" fill="#090d16" />
        <line x1="150" y1="50" x2="150" y2="280" stroke="#facc15" stroke-width="4.5" stroke-dasharray="16 12" />
        <rect x="95" y="145" width="110" height="12" rx="4" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
        <polygon points="115,145 125,115 175,115 185,145" fill="#0284c7" stroke="#38bdf8" stroke-width="2" />
        <path d="M90 157 H210 L200 210 H100 Z" fill="#dc2626" stroke="#991b1b" stroke-width="3" />
        <rect x="98" y="165" width="40" height="10" rx="3" fill="#ff0044" filter="url(#brightGlow)" />
        <rect x="162" y="165" width="40" height="10" rx="3" fill="#ff0044" filter="url(#brightGlow)" />
      </g>`
  },

  // 38. Level Devil (Unique!)
  'level-devil': {
    theme: 'fire',
    renderArt: () => `
      <g filter="url(#glow)">
        <polygon points="30,245 45,205 60,245" fill="#ef4444" />
        <polygon points="60,245 75,205 90,245" fill="#ef4444" />
        <polygon points="90,245 105,205 120,245" fill="#ef4444" />
        <rect x="90" y="135" width="120" height="24" rx="6" fill="#1e293b" stroke="#94a3b8" stroke-width="2.5" />
        <!-- Yellow Guy with Devil Horns -->
        <rect x="125" y="85" width="50" height="52" rx="12" fill="#facc15" stroke="#000000" stroke-width="3.5" filter="url(#brightGlow)" />
        <circle cx="140" cy="102" r="5" fill="#000" /><circle cx="160" cy="102" r="5" fill="#000" />
        <polygon points="128,85 120,60 138,80" fill="#ef4444" /><polygon points="172,85 180,60 162,80" fill="#ef4444" />
        <line x1="150" y1="135" x2="190" y2="165" stroke="#ef4444" stroke-width="4.5" stroke-dasharray="4 4" />
      </g>`
  },

  // 39. Kitchen Rush (Unique!)
  'kitchen-rush': {
    theme: 'fire',
    renderArt: () => `
      <g filter="url(#glow)">
        <path d="M110 120 C 100 65 135 45 150 45 C 165 45 200 65 190 120 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="3" filter="url(#brightGlow)" />
        <rect x="110" y="120" width="80" height="20" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
        <!-- Sizzling Burger -->
        <ellipse cx="150" cy="210" rx="65" ry="18" fill="#f59e0b" stroke="#b45309" stroke-width="3" />
        <ellipse cx="150" cy="195" rx="58" ry="14" fill="#7f1d1d" />
        <ellipse cx="150" cy="180" rx="60" ry="16" fill="#16a34a" />
        <ellipse cx="150" cy="165" rx="62" ry="18" fill="#f59e0b" stroke="#b45309" stroke-width="2" />
        <!-- Kitchen Flames -->
        <polygon points="80,180 70,140 90,165" fill="#f97316" filter="url(#brightGlow)" />
        <polygon points="220,180 230,140 210,165" fill="#f97316" filter="url(#brightGlow)" />
      </g>`
  },

  // 40. Escape Manor (Unique!)
  'escape-manor': {
    theme: 'purple',
    renderArt: () => `
      <g filter="url(#glow)">
        <!-- Haunted Manor Doorway -->
        <path d="M80 260 V110 Q 150 50 220 110 V260 Z" fill="#1e1b4b" stroke="#818cf8" stroke-width="4.5" />
        <!-- Mysterious Glowing Brass Key -->
        <circle cx="150" cy="140" r="24" fill="none" stroke="#facc15" stroke-width="5" filter="url(#brightGlow)" />
        <line x1="150" y1="164" x2="150" y2="215" stroke="#facc15" stroke-width="6" stroke-linecap="round" filter="url(#brightGlow)" />
        <line x1="150" y1="190" x2="165" y2="190" stroke="#facc15" stroke-width="5" stroke-linecap="round" />
        <line x1="150" y1="210" x2="168" y2="210" stroke="#facc15" stroke-width="5" stroke-linecap="round" />
        <!-- Spooky Lantern Glow -->
        <circle cx="65" cy="130" r="12" fill="#fbbf24" filter="url(#brightGlow)" />
        <circle cx="235" cy="130" r="12" fill="#fbbf24" filter="url(#brightGlow)" />
      </g>`
  },

  // 41. Sand Balls (Unique!)
  'sand-balls': {
    theme: 'amber',
    renderArt: () => `
      <g filter="url(#glow)">
        <!-- Carved Sand Pathway -->
        <path d="M60 40 Q 150 90 120 150 Q 90 210 180 270" fill="none" stroke="#d97706" stroke-width="50" stroke-linecap="round" />
        <!-- 3D Colorful Rolling Marbles -->
        <circle cx="130" cy="95" r="18" fill="#ef4444" stroke="#ffffff" stroke-width="2.5" filter="url(#brightGlow)" />
        <circle cx="105" cy="145" r="18" fill="#3b82f6" stroke="#ffffff" stroke-width="2.5" filter="url(#brightGlow)" />
        <circle cx="135" cy="180" r="18" fill="#10b981" stroke="#ffffff" stroke-width="2.5" filter="url(#brightGlow)" />
        <circle cx="160" cy="225" r="18" fill="#eab308" stroke="#ffffff" stroke-width="2.5" filter="url(#brightGlow)" />
        <circle cx="185" cy="255" r="18" fill="#a855f7" stroke="#ffffff" stroke-width="2.5" filter="url(#brightGlow)" />
      </g>`
  },

  // 42. Arrow Escape (Unique!)
  'arrow-escape': {
    theme: 'cyber',
    renderArt: () => `
      <g filter="url(#glow)">
        <!-- Labyrinth Gates -->
        <rect x="40" y="60" width="70" height="15" rx="4" fill="#ef4444" />
        <rect x="190" y="60" width="70" height="15" rx="4" fill="#ef4444" />
        <rect x="40" y="160" width="90" height="15" rx="4" fill="#ef4444" />
        <rect x="210" y="160" width="50" height="15" rx="4" fill="#ef4444" />
        <!-- Glowing Arrow Jet -->
        <polygon points="150,85 120,185 150,165 180,185" fill="#00f0ff" stroke="#ffffff" stroke-width="3" filter="url(#brightGlow)" />
        <line x1="150" y1="165" x2="150" y2="245" stroke="#38bdf8" stroke-width="4" stroke-dasharray="8 6" />
        <!-- Shockwave Rings -->
        <circle cx="150" cy="135" r="45" fill="none" stroke="#00f0ff" stroke-width="2" opacity="0.4" />
      </g>`
  },

  // 43. Block Stacker (Unique!)
  'block-stacker': {
    theme: 'purple',
    renderArt: () => `
      <g filter="url(#glow)">
        <!-- Tower of Blocks -->
        <rect x="90" y="210" width="120" height="30" rx="6" fill="#3b82f6" stroke="#93c5fd" stroke-width="2.5" />
        <rect x="95" y="175" width="110" height="30" rx="6" fill="#10b981" stroke="#a7f3d0" stroke-width="2.5" />
        <rect x="100" y="140" width="100" height="30" rx="6" fill="#f59e0b" stroke="#fde68a" stroke-width="2.5" />
        <rect x="110" y="105" width="80" height="30" rx="6" fill="#ec4899" stroke="#fbcfe8" stroke-width="2.5" />
        <!-- Top Sliding Block -->
        <rect x="125" y="65" width="75" height="30" rx="6" fill="#00f0ff" stroke="#ffffff" stroke-width="3" filter="url(#brightGlow)" />
      </g>`
  },

  // 44. Memory Master (Unique!)
  'memory-master': {
    theme: 'purple',
    renderArt: () => `
      <g filter="url(#glow)">
        <!-- Two Flipped Glowing Matching Cards -->
        <g transform="rotate(-8 100 150)">
          <rect x="55" y="90" width="85" height="120" rx="12" fill="#1e1b4b" stroke="#c084fc" stroke-width="3.5" filter="url(#brightGlow)" />
          <polygon points="97,125 110,140 102,165 92,165 84,140" fill="#facc15" filter="url(#brightGlow)" />
        </g>
        <g transform="rotate(8 200 150)">
          <rect x="160" y="90" width="85" height="120" rx="12" fill="#1e1b4b" stroke="#c084fc" stroke-width="3.5" filter="url(#brightGlow)" />
          <polygon points="202,125 215,140 207,165 197,165 189,140" fill="#facc15" filter="url(#brightGlow)" />
        </g>
        <!-- Brain Sparkles -->
        <circle cx="150" cy="70" r="14" fill="#00f0ff" filter="url(#brightGlow)" />
      </g>`
  },

  // 45. Typing Speed Test (Unique!)
  'typing-speed-test': {
    theme: 'cyber',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="45" y="80" width="45" height="45" rx="8" fill="#1e293b" stroke="#00f0ff" stroke-width="2.5" />
        <text x="67" y="112" font-family="'Orbitron', sans-serif" font-weight="900" font-size="22" fill="#00f0ff" text-anchor="middle">A</text>
        <rect x="100" y="80" width="45" height="45" rx="8" fill="#1e293b" stroke="#00f0ff" stroke-width="2.5" />
        <text x="122" y="112" font-family="'Orbitron', sans-serif" font-weight="900" font-size="22" fill="#00f0ff" text-anchor="middle">S</text>
        <rect x="155" y="80" width="45" height="45" rx="8" fill="#1e293b" stroke="#00f0ff" stroke-width="2.5" />
        <text x="177" y="112" font-family="'Orbitron', sans-serif" font-weight="900" font-size="22" fill="#00f0ff" text-anchor="middle">D</text>
        <rect x="210" y="80" width="45" height="45" rx="8" fill="#1e293b" stroke="#00f0ff" stroke-width="2.5" />
        <text x="232" y="112" font-family="'Orbitron', sans-serif" font-weight="900" font-size="22" fill="#00f0ff" text-anchor="middle">F</text>
        <!-- Speedometer -->
        <path d="M90 220 A 60 60 0 0 1 210 220" fill="none" stroke="#38bdf8" stroke-width="10" stroke-linecap="round" />
        <line x1="150" y1="220" x2="190" y2="180" stroke="#ef4444" stroke-width="5" stroke-linecap="round" filter="url(#brightGlow)" />
        <text x="150" y="245" font-family="'Orbitron', sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle">120 WPM</text>
      </g>`
  },

  // 46. Basketball Shoot (Unique!)
  'basketball-shoot': {
    theme: 'speed',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="175" y="55" width="85" height="60" rx="6" fill="#ffffff" stroke="#dc2626" stroke-width="4" opacity="0.9" />
        <line x1="170" y1="115" x2="220" y2="115" stroke="#ea580c" stroke-width="6" stroke-linecap="round" />
        <polygon points="175,115 215,115 205,165 185,165" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="4 4" opacity="0.8" />
        <circle cx="100" cy="180" r="38" fill="#ea580c" stroke="#431407" stroke-width="3" filter="url(#brightGlow)" />
        <path d="M68 165 Q 100 180 132 165" fill="none" stroke="#431407" stroke-width="3" />
        <path d="M68 195 Q 100 180 132 195" fill="none" stroke="#431407" stroke-width="3" />
        <line x1="100" y1="142" x2="100" y2="218" stroke="#431407" stroke-width="3" />
        <path d="M100 180 Q 125 95 190 115" fill="none" stroke="#facc15" stroke-width="4.5" stroke-dasharray="8 6" filter="url(#brightGlow)" />
      </g>`
  },

  // 47. Crystal Sort Puzzle (Unique!)
  'crystal-sort-puzzle': {
    theme: 'purple',
    renderArt: () => `
      <g filter="url(#glow)">
        <!-- 3 Glass Crystal Flasks -->
        <rect x="60" y="65" width="40" height="160" rx="20" fill="none" stroke="#e2e8f0" stroke-width="4" />
        <rect x="62" y="145" width="36" height="40" fill="#3b82f6" />
        <rect x="62" y="105" width="36" height="40" fill="#10b981" />
        <rect x="130" y="65" width="40" height="160" rx="20" fill="none" stroke="#e2e8f0" stroke-width="4" />
        <rect x="132" y="145" width="36" height="40" fill="#ec4899" />
        <rect x="132" y="105" width="36" height="40" fill="#ec4899" />
        <rect x="200" y="65" width="40" height="160" rx="20" fill="none" stroke="#e2e8f0" stroke-width="4" />
        <rect x="202" y="145" width="36" height="40" fill="#f59e0b" />
        <!-- Floating Crystal Orbs -->
        <circle cx="80" cy="50" r="10" fill="#10b981" filter="url(#brightGlow)" />
      </g>`
  },

  // 48. Paint Splash (Unique!)
  'paint-splash': {
    theme: 'purple',
    renderArt: () => `
      <g filter="url(#glow)">
        <!-- Big Vivid Splash -->
        <path d="M150 70 Q 210 100 200 150 Q 230 200 170 210 Q 120 240 100 190 Q 70 140 110 110 Z" fill="#ec4899" filter="url(#brightGlow)" />
        <circle cx="220" cy="100" r="12" fill="#3b82f6" filter="url(#brightGlow)" />
        <circle cx="80" cy="210" r="14" fill="#eab308" filter="url(#brightGlow)" />
        <circle cx="150" cy="140" r="16" fill="#ffffff" />
        <circle cx="210" cy="215" r="10" fill="#10b981" filter="url(#brightGlow)" />
      </g>`
  },

  // 49. Ocean Gem Pop (Unique!)
  'ocean-gem-pop': {
    theme: 'cyber',
    renderArt: () => `
      <g filter="url(#glow)">
        <!-- 3D Sapphire Diamond -->
        <polygon points="150,70 210,110 190,180 110,180 90,110" fill="#06b6d4" stroke="#a5f3fc" stroke-width="3.5" filter="url(#brightGlow)" />
        <polygon points="150,105 190,130 175,165 125,165 110,130" fill="#22d3ee" />
        <circle cx="75" cy="210" r="22" fill="#3b82f6" filter="url(#brightGlow)" />
        <circle cx="225" cy="210" r="22" fill="#10b981" filter="url(#brightGlow)" />
        <!-- Air Bubbles -->
        <circle cx="120" cy="50" r="6" fill="#ffffff" opacity="0.6" />
        <circle cx="180" cy="40" r="8" fill="#ffffff" opacity="0.6" />
      </g>`
  },

  // 50. Sushi Stack (Unique!)
  'sushi-stack': {
    theme: 'speed',
    renderArt: () => `
      <g filter="url(#glow)">
        <!-- Rice Base -->
        <rect x="80" y="160" width="140" height="50" rx="25" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3" />
        <!-- Salmon Topping -->
        <path d="M70 160 C 100 130 200 130 230 160 L 220 180 C 190 150 110 150 80 180 Z" fill="#f97316" stroke="#c2410c" stroke-width="2.5" filter="url(#brightGlow)" />
        <!-- Nori Seaweed Band -->
        <rect x="135" y="140" width="30" height="75" rx="4" fill="#064e3b" stroke="#022c22" stroke-width="2" />
        <!-- Wasabi Leaf -->
        <circle cx="220" cy="195" r="12" fill="#84cc16" />
        <!-- Chopsticks -->
        <line x1="60" y1="90" x2="160" y2="150" stroke="#b45309" stroke-width="5" stroke-linecap="round" />
        <line x1="80" y1="80" x2="175" y2="155" stroke="#b45309" stroke-width="5" stroke-linecap="round" />
      </g>`
  },

  // 51. Kitty's Cafe (Unique!)
  'kitty-apos-s-caf': {
    theme: 'purple',
    renderArt: () => `
      <g filter="url(#glow)">
        <!-- Cute Cat Head with Ears -->
        <circle cx="150" cy="145" r="55" fill="#fef08a" stroke="#ca8a04" stroke-width="4" filter="url(#brightGlow)" />
        <polygon points="110,105 100,65 130,95" fill="#fef08a" stroke="#ca8a04" stroke-width="3" />
        <polygon points="190,105 200,65 170,95" fill="#fef08a" stroke="#ca8a04" stroke-width="3" />
        <!-- Eyes & Whiskers -->
        <circle cx="132" cy="135" r="6" fill="#0f172a" /><circle cx="168" cy="135" r="6" fill="#0f172a" />
        <ellipse cx="150" cy="148" rx="5" ry="3" fill="#f43f5e" />
        <line x1="95" y1="145" x2="115" y2="145" stroke="#ca8a04" stroke-width="2.5" />
        <line x1="185" y1="145" x2="205" y2="145" stroke="#ca8a04" stroke-width="2.5" />
        <!-- Coffee Cup -->
        <rect x="120" y="200" width="60" height="40" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="2.5" />
        <path d="M140 190 Q 150 180 160 190" stroke="#f59e0b" stroke-width="2" />
      </g>`
  },

  // 52. Cookie Clicker (Unique!)
  'cookie-clicker': {
    theme: 'amber',
    renderArt: () => `
      <g filter="url(#glow)">
        <circle cx="150" cy="150" r="72" fill="#d97706" stroke="#78350f" stroke-width="6" filter="url(#brightGlow)" />
        <circle cx="120" cy="120" r="10" fill="#451a03" />
        <circle cx="170" cy="125" r="12" fill="#451a03" />
        <circle cx="145" cy="155" r="14" fill="#451a03" />
        <circle cx="115" cy="175" r="11" fill="#451a03" />
        <circle cx="175" cy="175" r="9" fill="#451a03" />
        <g transform="translate(180, 175) rotate(-25)">
          <polygon points="0,0 0,40 12,28 25,48 32,44 20,24 35,24" fill="#ffffff" stroke="#000000" stroke-width="3" filter="url(#brightGlow)" />
        </g>
      </g>`
  },

  // 53. Cloud & Sheep (Unique!)
  'cloud-amp-sheep': {
    theme: 'cyber',
    renderArt: () => `
      <g filter="url(#glow)">
        <!-- Puffy Cloud Base -->
        <path d="M70 210 C 60 180 90 160 120 170 C 130 140 170 140 185 170 C 215 160 240 180 230 210 Z" fill="#ffffff" opacity="0.9" filter="url(#brightGlow)" />
        <!-- Fluffy Cartoon Sheep -->
        <ellipse cx="150" cy="125" rx="45" ry="35" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4" filter="url(#brightGlow)" />
        <circle cx="115" cy="115" r="18" fill="#1e293b" />
        <circle cx="112" cy="112" r="3" fill="#ffffff" />
        <!-- Sheep Ears -->
        <ellipse cx="102" cy="122" rx="8" ry="4" fill="#1e293b" />
      </g>`
  },

  // 54. Magic Sort (Unique!)
  'magic-sort': {
    theme: 'purple',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="70" y="65" width="40" height="150" rx="20" fill="none" stroke="#e2e8f0" stroke-width="4" />
        <path d="M72 165 H108 V195 A 18 18 0 0 1 72 195 Z" fill="#3b82f6" />
        <rect x="72" y="130" width="36" height="35" fill="#10b981" />
        <g transform="rotate(35 170 115)">
          <rect x="150" y="65" width="40" height="150" rx="20" fill="none" stroke="#e2e8f0" stroke-width="4" />
          <path d="M152 165 H188 V195 A 18 18 0 0 1 152 195 Z" fill="#ec4899" />
        </g>
        <path d="M175 140 Q 185 175 220 185" fill="none" stroke="#ec4899" stroke-width="6" stroke-linecap="round" filter="url(#brightGlow)" />
      </g>`
  },

  // 55. Watermelon Merge (Unique!)
  'watermelon-merge': {
    theme: 'emerald',
    renderArt: () => `
      <g filter="url(#glow)">
        <circle cx="150" cy="160" r="68" fill="#22c55e" stroke="#15803d" stroke-width="6" filter="url(#brightGlow)" />
        <path d="M105 140 Q 130 180 150 160 Q 170 180 195 140" fill="none" stroke="#15803d" stroke-width="6" stroke-linecap="round" />
        <circle cx="130" cy="150" r="6" fill="#064e3b" /><circle cx="170" cy="150" r="6" fill="#064e3b" />
        <circle cx="110" cy="65" r="24" fill="#ef4444" stroke="#ffffff" stroke-width="2.5" filter="url(#brightGlow)" />
        <polygon points="110,40 105,50 115,50" fill="#16a34a" />
      </g>`
  },

  // 56. Wood Block Puzzle (Unique!)
  'wood-block-puzzle': {
    theme: 'amber',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="45" y="45" width="210" height="210" rx="16" fill="#451a03" stroke="#92400e" stroke-width="5" />
        <rect x="65" y="65" width="45" height="45" rx="8" fill="#b45309" stroke="#fef3c7" stroke-width="2" />
        <rect x="115" y="65" width="45" height="45" rx="8" fill="#b45309" stroke="#fef3c7" stroke-width="2" />
        <rect x="165" y="65" width="45" height="45" rx="8" fill="#b45309" stroke="#fef3c7" stroke-width="2" />
        <g filter="url(#brightGlow)">
          <rect x="115" y="115" width="45" height="45" rx="8" fill="#f59e0b" stroke="#ffffff" stroke-width="3" />
          <rect x="165" y="115" width="45" height="45" rx="8" fill="#f59e0b" stroke="#ffffff" stroke-width="3" />
          <rect x="115" y="165" width="45" height="45" rx="8" fill="#f59e0b" stroke="#ffffff" stroke-width="3" />
        </g>
      </g>`
  },

  // 57. Bridge Builder (Unique!)
  'bridge-builder': {
    theme: 'amber',
    renderArt: () => `
      <g filter="url(#glow)">
        <!-- Chasm Cliffs -->
        <polygon points="20,280 60,180 20,180" fill="#78350f" />
        <polygon points="280,280 240,180 280,180" fill="#78350f" />
        <line x1="20" y1="180" x2="280" y2="180" stroke="#d97706" stroke-width="6.5" />
        <!-- Truss Beams -->
        <line x1="50" y1="180" x2="100" y2="100" stroke="#f59e0b" stroke-width="4.5" />
        <line x1="100" y1="100" x2="150" y2="180" stroke="#f59e0b" stroke-width="4.5" />
        <line x1="150" y1="180" x2="200" y2="100" stroke="#f59e0b" stroke-width="4.5" />
        <line x1="200" y1="100" x2="250" y2="180" stroke="#f59e0b" stroke-width="4.5" />
        <line x1="100" y1="100" x2="200" y2="100" stroke="#f59e0b" stroke-width="4.5" />
        <!-- Vehicle Crossing -->
        <rect x="130" y="160" width="40" height="18" rx="4" fill="#ef4444" filter="url(#brightGlow)" />
      </g>`
  },

  // 58. Ludo Hero AI
  'ludo-hero-ai': {
    theme: 'gold',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="40" y="45" width="105" height="105" rx="16" fill="#dc2626" />
        <rect x="155" y="45" width="105" height="105" rx="16" fill="#16a34a" />
        <rect x="40" y="160" width="105" height="105" rx="16" fill="#2563eb" />
        <rect x="155" y="160" width="105" height="105" rx="16" fill="#eab308" />
        <rect x="115" y="120" width="70" height="70" rx="18" fill="#ffffff" stroke="#00f0ff" stroke-width="4" filter="url(#brightGlow)" />
        <circle cx="130" cy="135" r="5" fill="#dc2626" /><circle cx="170" cy="135" r="5" fill="#dc2626" />
        <circle cx="150" cy="155" r="7" fill="#00f0ff" />
        <circle cx="130" cy="175" r="5" fill="#dc2626" /><circle cx="170" cy="175" r="5" fill="#dc2626" />
      </g>`
  },

  // 59. Carrom Clash AI
  'carrom-clash-ai': {
    theme: 'gold',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="35" y="35" width="230" height="230" rx="30" fill="#78350f" stroke="#ca8a04" stroke-width="5" />
        <rect x="60" y="60" width="180" height="180" fill="#fef3c7" />
        <circle cx="150" cy="150" r="40" fill="none" stroke="#dc2626" stroke-width="2.5" />
        <circle cx="150" cy="150" r="12" fill="#dc2626" stroke="#ffffff" stroke-width="2.5" filter="url(#brightGlow)" />
        <circle cx="150" cy="220" r="20" fill="url(#cyanSphere)" stroke="#00f0ff" stroke-width="3" filter="url(#brightGlow)" />
      </g>`
  },

  // 60. Chess Master AI
  'chess-master-ai': {
    theme: 'gold',
    renderArt: () => `
      <g filter="url(#glow)">
        <polygon points="50,210 250,210 280,275 20,275" fill="#0f172a" stroke="#00f0ff" stroke-width="2" />
        <path d="M150 55 V75 M140 65 H160" stroke="#00f0ff" stroke-width="4.5" stroke-linecap="round" filter="url(#brightGlow)" />
        <path d="M125 85 Q 150 70 175 85 L 170 110 H 130 Z" fill="url(#goldGradient)" stroke="#fef08a" stroke-width="2.5" />
        <path d="M135 110 Q 130 160 120 195 H 180 Q 170 160 165 110 Z" fill="url(#goldGradient)" stroke="#00f0ff" stroke-width="2.5" filter="url(#brightGlow)" />
        <ellipse cx="150" cy="200" rx="44" ry="15" fill="#0284c7" stroke="#00f0ff" stroke-width="2.5" />
        <circle cx="150" cy="140" r="10" fill="#00f0ff" filter="url(#brightGlow)" />
      </g>`
  },

  // 61. Checkers Classic AI
  'checkers-classic-ai': {
    theme: 'fire',
    renderArt: () => `
      <g filter="url(#glow)">
        <polygon points="40,180 260,180 280,265 20,265" fill="#1c1917" stroke="#dc2626" stroke-width="2" />
        <ellipse cx="150" cy="140" rx="48" ry="22" fill="#ef4444" stroke="#ffffff" stroke-width="3.5" filter="url(#brightGlow)" />
        <ellipse cx="150" cy="132" rx="38" ry="16" fill="#dc2626" />
        <polygon points="135,130 140,115 150,123 160,115 165,130" fill="#facc15" stroke="#ffffff" stroke-width="1.5" />
      </g>`
  },

  // 62. Connect 4 Arena AI
  'connect4-arena-ai': {
    theme: 'cyber',
    renderArt: () => `
      <g filter="url(#glow)">
        <rect x="35" y="65" width="230" height="180" rx="18" fill="#1d4ed8" stroke="#60a5fa" stroke-width="4.5" filter="url(#brightGlow)" />
        <circle cx="75" cy="100" r="16" fill="#ef4444" filter="url(#brightGlow)" />
        <circle cx="125" cy="100" r="16" fill="#1e3a8a" />
        <circle cx="175" cy="100" r="16" fill="#facc15" filter="url(#brightGlow)" />
        <circle cx="225" cy="100" r="16" fill="#1e3a8a" />
        <circle cx="75" cy="150" r="16" fill="#facc15" filter="url(#brightGlow)" />
        <circle cx="125" cy="150" r="16" fill="#ef4444" filter="url(#brightGlow)" />
        <circle cx="175" cy="150" r="16" fill="#ef4444" filter="url(#brightGlow)" />
        <circle cx="225" cy="150" r="16" fill="#facc15" filter="url(#brightGlow)" />
        <circle cx="75" cy="200" r="16" fill="#facc15" filter="url(#brightGlow)" />
        <circle cx="125" cy="200" r="16" fill="#facc15" filter="url(#brightGlow)" />
        <circle cx="175" cy="200" r="16" fill="#ef4444" filter="url(#brightGlow)" />
        <circle cx="225" cy="200" r="16" fill="#ef4444" filter="url(#brightGlow)" />
        <circle cx="125" cy="35" r="16" fill="#ef4444" stroke="#ffffff" stroke-width="2.5" filter="url(#brightGlow)" />
      </g>`
  },

  // 63. TicTacToe Neon AI
  'tictactoe-neon-ai': {
    theme: 'purple',
    renderArt: () => `
      <g filter="url(#glow)">
        <line x1="110" y1="50" x2="110" y2="250" stroke="#a855f7" stroke-width="6" stroke-linecap="round" filter="url(#brightGlow)" />
        <line x1="190" y1="50" x2="190" y2="250" stroke="#a855f7" stroke-width="6" stroke-linecap="round" filter="url(#brightGlow)" />
        <line x1="40" y1="115" x2="260" y2="115" stroke="#a855f7" stroke-width="6" stroke-linecap="round" filter="url(#brightGlow)" />
        <line x1="40" y1="185" x2="260" y2="185" stroke="#a855f7" stroke-width="6" stroke-linecap="round" filter="url(#brightGlow)" />
        <g filter="url(#brightGlow)">
          <line x1="55" y1="60" x2="95" y2="100" stroke="#00f0ff" stroke-width="8" stroke-linecap="round" />
          <line x1="95" y1="60" x2="55" y2="100" stroke="#00f0ff" stroke-width="8" stroke-linecap="round" />
        </g>
        <circle cx="150" cy="150" r="22" fill="none" stroke="#ec4899" stroke-width="8" filter="url(#brightGlow)" />
      </g>`
  }
};

const THEMES = {
  emerald: { bg1: '#041c14', bg2: '#064e3b', glow: '#10b981' },
  amber: { bg1: '#1f1304', bg2: '#78350f', glow: '#f59e0b' },
  cyber: { bg1: '#040d21', bg2: '#0284c7', glow: '#00f0ff' },
  speed: { bg1: '#1a040b', bg2: '#991b1b', glow: '#ef4444' },
  fire: { bg1: '#1a0604', bg2: '#c2410c', glow: '#f97316' },
  purple: { bg1: '#130424', bg2: '#6b21a8', glow: '#c084fc' },
  gold: { bg1: '#181204', bg2: '#854d0e', glow: '#eab308' }
};

function generateSvgPoster(slug, def) {
  const theme = THEMES[def.theme] || THEMES.cyber;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bg1}" />
      <stop offset="50%" stop-color="#080c18" />
      <stop offset="100%" stop-color="${theme.bg2}" stop-opacity="0.8" />
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="brightGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="12" result="blur1" />
      <feGaussianBlur stdDeviation="3" result="blur2" />
      <feMerge>
        <feMergeNode in="blur1" />
        <feMergeNode in="blur2" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <radialGradient id="cyanSphere" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="40%" stop-color="#00f0ff" />
      <stop offset="100%" stop-color="#0369a1" />
    </radialGradient>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#a16207" />
    </linearGradient>
    <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 20 M 0 0 L 20 20" fill="none" stroke="#ffffff" stroke-width="0.5" stroke-opacity="0.04" />
    </pattern>
  </defs>

  <rect width="300" height="300" fill="url(#bgGrad)" />
  <rect width="300" height="300" fill="url(#gridPattern)" />
  <circle cx="150" cy="150" r="120" fill="${theme.glow}" opacity="0.18" filter="url(#brightGlow)" />

  <g transform="translate(0, 5)">
    ${def.renderArt()}
  </g>
</svg>`;
}

// Generate for all catalog games
const catalog = require('../parsed_games_57.json');
let generatedCount = 0;

for (const game of catalog) {
  if (HERO_ART[game.slug]) {
    const svgContent = generateSvgPoster(game.slug, HERO_ART[game.slug]);
    const filePath = path.join(postersDir, `${game.slug}.svg`);
    fs.writeFileSync(filePath, svgContent, 'utf8');
    generatedCount++;
  } else {
    console.warn(`Missing custom art definition for: ${game.slug}`);
  }
}

// Generate for AI bot games
const aiGames = ['ludo-hero-ai', 'carrom-clash-ai', 'chess-master-ai', 'checkers-classic-ai', 'connect4-arena-ai', 'tictactoe-neon-ai'];
for (const slug of aiGames) {
  if (HERO_ART[slug]) {
    const svgContent = generateSvgPoster(slug, HERO_ART[slug]);
    const filePath = path.join(postersDir, `${slug}.svg`);
    fs.writeFileSync(filePath, svgContent, 'utf8');
    generatedCount++;
  }
}

console.log(`ALL DONE! Successfully generated ${generatedCount} 100% UNIQUE custom posters with ZERO generic fallbacks!`);
