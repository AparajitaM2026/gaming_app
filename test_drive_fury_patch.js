const fs = require('fs');

let html = fs.readFileSync('scratch_drive_fury.html', 'utf8');

console.log('Original length:', html.length);
console.log('Contains DRIVE FURY:', html.includes('DRIVE FURY'));

// 1. Boost vehicles speed and power
const origVehicles = html.includes("id:'dusty_truck', name:'Dusty Truck', mass:1.0, power:1.0");
html = html.replace(
  "{ id:'dusty_truck', name:'Dusty Truck', mass:1.0, power:1.0, grip:1.0, stability:0.8,\n    color:'#ff8800', accent:'#cc6600', w:70, h:34, wheelR:10, wheelBase:54,\n    cogH:20, maxSpeed:420,",
  "{ id:'dusty_truck', name:'Dusty Truck', mass:1.0, power:1.4, grip:1.2, stability:0.9,\n    color:'#ff8800', accent:'#cc6600', w:70, h:34, wheelR:10, wheelBase:54,\n    cogH:20, maxSpeed:650,"
);
html = html.replace(
  "{ id:'sand_buggy', name:'Sand Buggy', mass:0.7, power:1.3, grip:0.7, stability:0.5,\n    color:'#ffcc00', accent:'#aa8800', w:62, h:28, wheelR:9, wheelBase:46,\n    cogH:17, maxSpeed:520,",
  "{ id:'sand_buggy', name:'Sand Buggy', mass:0.7, power:1.7, grip:0.9, stability:0.6,\n    color:'#ffcc00', accent:'#aa8800', w:62, h:28, wheelR:9, wheelBase:46,\n    cogH:17, maxSpeed:780,"
);
html = html.replace(
  "{ id:'monster_truck', name:'Monster Truck', mass:1.8, power:0.8, grip:1.2, stability:1.2,\n    color:'#ee2222', accent:'#aa0000', w:80, h:42, wheelR:14, wheelBase:60,\n    cogH:24, maxSpeed:340,",
  "{ id:'monster_truck', name:'Monster Truck', mass:1.8, power:1.3, grip:1.4, stability:1.3,\n    color:'#ee2222', accent:'#aa0000', w:80, h:42, wheelR:14, wheelBase:60,\n    cogH:24, maxSpeed:550,"
);

// 2. Add touchJump & update pointer handlers
const origPointers = html.includes('let touchAccel = false, touchBrake = false;');
html = html.replace(
  'let touchAccel = false, touchBrake = false;',
  'let touchAccel = false, touchBrake = false, touchJump = false;'
);

html = html.replace(
  "function getInput() {\n  const accel = keys['ArrowRight'] || keys['KeyD'] || keys['ArrowUp'] || keys['KeyW'] || touchAccel;\n  const brake = keys['ArrowLeft'] || keys['KeyA'] || keys['ArrowDown'] || keys['KeyS'] || touchBrake;\n  return { accel, brake };\n}",
  `function getInput() {
  const accel = keys['ArrowRight'] || keys['KeyD'] || touchAccel;
  const brake = keys['ArrowLeft'] || keys['KeyA'] || touchBrake;
  const jump = keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || touchJump;
  return { accel, brake, jump };
}`
);

html = html.replace(
  "if (gameState === 'playing' || gameState === 'endless') {\n    if (isMobile) {\n      if (x < W * 0.5) touchBrake = true; else touchAccel = true;\n    }\n  }",
  `if (gameState === 'playing' || gameState === 'endless') {
    if (y < H * 0.45) {
      touchJump = true;
    } else if (x < W * 0.5) {
      touchBrake = true;
    } else {
      touchAccel = true;
    }
  }`
);

html = html.replace(
  "function handlePointerUp() { touchAccel = false; touchBrake = false; }",
  "function handlePointerUp() { touchAccel = false; touchBrake = false; touchJump = false; }"
);

// 3. Update updateGame signature and callers
html = html.replace(
  "function updateGame(g, dt, accel, brake) {",
  "function updateGame(g, dt, accel, brake, jump) {"
);

html = html.replace(
  "const result = updatePhysics(g, dt, accel, brake);",
  "const result = updatePhysics(g, dt, accel, brake, jump);"
);

