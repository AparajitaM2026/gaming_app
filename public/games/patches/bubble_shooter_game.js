(function(){
'use strict';
const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');
const container=document.getElementById('gameContainer');

// Game state & dimensions declared at top to avoid any TDZ ReferenceError
let W=480, H=720, bubbleRadius=24, bubbleDiam=48, gridOffsetX=240, gridOffsetY=32;
let rafId=null, isRunning=false, lastTime=0;
let timers=[];
let audioCtx=null, audioEnabled=true, musicEnabled=true;
let bgmOsc=null, bgmGain=null, bgmInterval=null, bgmChordIndex=0;
const BGM_CHORDS=[[130.81,164.81,196],[146.83,174.61,220],[164.81,196,246.94],[130.81,164.81,196]];
const COLORS=['#ff4757','#3742fa','#2ed573','#ffa502','#a55eea','#ff6348'];
const COLOR_NAMES=['red','blue','green','yellow','purple','orange'];
let currentScreen='title';
let isPointerAiming=false;

let level=null, lvlIdx=1, grid=[], bubbles=[], shooter=null, score=0, shotsLeft=30, combo=0;
let animating=false, particles=[], floatingBubbles=[];
let gameOverFlag=false, aimAngle=-Math.PI/2, canShoot=true, hintText=null, tutorialStep=0;
let swapUses=3;

let gameState={
  v:1,
  levelStars:{},
  unlockedLevel:0,
  bestScores:{},
  sfxOn:true,
  musicOn:true
};

function loadState(){
  try{
    const s=localStorage.getItem('bubbleShooter_v1');
    if(s){
      const parsed=JSON.parse(s);
      if(parsed.v===1){
        gameState.levelStars=parsed.levelStars||{};
        gameState.unlockedLevel=parsed.unlockedLevel||0;
        gameState.bestScores=parsed.bestScores||{};
        gameState.sfxOn=parsed.sfxOn!==undefined?parsed.sfxOn:true;
        gameState.musicOn=parsed.musicOn!==undefined?parsed.musicOn:true;
      }
    }
  }catch(e){}
  audioEnabled=gameState.sfxOn;
  musicEnabled=gameState.musicOn;
  updateSettingsUI();
}

function saveState(){
  gameState.sfxOn=audioEnabled;
  gameState.musicOn=musicEnabled;
  try{localStorage.setItem('bubbleShooter_v1',JSON.stringify(gameState));}catch(e){}
}

function updateSettingsUI(){
  const sfxEl = document.getElementById('sfxToggle');
  const musEl = document.getElementById('musicToggle');
  if(sfxEl) sfxEl.classList.toggle('on',audioEnabled);
  if(musEl) musEl.classList.toggle('on',musicEnabled);
}
loadState();

function resize(){
  const rect=container ? container.getBoundingClientRect() : {width:480, height:720};
  const dpr=window.devicePixelRatio||1;
  const availW = rect.width > 0 ? rect.width : (window.innerWidth || 480);
  const availH = rect.height > 0 ? rect.height : (window.innerHeight || 720);
  W=Math.max(300, Math.min(availW, 480));
  H=Math.max(450, Math.min(availH, 720));
  canvas.width=W*dpr;
  canvas.height=H*dpr;
  canvas.style.width=W+'px';
  canvas.style.height=H+'px';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr,dpr);
  bubbleRadius=Math.floor(W/13);
  bubbleDiam=bubbleRadius*2;
  gridOffsetX=W/2;
  gridOffsetY=bubbleRadius+8;
  if(shooter){
    shooter.x = W/2;
    shooter.y = H - bubbleRadius - 50;
  }
}
resize();
window.addEventListener('resize',resize);

function showScreen(name){
  currentScreen=name;
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById(name+'Screen')||document.getElementById(name.replace(/([A-Z])/g,'$1').toLowerCase()+'Screen');
  if(el) el.classList.add('active');
  if(name==='title'||name==='levelSelect') stopBGM();
}

function initFloatingBubbles(){
  const fb=document.getElementById('floatingBubbles');
  if(!fb) return;
  fb.innerHTML='';
  for(let i=0;i<15;i++){
    const b=document.createElement('div');
    b.className='floating-bubble';
    const size=10+Math.random()*20;
    b.style.width=size+'px';
    b.style.height=size+'px';
    b.style.left=Math.random()*100+'%';
    b.style.background=COLORS[Math.floor(Math.random()*COLORS.length)];
    b.style.animationDuration=(8+Math.random()*12)+'s';
    b.style.animationDelay=Math.random()*10+'s';
    fb.appendChild(b);
  }
}

function createLevelGrid(){
  const gridEl=document.getElementById('levelGrid');
  if(!gridEl) return;
  gridEl.innerHTML='';
  const packNames=['Pack 1','Pack 2','Pack 3','Pack 4','Pack 5'];
  for(let p=0;p<5;p++){
    const label=document.createElement('div');
    label.className='pack-label';
    label.textContent=packNames[p];
    gridEl.appendChild(label);
    for(let i=0;i<6;i++){
      const lvl=p*6+i+1;
      const btn=document.createElement('button');
      btn.className='level-btn';
      btn.dataset.level=lvl;
      const stars=gameState.levelStars[lvl]||0;
      const unlocked=lvl<=gameState.unlockedLevel+1;
      if(unlocked) btn.classList.add('unlocked');
      else btn.classList.add('locked');
      btn.innerHTML=lvl+'<div class="level-stars">'+(stars>0?'★'.repeat(stars):'---')+'</div>';
      if(unlocked){
        btn.addEventListener('click',()=>startLevel(lvl));
      }
      gridEl.appendChild(btn);
    }
  }
}

function seededRandom(seed){
  let s=seed;
  return function(){
    s=(s*9301+49297)%233280;
    return s/233280;
  };
}

function generateLevels(){
  const levels=[];
  const packConfigs=[
    {colors:3,rowsMin:3,rowsMax:4,stones:0,bombs:0,rainbows:0,density:.5,seed:1000},
    {colors:4,rowsMin:4,rowsMax:5,stones:.1,bombs:0,rainbows:0,density:.6,seed:2000},
    {colors:5,rowsMin:4,rowsMax:5,stones:.2,bombs:.05,rainbows:.03,density:.65,seed:3000},
    {colors:5,rowsMin:5,rowsMax:6,stones:.15,bombs:.1,rainbows:.05,density:.7,seed:4000},
    {colors:6,rowsMin:5,rowsMax:6,stones:.1,bombs:.15,rainbows:.08,density:.75,seed:5000}
  ];
  const levelNames=[
    'First Pop','Color Match','Quick Shot','Chain Reaction','Double Trouble',
    'Triple Threat','Color Wave','Rapid Fire','Rainbow Mix','Stone Garden',
    'Bomb Squad','Explosive','Chromatic','Mosaic','Triple Combo',
    'Stone Cold','Bombardment','Chromatic Wave','Mosaic Plus','Diamond',
    'Neon Nights','Solar Flare','Thunder Storm','Iceberg','Volcano',
    'Aurora','Galaxy','Nebula','Supernova','Cosmic'
  ];
  const SHOT_BOOST={13:4,16:4,20:4,22:4,24:4,25:4,26:4,27:4,28:4,30:4};
  for(let p=0;p<5;p++){
    const cfg=packConfigs[p];
    for(let i=0;i<6;i++){
      const lvl=p*6+i+1;
      const rng=seededRandom(cfg.seed+lvl*100);
      const rows=Math.floor(cfg.rowsMin+rng()*(cfg.rowsMax-cfg.rowsMin+1));
      const shots=Math.max(12,Math.floor(rows*3.5+rng()*5))+(SHOT_BOOST[lvl]||0);
      const baseScore=rows*100+lvl*50;
      const pattern=[];
      for(let r=0;r<rows;r++){
        const row=[];
        const cols=r%2===0?11:10;
        for(let c=0;c<cols;c++){
          if(rng()<cfg.density){
            const val=rng();
            let type=Math.ceil(rng()*cfg.colors);
            if(val<.02&&cfg.rainbows>0)type=7;
            else if(val<.08&&cfg.stones>0)type=-1;
            else if(val<.15&&cfg.bombs>0&&r>0)type=8;
            row.push(type);
          }else{
            row.push(0);
          }
        }
        pattern.push(row);
      }
      levels.push({
        name:levelNames[lvl-1],
        colors:cfg.colors,
        rows:rows,
        shots:shots,
        starThresholds:[baseScore,baseScore*2,baseScore*3],
        pattern:pattern
      });
    }
  }
  return levels;
}
const LEVELS=generateLevels();

function startLevel(idx){
  lvlIdx=idx;
  level=LEVELS[idx-1];
  score=0;shotsLeft=level.shots;combo=0;swapUses=3;
  animating=false;gameOverFlag=false;canShoot=true;hintText=null;tutorialStep=0;
  if(idx===1)tutorialStep=1;
  else if(idx===2)tutorialStep=2;
  else if(idx===3)tutorialStep=3;
  particles=[];floatingBubbles=[];bubbles=[];
  initGrid();
  initShooter();
  updateUI();
  showScreen('game');
  showHint();
  if(!isRunning){
    isRunning=true;
    lastTime=performance.now();
    rafId=requestAnimationFrame(loop);
  }
}

function initGrid(){
  grid=[];
  const rows=level.pattern.length;
  for(let r=0;r<rows;r++){
    grid[r]=[];
    const cols=r%2===0?11:10;
    for(let c=0;c<cols;c++){
      const val=level.pattern[r][c]||0;
      if(val!==0){
        const bx=getGridX(r,c);
        const by=getGridY(r);
        grid[r][c]={color:val,x:bx,y:by,row:r,col:c,scale:1,alpha:1};
      }else{
        grid[r][c]=null;
      }
    }
  }
}

function initShooter(){
  const nextColor=Math.ceil(Math.random()*level.colors);
  const currColor=Math.ceil(Math.random()*level.colors);
  shooter={x:W/2,y:H-bubbleRadius-50,angle:-Math.PI/2,current:currColor,next:nextColor};
  aimAngle=-Math.PI/2;
}

function getGridX(row,col){
  const offset=row%2===0?0:bubbleRadius;
  return col*bubbleDiam+offset+bubbleRadius+8;
}

function getGridY(row){
  return row*bubbleDiam*0.866+gridOffsetY;
}

function getNeighbors(row,col){
  const neighbors=[];
  const even=row%2===0;
  const adj=[[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]];
  for(const [dr,dc] of adj){
    const nr=row+dr;
    const nc=col+dc+(even&&dr===-1?0:even&&dr===1?0:(!even&&dr===-1?1:(!even&&dr===1?-1:0)));
    if(nr>=0&&nc>=0&&grid[nr]&&grid[nr][nc]){
      neighbors.push({row:nr,col:nc,bubble:grid[nr][nc]});
    }
  }
  return neighbors;
}

function addBubbleToGrid(row,col,color){
  while(grid.length<=row){
    grid.push([]);
  }
  const cols=row%2===0?11:10;
  const safeCol=Math.max(0,Math.min(cols-1,col));
  grid[row][safeCol]={color,x:getGridX(row,safeCol),y:getGridY(row),row,col:safeCol,scale:1,alpha:1};
  return true;
}

function findSnapPoint(x,y){
  let bestR=0,bestC=0,bestDist=Infinity;
  const maxRow=grid.length+2;
  for(let r=0;r<=maxRow;r++){
    const cols=r%2===0?11:10;
    for(let c=0;c<cols;c++){
      if(grid[r]&&grid[r][c]) continue;
      // Valid snap cell must touch the ceiling (row 0) or an existing bubble
      if(r > 0 && getNeighbors(r, c).length === 0) continue;
      const gx=getGridX(r,c);
      const gy=getGridY(r);
      const d=Math.hypot(x-gx,y-gy);
      if(d<bestDist){
        bestDist=d;bestR=r;bestC=c;
      }
    }
  }
  return {row:bestR,col:bestC};
}

function floodFill(startRow,startCol,targetColor){
  const visited=new Set();
  const found=[];
  const queue=[{row:startRow,col:startCol}];
  while(queue.length){
    const {row,col}=queue.shift();
    const key=row+','+col;
    if(visited.has(key))continue;
    visited.add(key);
    if(!grid[row]||!grid[row][col])continue;
    const bubble=grid[row][col];
    if(bubble.color!==targetColor && bubble.color!==7)continue;
    found.push({row,col,bubble});
    const neighbors=getNeighbors(row,col);
    for(const n of neighbors){
      if(!visited.has(n.row+','+n.col)){
        queue.push({row:n.row,col:n.col});
      }
    }
  }
  return found;
}

function findFloating(){
  const attached=new Set();
  const queue=[];
  const topCols=grid[0]?grid[0].length:0;
  for(let c=0;c<topCols;c++){
    if(grid[0]&&grid[0][c]){
      queue.push({row:0,col:c});
      attached.add('0,'+c);
    }
  }
  while(queue.length){
    const {row,col}=queue.shift();
    const neighbors=getNeighbors(row,col);
    for(const n of neighbors){
      const key=n.row+','+n.col;
      if(!attached.has(key)&&n.bubble&&n.bubble.color!==-1){
        attached.add(key);
        queue.push({row:n.row,col:n.col});
      }
    }
  }
  const floating=[];
  for(let r=0;r<grid.length;r++){
    if(!grid[r])continue;
    for(let c=0;c<grid[r].length;c++){
      if(grid[r][c]&&!attached.has(r+','+c)){
        floating.push({row:r,col:c,bubble:grid[r][c]});
      }
    }
  }
  return floating;
}

function popBubbles(bubblesToPop){
  const processed=new Set();
  for(let i=0;i<bubblesToPop.length;i++){
    const {row,col,bubble}=bubblesToPop[i];
    const key=row+','+col;
    if(processed.has(key)) continue;
    processed.add(key);
    if(bubble.color===-1) continue;
    if(bubble.color===8){
      const neighbors=getNeighbors(row,col);
      for(const n of neighbors){
        if(grid[n.row]&&grid[n.row][n.col]&&grid[n.row][n.col].color!==-1){
          const nKey=n.row+','+n.col;
          if(!processed.has(nKey)){
            bubblesToPop.push(n);
          }
        }
      }
    }
    spawnParticles(bubble.x,bubble.y,bubble.color);
    if(grid[row]) grid[row][col]=null;
  }
}

function dropBubbles(bubblesToDrop){
  for(const {bubble} of bubblesToDrop){
    if(bubble.color===-1)continue;
    floatingBubbles.push({x:bubble.x,y:bubble.y,vx:(Math.random()-.5)*2,vy:0,color:bubble.color,alpha:1});
    spawnParticles(bubble.x,bubble.y,bubble.color,5);
    if(grid[bubble.row]) grid[bubble.row][bubble.col]=null;
  }
}

function spawnParticles(x,y,color,count=8){
  for(let i=0;i<count;i++){
    const angle=Math.random()*Math.PI*2;
    const speed=1+Math.random()*3;
    particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,color,radius:2+Math.random()*3,alpha:1,life:1});
  }
}