html = html.replace(
  "updateGame(game, dt, inp.accel, inp.brake);",
  "updateGame(game, dt, inp.accel, inp.brake, inp.jump);"
);

html = html.replace(
  "if (game.endless) updateGame(game, dt, inp.accel, inp.brake);",
  "// endless single update"
);

// 4. Update updatePhysics with punchy force, JUMP impulse, and in-air tilt control
const origDriveForce = html.includes("const force = dir * def.power * 650 * def.grip;");
html = html.replace(
  `    // Drive force
    if (contact) {
      const ta = getTerrainAngle(pts, v.x);
      const dir = accel ? 1 : (brake ? -0.6 : 0);
      if (dir !== 0) {
        const force = dir * def.power * 650 * def.grip;
        v.vx += (Math.cos(ta) * force * sdt) / def.mass;
        v.vy += (Math.sin(ta) * force * sdt) / def.mass;
      }
      // Ground friction
      v.vx *= (1 - GROUND_FRIC * sdt * 0.1);
      // Speed limit
      const spd = Math.abs(v.vx);
      if (spd > def.maxSpeed) v.vx *= def.maxSpeed / spd;
    }`,
  `    // Drive force & Jump
    if (contact) {
      const ta = getTerrainAngle(pts, v.x);
      const dir = accel ? 1 : (brake ? -0.6 : 0);
      if (dir !== 0) {
        const force = dir * def.power * 1350 * def.grip;
        v.vx += (Math.cos(ta) * force * sdt) / def.mass;
        v.vy += (Math.sin(ta) * force * sdt) / def.mass;
      }
      // Hydraulic Spring Jump
      if (jump && (!v.jumpCooldown || v.jumpCooldown <= 0)) {
        v.vy = -620; // Vault high into the air!
        v.vx += 120; // Forward leaping boost
        v.jumpCooldown = 0.35;
        try { playSound('checkpoint'); } catch(e) {}
      }
      // Ground friction
      v.vx *= (1 - GROUND_FRIC * sdt * 0.1);
      // Speed limit
      const spd = Math.abs(v.vx);
      if (spd > def.maxSpeed) v.vx *= def.maxSpeed / spd;
    } else {
      // In-air aerial tilt control
      if (accel) {
        v.av += 6.0 * sdt;
      } else if (brake) {
        v.av -= 6.0 * sdt;
      }
    }`
);

// 5. Update jump cooldown timer
html = html.replace(
  "v.wheelAngle += v.speed * sdt * 0.1;",
  "v.wheelAngle += v.speed * sdt * 0.1;\n    if (v.jumpCooldown > 0) v.jumpCooldown -= sdt;"
);

// 6. Update HUD hint & Mobile controls
html = html.replace(
  "ctx.fillText(isMobile ? 'Tap left/right to control' : 'Arrow keys or WASD to drive', cx, H - 30);",
  "ctx.fillText(isMobile ? 'Tap Bottom: Drive/Brake | Tap Top: JUMP' : '[→]/[D] Gas | [←]/[A] Brake | [SPACE]/[↑]/[W] JUMP!', cx, H - 30);"
);

html = html.replace(
  `  // Left zone (brake)`,
  `  // Top zone (jump)
  ctx.fillStyle = 'rgba(0,200,255,0.15)';
  ctx.fillRect(W * 0.2, 0, W * 0.6, H * 0.35);
  ctx.strokeStyle = 'rgba(0,200,255,0.4)'; ctx.lineWidth = 2;
  ctx.strokeRect(W * 0.2, 0, W * 0.6, H * 0.35);
  ctx.fillStyle = 'rgba(0,255,255,0.8)'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('⬆ TAP TO JUMP ⬆', W * 0.5, H * 0.2);

  // Left zone (brake)`
);

console.log('Vehicles patched:', origVehicles && html.includes('power:1.4') && html.includes('maxSpeed:650'));
console.log('Pointers patched:', origPointers && html.includes('touchJump = false;'));
console.log('Drive force & Jump patched:', origDriveForce && html.includes('v.vy = -620;'));
console.log('Jump cooldown patched:', html.includes('v.jumpCooldown -= sdt;'));

fs.writeFileSync('scratch_drive_fury_patched.html', html);
console.log('Wrote scratch_drive_fury_patched.html');