function checkGameOver(){
  for(let r=0;r<grid.length;r++){
    if(!grid[r])continue;
    for(let c=0;c<grid[r].length;c++){
      if(grid[r][c]){
        const gy=getGridY(r);
        if(gy+bubbleRadius>H-100)return true;
      }
    }
  }
  return false;
}

function updateUI(){
  const sEl=document.getElementById('scoreValue');
  const shEl=document.getElementById('shotsValue');
  const lEl=document.getElementById('levelDisplay');
  if(sEl) sEl.textContent=score;
  if(shEl) shEl.textContent=shotsLeft;
  if(lEl) lEl.textContent='Level '+lvlIdx;
}

function showHint(){
  const el=document.getElementById('hintBox');
  if(!el) return;
  if(tutorialStep===1){
    el.textContent='Aim with mouse or touch, tap to shoot';
    el.style.display='block';
  }else if(tutorialStep===2){
    el.textContent='Match 3+ same colors to pop';
    el.style.display='block';
  }else if(tutorialStep===3){
    el.textContent='Dropped bubbles give bonus points';
    el.style.display='block';
  }else{
    el.style.display='none';
  }
}

function swapBubble(){
  if(swapUses<=0||animating||!canShoot) return false;
  const tmp=shooter.current;
  shooter.current=shooter.next;
  shooter.next=tmp;
  swapUses--;
  playSFX('click');
  return true;
}

function shoot(){
  if(!canShoot||animating||shotsLeft<=0)return;
  canShoot=false;
  animating=true;
  shotsLeft--;
  updateUI();
  playSFX('shoot');
  const speed=14;
  const vx=Math.cos(shooter.angle)*speed;
  const vy=Math.sin(shooter.angle)*speed;
  bubbles.push({x:shooter.x,y:shooter.y,vx,vy,color:shooter.current,bounced:false});
  shooter.current=shooter.next;
  shooter.next=Math.ceil(Math.random()*level.colors);
  tutorialStep=0;
  showHint();
}

function updateBubbles(dt){
  const subSteps=4;
  for(let i=bubbles.length-1;i>=0;i--){
    const b=bubbles[i];
    const svx=(b.vx*dt)/subSteps;
    const svy=(b.vy*dt)/subSteps;
    let collided=false;

    for(let s=0;s<subSteps;s++){
      b.x+=svx;
      b.y+=svy;
      if(b.x<bubbleRadius){
        b.x=bubbleRadius;
        b.vx*=-1;
        b.bounced=true;
      }
      if(b.x>W-bubbleRadius){
        b.x=W-bubbleRadius;
        b.vx*=-1;
        b.bounced=true;
      }

      // Check ceiling collision
      if(b.y<bubbleRadius+gridOffsetY){
        collided=true;
        break;
      }

      // Check collision with ANY existing grid bubble
      const hitRadius=bubbleDiam*0.88;
      for(let r=0;r<grid.length;r++){
        if(!grid[r]) continue;
        for(let c=0;c<grid[r].length;c++){
          const gb=grid[r][c];
          if(gb && gb.color!==0){
            const dist=Math.hypot(b.x-gb.x, b.y-gb.y);
            if(dist<hitRadius){
              collided=true;
              break;
            }
          }
        }
        if(collided) break;
      }
      if(collided) break;
    }

    if(collided){
      const snap=findSnapPoint(b.x,b.y);
      attachBubble(b, snap.row, snap.col);
      bubbles.splice(i,1);
      return;
    }
  }
}

function attachBubble(b,row,col){
  try {
    addBubbleToGrid(row,col,b.color);
    const targetColor=b.color;
    let matched=[];

    if(targetColor===8){
      // Bomb explosion: hit itself and all surrounding neighbors
      matched=[{row,col,bubble:grid[row][col]}];
      const neighbors=getNeighbors(row,col);
      for(const n of neighbors){
        matched.push(n);
      }
    }else{
      matched=floodFill(row,col,targetColor);
    }

    if(matched.length>=3||b.color===7||b.color===8){
      if(b.color===7){
        const allColors={};
        const neighbors=getNeighbors(row,col);
        for(const n of neighbors){
          if(n.bubble&&n.bubble.color>0&&n.bubble.color<7){
            allColors[n.bubble.color]=true;
          }
        }
        const colors=Object.keys(allColors).map(Number);
        if(colors.length===0)colors.push(1);
        const floodAll=[];
        for(const cCol of colors){
          for(let r=0;r<grid.length;r++){
            if(!grid[r])continue;
            for(let c=0;c<grid[r].length;c++){
              if(grid[r][c]&&grid[r][c].color===cCol){
                if(!floodAll.find(fb=>fb.row===r&&fb.col===c)){
                  floodAll.push({row:r,col:c,bubble:grid[r][c]});
                }
              }
            }
          }
        }
        matched=floodAll;
      }
      combo++;
      const pts=matched.length*10*combo;
      score+=pts;
      popBubbles(matched);
      const floating=findFloating();
      if(floating.length>0){
        score+=floating.length*15*combo;
        dropBubbles(floating);
        playSFX('drop');
      }else{
        playSFX('pop');
      }
      updateUI();
      checkLevelClear();
    }else{
      combo=0;
      checkGameOver2();
    }
  } finally {
    canShoot=true;
    animating=false;
  }
}

function checkGameOver2(){
  if(checkGameOver()||(shotsLeft<=0&&!checkHasBubblesCleared())){
    gameOverFlag=true;
    setTimeout(()=>{
      const sEl=document.getElementById('gameOverScore');
      if(sEl) sEl.textContent=score;
      showScreen('gameOver');
      playSFX('gameOver');
    },500);
  }
}

function checkHasBubblesCleared(){
  for(let r=0;r<grid.length;r++){
    if(!grid[r])continue;
    for(let c=0;c<grid[r].length;c++){
      if(grid[r][c]&&grid[r][c].color>0){
        return false;
      }
    }
  }
  return true;
}

function checkLevelClear(){
  if(checkHasBubblesCleared()){
    const bonus=shotsLeft*50;
    score+=bonus;
    const stars=getStars(score);
    gameState.levelStars[lvlIdx]=Math.max(gameState.levelStars[lvlIdx]||0,stars);
    gameState.bestScores[lvlIdx]=Math.max(gameState.bestScores[lvlIdx]||0,score);
    if(lvlIdx>=gameState.unlockedLevel+1&&lvlIdx<30){
      gameState.unlockedLevel=lvlIdx;
    }
    saveState();
    const fsEl=document.getElementById('finalScore');
    const biEl=document.getElementById('bonusInfo');
    const csEl=document.getElementById('completeStars');
    const nbEl=document.getElementById('nextLevelBtn');
    if(fsEl) fsEl.textContent=score;
    if(biEl) biEl.textContent='Shots bonus: +'+bonus;
    if(csEl) csEl.innerHTML=renderStars(stars);
    if(nbEl) nbEl.style.display=lvlIdx<30?'flex':'none';
    playSFX('levelComplete');
    showScreen('levelComplete');
  }
}

function getStars(s){
  if(s>=level.starThresholds[2])return 3;
  if(s>=level.starThresholds[1])return 2;
  if(s>=level.starThresholds[0])return 1;
  return 1;
}

function renderStars(n){
  let html='';
  for(let i=0;i<3;i++){
    html+='<div class="star'+(i<n?' earned':'')+'"></div>';
  }
  return html;
}

function updateParticles(dt){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx;
    p.y+=p.vy;
    p.vy+=.1;
    p.life-=.02;
    p.alpha=p.life;
    p.radius*=0.98;
    if(p.life<=0)particles.splice(i,1);
  }
}

function updateFloatingBubbles(dt){
  for(let i=floatingBubbles.length-1;i>=0;i--){
    const f=floatingBubbles[i];
    f.vy+=.3;
    f.x+=f.vx;
    f.y+=f.vy;
    f.alpha-=.01;
    if(f.y>H+50||f.alpha<=0)floatingBubbles.splice(i,1);
  }
}

function draw(){
  ctx.clearRect(0,0,W,H);
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#0a0a1a');
  grad.addColorStop(1,'#1a1a3e');
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,W,H);
  drawGrid();
  drawBubbles();
  drawShooter();
  drawParticles();
  drawFloatingBubbles();
  if(canShoot&&!animating)drawAimLine();
}

function drawGrid(){
  ctx.globalAlpha=.9;
  for(let r=0;r<grid.length;r++){
    if(!grid[r])continue;
    for(let c=0;c<grid[r].length;c++){
      const b=grid[r][c];
      if(b){
        drawBubble(b.x,b.y,b.color,b.scale,b.alpha);
      }
    }
  }
  ctx.globalAlpha=1;
  const dangerY=H-100;
  ctx.strokeStyle='rgba(255,71,87,.3)';
  ctx.lineWidth=1;
  ctx.setLineDash([5,5]);
  ctx.beginPath();
  ctx.moveTo(0,dangerY);
  ctx.lineTo(W,dangerY);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawBubble(x,y,color,scale=1,alpha=1){
  if(color===-1){
    ctx.globalAlpha=alpha;
    ctx.fillStyle='#444';
    ctx.beginPath();
    ctx.arc(x,y,bubbleRadius*scale*.9,0,Math.PI*2);
    ctx.fill();
    ctx.strokeStyle='#666';
    ctx.lineWidth=2;
    ctx.stroke();
    ctx.globalAlpha=1;
    return;
  }
  if(color===8){
    ctx.globalAlpha=alpha;
    const grd=ctx.createRadialGradient(x-bubbleRadius*.3,y-bubbleRadius*.3,0,x,y,bubbleRadius*scale);
    grd.addColorStop(0,'#ff7979');
    grd.addColorStop(1,'#1a1a1a');
    ctx.fillStyle=grd;
    ctx.beginPath();
    ctx.arc(x,y,bubbleRadius*scale,0,Math.PI*2);
    ctx.fill();
    ctx.strokeStyle='#ff4757';
    ctx.lineWidth=2;
    ctx.stroke();
    ctx.fillStyle='#ff4757';
    ctx.font='bold '+(bubbleRadius*.7)+'px Arial';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText('💣',x,y);
    ctx.globalAlpha=1;
    return;
  }
  if(color===7){
    ctx.globalAlpha=alpha;
    const hue=(Date.now()/20)%360;
    const grd=ctx.createRadialGradient(x-bubbleRadius*.3,y-bubbleRadius*.3,0,x,y,bubbleRadius*scale);
    grd.addColorStop(0,`hsl(${hue},90%,75%)`);
    grd.addColorStop(.5,`hsl(${(hue+60)%360},90%,55%)`);
    grd.addColorStop(1,`hsl(${(hue+120)%360},90%,40%)`);
    ctx.fillStyle=grd;
    ctx.beginPath();
    ctx.arc(x,y,bubbleRadius*scale,0,Math.PI*2);
    ctx.fill();
    ctx.globalAlpha=1;
    return;
  }
  const col=COLORS[color-1]||COLORS[0];
  ctx.globalAlpha=alpha;
  const grd=ctx.createRadialGradient(x-bubbleRadius*.3,y-bubbleRadius*.3,bubbleRadius*.1,x,y,bubbleRadius*scale);
  grd.addColorStop(0,'rgba(255,255,255,.8)');
  grd.addColorStop(.3,col);
  grd.addColorStop(1,shadeColor(col,-30));
  ctx.fillStyle=grd;
  ctx.beginPath();
  ctx.arc(x,y,bubbleRadius*scale,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.2)';
  ctx.lineWidth=1;
  ctx.stroke();
  ctx.globalAlpha=1;
}

function shadeColor(col,amt){
  const num=parseInt(col.slice(1),16);
  const r=Math.min(255,Math.max(0,(num>>16)+amt));
  const g=Math.min(255,Math.max(0,((num>>8)&0xFF)+amt));
  const b=Math.min(255,Math.max(0,(num&0xFF)+amt));
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}

function drawBubbles(){
  for(const b of bubbles){
    drawBubble(b.x,b.y,b.color);
  }
}

function drawShooter(){
  const sx=shooter.x;
  const sy=shooter.y;
  ctx.fillStyle='rgba(255,255,255,.15)';
  ctx.beginPath();
  ctx.arc(sx,sy,bubbleRadius+5,0,Math.PI*2);
  ctx.fill();
  drawBubble(sx,sy,shooter.current);

  const nx=sx+Math.cos(shooter.angle)*(bubbleRadius*2.5);
  const ny=sy+Math.sin(shooter.angle)*(bubbleRadius*2.5);
  drawBubble(nx,ny,shooter.next,.75);

  ctx.fillStyle='rgba(255,255,255,.6)';
  ctx.font='11px sans-serif';
  ctx.textAlign='center';
  ctx.fillText('NEXT',nx,ny+bubbleRadius+12);
  if(swapUses>0){
    ctx.fillStyle='rgba(0,255,255,.85)';
    ctx.font='bold 11px sans-serif';
    ctx.fillText('🔄 TAP TO SWAP ('+swapUses+')',sx,sy+bubbleRadius+20);
  }
}

function drawAimLine(){
  const steps=80;
  const stepSize=7;
  let px=shooter.x,py=shooter.y;
  let vx=Math.cos(shooter.angle)*stepSize;
  let vy=Math.sin(shooter.angle)*stepSize;
  let bounced=false;
  ctx.strokeStyle='rgba(255,255,255,.5)';
  ctx.lineWidth=2;
  ctx.setLineDash([4,4]);
  ctx.beginPath();
  ctx.moveTo(px,py);

  for(let i=0;i<steps;i++){
    px+=vx;
    py+=vy;
    if(px<bubbleRadius){
      px=bubbleRadius;
      vx*=-1;
      bounced=true;
    }else if(px>W-bubbleRadius){
      px=W-bubbleRadius;
      vx*=-1;
      bounced=true;
    }
    if(py<gridOffsetY+bubbleRadius){
      ctx.lineTo(px,py);
      break;
    }

    // Check if aim line hits any existing bubble
    let hit=false;
    const checkDist=bubbleDiam*0.85;
    for(let r=0;r<grid.length;r++){
      if(!grid[r]) continue;
      for(let c=0;c<grid[r].length;c++){
        if(grid[r][c]&&grid[r][c].color!==0){
          if(Math.hypot(px-grid[r][c].x, py-grid[r][c].y) < checkDist){
            hit=true;
            break;
          }
        }
      }
      if(hit) break;
    }
    ctx.lineTo(px,py);
    if(hit) break;
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawParticles(){
  for(const p of particles){
    ctx.globalAlpha=p.alpha;
    ctx.fillStyle=p.color;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha=1;
}

function drawFloatingBubbles(){
  for(const f of floatingBubbles){
    ctx.globalAlpha=f.alpha;
    drawBubble(f.x,f.y,f.color,.8);
  }
  ctx.globalAlpha=1;
}

function loop(time){
  if(!isRunning)return;
  const dt=Math.min((time-lastTime)/16.67,2);
  lastTime=time;
  if(currentScreen==='game'&&!gameOverFlag){
    updateBubbles(dt);
    updateParticles(dt);
    updateFloatingBubbles(dt);
  }
  draw();
  rafId=requestAnimationFrame(loop);
}

function updatePointerAngle(e){
  const rect=canvas.getBoundingClientRect();
  const clientX=e.clientX!==undefined?e.clientX:(e.touches&&e.touches[0]?e.touches[0].clientX:0);
  const clientY=e.clientY!==undefined?e.clientY:(e.touches&&e.touches[0]?e.touches[0].clientY:0);
  const scaleX=W/(rect.width||W);
  const scaleY=H/(rect.height||H);
  const x=(clientX-rect.left)*scaleX;
  const y=(clientY-rect.top)*scaleY;

  const dx=x-shooter.x;
  const dy=y-shooter.y;
  let angle=Math.atan2(dy,dx);
  const minAngle=-Math.PI+0.15;
  const maxAngle=-0.15;
  angle=Math.max(minAngle,Math.min(maxAngle,angle));
  shooter.angle=angle;
  return {x, y};
}

function handlePointerDown(e){
  if(currentScreen!=='game') return;
  initAudio();
  const coords = updatePointerAngle(e);
  // Tap near shooter swaps bubble
  if(coords && Math.hypot(coords.x - shooter.x, coords.y - shooter.y) < bubbleRadius * 2.5){
    if(swapBubble()) return;
  }
  isPointerAiming = true;
}

function handlePointerMove(e){
  if(currentScreen!=='game') return;
  updatePointerAngle(e);
}

function handlePointerUp(e){
  if(currentScreen!=='game') return;
  if(isPointerAiming){
    isPointerAiming = false;
    updatePointerAngle(e);
    if(canShoot && !animating){
      shoot();
    }
  }
}

// Click listener: on click/tap, immediately update aim & shoot
function handleDirectShoot(e){
  if(currentScreen!=='game') return;
  if(e.target && e.target.closest && e.target.closest('#pauseBtn')) return;
  initAudio();
  const coords = updatePointerAngle(e);
  if(coords && Math.hypot(coords.x - shooter.x, coords.y - shooter.y) < bubbleRadius * 2.5){
    if(swapBubble()) return;
  }
  if(canShoot && !animating){
    shoot();
  }
}

canvas.addEventListener('pointerdown', handlePointerDown);
canvas.addEventListener('pointermove', handlePointerMove);
canvas.addEventListener('click', handleDirectShoot);
window.addEventListener('pointermove', handlePointerMove);
window.addEventListener('pointerup', handlePointerUp);

// Keyboard controls
window.addEventListener('keydown', (e)=>{
  if(currentScreen!=='game') return;
  initAudio();
  if(e.code==='ArrowLeft'||e.code==='KeyA'){
    shooter.angle = Math.max(-Math.PI+0.15, shooter.angle - 0.08);
  }else if(e.code==='ArrowRight'||e.code==='KeyD'){
    shooter.angle = Math.min(-0.15, shooter.angle + 0.08);
  }else if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW'){
    if(canShoot && !animating) shoot();
  }else if(e.code==='KeyS'||e.code==='KeyX'){
    swapBubble();
  }
});

function initAudio(){
  if(audioCtx)return;
  try{
    audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  }catch(e){}
}

function playSFX(type){
  if(!audioCtx||!audioEnabled)return;
  try{
    const osc=audioCtx.createOscillator();
    const gain=audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const t=audioCtx.currentTime;
    if(type==='pop'){
      osc.type='sine';
      osc.frequency.setValueAtTime(600,t);
      osc.frequency.exponentialRampToValueAtTime(200,t+.1);
      gain.gain.setValueAtTime(.3,t);
      gain.gain.exponentialRampToValueAtTime(.01,t+.1);
      osc.start(t);osc.stop(t+.1);
    }else if(type==='drop'){
      osc.type='sawtooth';
      osc.frequency.setValueAtTime(400,t);
      osc.frequency.exponentialRampToValueAtTime(100,t+.2);
      gain.gain.setValueAtTime(.2,t);
      gain.gain.exponentialRampToValueAtTime(.01,t+.2);
      osc.start(t);osc.stop(t+.2);
    }else if(type==='shoot'){
      osc.type='square';
      osc.frequency.setValueAtTime(160,t);
      gain.gain.setValueAtTime(.15,t);
      gain.gain.exponentialRampToValueAtTime(.01,t+.05);
      osc.start(t);osc.stop(t+.05);
    }else if(type==='levelComplete'){
      const notes=[523,659,784,1047];
      notes.forEach((freq,i)=>{
        const o=audioCtx.createOscillator();
        const g=audioCtx.createGain();
        o.connect(g);g.connect(audioCtx.destination);
        o.type='sine';
        o.frequency.value=freq;
        g.gain.setValueAtTime(0,t+i*.15);
        g.gain.linearRampToValueAtTime(.2,t+i*.15+.05);
        g.gain.exponentialRampToValueAtTime(.01,t+i*.15+.3);
        o.start(t+i*.15);o.stop(t+i*.15+.3);
      });
    }else if(type==='gameOver'){
      const notes=[400,350,300,250];
      notes.forEach((freq,i)=>{
        const o=audioCtx.createOscillator();
        const g=audioCtx.createGain();
        o.connect(g);g.connect(audioCtx.destination);
        o.type='sine';
        o.frequency.value=freq;
        g.gain.setValueAtTime(0,t+i*.2);
        g.gain.linearRampToValueAtTime(.2,t+i*.2+.05);
        g.gain.exponentialRampToValueAtTime(.01,t+i*.2+.4);
        o.start(t+i*.2);o.stop(t+i*.2+.4);
      });
    }else if(type==='click'){
      osc.type='sine';
      osc.frequency.value=800;
      gain.gain.setValueAtTime(.1,t);
      gain.gain.exponentialRampToValueAtTime(.01,t+.03);
      osc.start(t);osc.stop(t+.03);
    }
  }catch(e){}
}

function startBGM(){
  if(!audioCtx||!musicEnabled||bgmInterval)return;
  try{
    const playChord=()=>{
      if(!musicEnabled){stopBGM();return;}
      const t=audioCtx.currentTime;
      const chord=BGM_CHORDS[bgmChordIndex%4];
      bgmChordIndex++;
      const masterGain=audioCtx.createGain();
      masterGain.gain.value=.05;
      const lowpass=audioCtx.createBiquadFilter();
      lowpass.type='lowpass';
      lowpass.frequency.value=800;
      masterGain.connect(lowpass);
      lowpass.connect(audioCtx.destination);
      chord.forEach(freq=>{
        const osc=audioCtx.createOscillator();
        const g=audioCtx.createGain();
        osc.connect(g);g.connect(masterGain);
        osc.type='sine';
        osc.frequency.value=freq;
        g.gain.setValueAtTime(0,t);
        g.gain.linearRampToValueAtTime(.3,t+.5);
        g.gain.linearRampToValueAtTime(0,t+3);
        osc.start(t);osc.stop(t+3);
      });
    };
    playChord();
    bgmInterval=setInterval(playChord,3000);
  }catch(e){}
}

function stopBGM(){
  if(bgmInterval){clearInterval(bgmInterval);bgmInterval=null;}
}

function clickSound(){playSFX('click');}

// Screen button bindings: Clicking PLAY directly starts Level 1 (or highest unlocked level)
const playBtn = document.getElementById('playBtn');
if(playBtn){
  playBtn.addEventListener('click', ()=>{
    initAudio();
    clickSound();
    const targetLvl = gameState.unlockedLevel ? Math.min(30, gameState.unlockedLevel + 1) : 1;
    startLevel(targetLvl);
    startBGM();
  });
}

document.getElementById('settingsBtn')?.addEventListener('click',()=>{initAudio();clickSound();showScreen('settings');});
document.getElementById('backToTitle')?.addEventListener('click',()=>{clickSound();showScreen('title');});
document.getElementById('resumeBtn')?.addEventListener('click',()=>{clickSound();showScreen('game');});
document.getElementById('restartBtn')?.addEventListener('click',()=>{clickSound();startLevel(lvlIdx);});
document.getElementById('pauseSettingsBtn')?.addEventListener('click',()=>{clickSound();showScreen('settings');});
document.getElementById('pauseBackBtn')?.addEventListener('click',()=>{clickSound();showScreen('levelSelect');createLevelGrid();});
document.getElementById('settingsBackBtn')?.addEventListener('click',()=>{clickSound();if(currentScreen==='settings')showScreen('title');else showScreen('game');});
document.getElementById('sfxToggle')?.addEventListener('click',()=>{audioEnabled=!audioEnabled;gameState.sfxOn=audioEnabled;saveState();updateSettingsUI();});
document.getElementById('musicToggle')?.addEventListener('click',()=>{musicEnabled=!musicEnabled;gameState.musicOn=musicEnabled;saveState();updateSettingsUI();if(musicEnabled)startBGM();else stopBGM();});
document.getElementById('nextLevelBtn')?.addEventListener('click',()=>{clickSound();if(lvlIdx<30)startLevel(lvlIdx+1);});
document.getElementById('completeBackBtn')?.addEventListener('click',()=>{clickSound();showScreen('levelSelect');createLevelGrid();});
document.getElementById('retryBtn')?.addEventListener('click',()=>{clickSound();startLevel(lvlIdx);});
document.getElementById('gameOverBackBtn')?.addEventListener('click',()=>{clickSound();showScreen('levelSelect');createLevelGrid();});
document.getElementById('pauseBtn')?.addEventListener('click',()=>{clickSound();showScreen('pause');});

document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&isRunning){
    isRunning=false;
    if(rafId){cancelAnimationFrame(rafId);rafId=null;}
  }else if(!document.hidden&&currentScreen==='game'){
    isRunning=true;
    lastTime=performance.now();
    rafId=requestAnimationFrame(loop);
  }
});

function cleanup(){
  isRunning=false;
  if(rafId)cancelAnimationFrame(rafId);
  rafId=null;
  stopBGM();
  if(audioCtx)audioCtx.close();
  timers.forEach(t=>clearInterval(t));
  timers=[];
}
window.addEventListener('beforeunload',cleanup);

initFloatingBubbles();

// Auto-start Level 1 directly on load after 100ms so player never gets stuck on title screen
setTimeout(()=>{
  if(currentScreen==='title'){
    const targetLvl = gameState.unlockedLevel ? Math.min(30, gameState.unlockedLevel + 1) : 1;
    startLevel(targetLvl);
  }
}, 150);

})();
