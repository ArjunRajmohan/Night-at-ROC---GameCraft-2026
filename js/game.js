class Engine {
  constructor(){
    this.canvas=$('game-canvas'); this.ctx=this.canvas.getContext('2d');
    this.playerName=""; this.resize();
    window.addEventListener('resize',()=>this.resize());
    this.map=["1111111111111111","1000000000000001","1011100000011101","1010000000000101","1010110000110101","1000100000010001","1110101111010111","1000000000000001","1011101001011101","1000001001000001","1011110110111101","1010000000000101","1010111001110101","1000100000010001","1000000000000001","1111111111111111"];
    this.mapW=this.map[0].length; this.mapH=this.map.length; this.zBuffer=[]; this.paused=false; this.bindInput();
  }
  resize(){ this.width=window.innerWidth; this.height=window.innerHeight; this.canvas.width=Math.min(640,this.width); this.canvas.height=this.canvas.width*(this.height/this.width); }
  isWall(x,y){const ix=Math.floor(x),iy=Math.floor(y);if(ix<0||iy<0||ix>=this.mapW||iy>=this.mapH)return true;return this.map[iy][ix]==="1";}
  updateDistanceMap(){
    this.distMap=Array(this.mapH).fill(0).map(()=>Array(this.mapW).fill(9999));
    const px=Math.floor(this.px),py=Math.floor(this.py);
    if(px<0||py<0||px>=this.mapW||py>=this.mapH)return;
    this.distMap[py][px]=0; const q=[{x:px,y:py,d:0}]; let head=0; const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
    while(head<q.length){const cur=q[head++];for(let d of dirs){const nx=cur.x+d[0],ny=cur.y+d[1];if(nx>=0&&nx<this.mapW&&ny>=0&&ny<this.mapH&&this.map[ny][nx]!=='1'){if(this.distMap[ny][nx]>cur.d+1){this.distMap[ny][nx]=cur.d+1;q.push({x:nx,y:ny,d:cur.d+1});}}}}
  }
  bindInput(){
    this.keys={};
    window.addEventListener('keydown',e=>{
      if(e.key==='Tab'){ if(this.running){ e.preventDefault(); this.togglePause(); } return; }
      if(this.paused) return;
      this.keys[e.key.toLowerCase()]=true;
      if(GameState.mode==='sort'&&this.running&&!this.exploding){if(e.key.toLowerCase()==='d'||e.key==='ArrowRight')this.routePacket(true);if(e.key.toLowerCase()==='a'||e.key==='ArrowLeft')this.routePacket(false);}
      if(GameState.mode==='type'&&this.running&&e.key.length===1&&!this.exploding){this.handleTyping(e.key.toUpperCase());}
    });
    window.addEventListener('keyup',e=>this.keys[e.key.toLowerCase()]=false);
    $('gate-trash').addEventListener('click',()=>{if(GameState.mode==='sort'&&this.running&&!this.paused)this.routePacket(false);});
    $('gate-allow').addEventListener('click',()=>{if(GameState.mode==='sort'&&this.running&&!this.paused)this.routePacket(true);});
    this.canvas.addEventListener('mousedown',e=>{if(GameState.mode==='purge'&&this.running&&!this.exploding&&!this.paused){if(document.pointerLockElement!==this.canvas&&this.canvas.requestPointerLock){this.canvas.requestPointerLock();}this.fireWeapon();}});
    this.canvas.addEventListener('mousemove',e=>{if(GameState.mode==='purge'&&this.running&&!this.exploding&&!this.paused){const moveX=e.movementX||e.mozMovementX||e.webkitMovementX||0;this.rotateCamera(moveX*0.003);}});
  }
  start(){
    AudioSys.init(); GameState.reset(); this.running=true; this.paused=false; this.lastTime=performance.now(); this.phaseTimer=60;
    this.px=1.5; this.py=1.5; this.dirX=1; this.dirY=0; this.planeX=0; this.planeY=0.66;
    this.enemies=[]; this.particles=[]; this.recoil=0; this.exploding=false;
    for(let i=0;i<4;i++)this.spawnEnemy();
    $('hud').classList.remove('g-off'); $('score-container').classList.remove('g-off'); $('game-crosshair').classList.remove('g-off');
    $('pause-btn').classList.remove('g-off'); $('screen-pause').classList.add('g-off'); $('pause-instr').classList.add('g-off'); $('pause-lb').classList.add('g-off');
    $('screen-end').classList.add('g-off');
    $('hud-name').textContent=this.playerName||'\u2014'; $('hud-time').textContent=60;
    if(this.canvas.requestPointerLock)this.canvas.requestPointerLock();
    UI.showBanner("INTRUSION DETECTED"); this.loop(this.lastTime);
  }
  stop(){
    if(!this.running && GameState.frozen) return;
    this.running=false; this.paused=false; GameState.frozen=true;   
    if(document.exitPointerLock)document.exitPointerLock();
    $('hud').classList.add('g-off'); $('score-container').classList.add('g-off'); $('game-crosshair').classList.add('g-off'); $('sort-controls').classList.add('g-off');
    $('pause-btn').classList.add('g-off'); $('screen-pause').classList.add('g-off'); $('pause-instr').classList.add('g-off'); $('pause-lb').classList.add('g-off');

    const secured = GameState.health>0;

    if(secured){
      const bonus=Math.floor(GameState.health*SCORE.SURVIVE_MULT);
      GameState.score=Math.max(0,GameState.score+bonus);
      UI.update();
    }
    const finalScore=GameState.score;
    const currentStats = { kills:GameState.stats.kills, sortAcc:GameState.sortAccuracy(), wordsCompleted:GameState.stats.wordsCompleted, secured, score:finalScore };

    if(isMultiplayer) {
      if(currentPlayer === 1) {
        multiData.p1 = currentStats;
        $('inter-p1-score').textContent = "P1 SCORE: " + finalScore;
        $('inter-p2-name').textContent = player2Name;
        $('screen-intermission').classList.remove('g-off');
      } else {
        multiData.p2 = currentStats;
        
        saveScore(playerName, multiData.p1.score);
        saveScore(player2Name, multiData.p2.score);

        $('res-p1-name').textContent = playerName.toUpperCase();
        $('res-p1-score').textContent = multiData.p1.score;
        $('res-p1-status').textContent = multiData.p1.secured ? "SECURED" : "BREACHED";
        $('res-p1-status').style.color = multiData.p1.secured ? "var(--green)" : "var(--red)";
        $('m1Purge').textContent = multiData.p1.kills;
        $('m1Acc').textContent = multiData.p1.sortAcc + "%";

        $('res-p2-name').textContent = player2Name.toUpperCase();
        $('res-p2-score').textContent = multiData.p2.score;
        $('res-p2-status').textContent = multiData.p2.secured ? "SECURED" : "BREACHED";
        $('res-p2-status').style.color = multiData.p2.secured ? "var(--green)" : "var(--red)";
        $('m2Purge').textContent = multiData.p2.kills;
        $('m2Acc').textContent = multiData.p2.sortAcc + "%";

        if(multiData.p1.score > multiData.p2.score) {
          $('multi-winner-title').textContent = playerName.toUpperCase() + " WINS!";
        } else if(multiData.p2.score > multiData.p1.score) {
          $('multi-winner-title').textContent = player2Name.toUpperCase() + " WINS!";
        } else {
          $('multi-winner-title').textContent = "IT'S A TIE!";
        }

        $('screen-multi-result').classList.remove('g-off');
      }
      return;
    }

    savePersonalBest(finalScore);
    saveScore(this.playerName,finalScore);

    _lastStats=currentStats;

    if(secured){
      UI.showBanner("CORE SECURED"); AudioSys.win();
      setTimeout(()=>returnToOdyssey(finalScore),1100);
      return;
    }
    
    $('screen-end').classList.remove('g-off');
    $('end-title').textContent="CORE BREACHED";
    $('end-status').textContent="STATUS: SYSTEM COMPROMISED";
    $('end-status').style.color="var(--red)";
    $('end-name').textContent="ENGINEER: "+(this.playerName||'\u2014');
    $('end-score').textContent="FINAL SCORE: "+finalScore;
    $('end-pb').textContent="PERSONAL BEST: "+getPersonalBest();
    $('esPurge').textContent=GameState.stats.kills;
    $('esAcc').textContent=GameState.sortAccuracy()+'%';
    $('esWords').textContent=GameState.stats.wordsCompleted;
  }
  pause(){
    if(!this.running||this.paused||GameState.mode==='transition')return;
    this.paused=true;
    $('pauseScore').textContent=GameState.score;
    $('pausePhase').textContent=GameState.mode.charAt(0).toUpperCase()+GameState.mode.slice(1);
    $('pauseTime').textContent=Math.max(0,Math.ceil(this.phaseTimer));
    $('screen-pause').classList.remove('g-off');
    $('pause-btn').classList.add('g-off');
    if(document.exitPointerLock)document.exitPointerLock();
    try{ if(AudioSys.ctx&&AudioSys.ctx.suspend) AudioSys.ctx.suspend(); }catch(e){}
  }
  resume(){
    if(!this.running||!this.paused)return;
    this.paused=false; this.keys={};
    $('screen-pause').classList.add('g-off'); $('pause-instr').classList.add('g-off'); $('pause-lb').classList.add('g-off');
    $('pause-btn').classList.remove('g-off');
    this.lastTime=performance.now();
    try{ if(AudioSys.ctx&&AudioSys.ctx.resume) AudioSys.ctx.resume(); }catch(e){}
    if(GameState.mode==='purge'&&this.canvas.requestPointerLock)this.canvas.requestPointerLock();
  }
  togglePause(){ this.paused?this.resume():this.pause(); }
  
  startTransition(nextMode,msg){
    $('sort-controls').classList.add('g-off'); GameState.mode="transition"; this.nextMode=nextMode; this.transitionT=0;
    AudioSys.transition(); UI.showBanner(msg); if(document.exitPointerLock)document.exitPointerLock(); $('game-crosshair').classList.add('g-off');
    if(nextMode==='sort'){
      this.packets=[]; this.packetTimer=0; this.matrixColumns=[]; const cw=this.canvas.width; const cols=Math.floor(cw/20);
      for(let i=0;i<cols;i++){if(i*20>cw/2-170&&i*20<cw/2+170)continue;this.matrixColumns.push({x:i*20,y:Math.random()*this.canvas.height,speed:150+Math.random()*200,isLeft:(i*20<cw/2)});}
    } else if(nextMode==='type'){
      GameState.health=100; UI.update();
      this.coreX=160;
      const spawnX=this.canvas.width+100;
      this.bossReachTime=20;
      this.bossSpeed=(spawnX-this.coreX)/this.bossReachTime;
      this.coreHitDamage=50;
      this.boss2D={x:spawnX,y:this.canvas.height-160,hp:100,maxHp:100}; this.typeWords=[]; this.activeTypeWord=null; this.wordTimer=0; this.lasers=[]; this.exploding=false; this.explodeTimer=0; this.defenderRecoil=0;
    }
  }
  renderTransition(dt){
    this.transitionT+=dt; const prog=this.transitionT/1.5;
    if(prog>1){
      if (GameState.mode !== this.nextMode) {
        GameState.mode=this.nextMode;
        GameState.phaseStartScore = GameState.score;
        UI.update();
        if(GameState.mode==="sort") $("sort-controls").classList.remove("g-off");
        if(GameState.mode==="type") $("sort-controls").classList.add("g-off");
      }
      return;
    }
    this.ctx.fillStyle="#04050d"; this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    const intensity=Math.sin(prog*Math.PI);
    for(let i=0;i<20;i++){this.ctx.fillStyle=Math.random()>0.5?"rgba(34,224,255,0.3)":"rgba(255,45,85,0.3)";this.ctx.fillRect(Math.random()*this.canvas.width,Math.random()*this.canvas.height,this.canvas.width,(Math.random()*10+2)*intensity);}
    this.ctx.fillStyle="rgba(232,240,255,"+intensity+")"; this.ctx.font="bold "+Math.floor(this.canvas.width*0.03)+"px Consolas, monospace"; this.ctx.textAlign="center"; this.ctx.fillText("// RECONFIGURING SYSTEM...",this.canvas.width/2,this.canvas.height/2);
  }
  hasLOS(x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,dist=Math.hypot(dx,dy);for(let i=1;i<dist*10;i++){if(this.isWall(x1+(dx/dist)*(i/10),y1+(dy/dist)*(i/10)))return false;}return true;}
  spawnEnemy(){let ex,ey;do{ex=Math.floor(1+Math.random()*(this.mapW-2))+0.5;ey=Math.floor(1+Math.random()*(this.mapH-2))+0.5;}while(this.isWall(ex,ey)||Math.hypot(ex-this.px,ey-this.py)<6);this.enemies.push({x:ex,y:ey,alive:true,dirX:Math.random()-0.5,dirY:Math.random()-0.5});}
  rotateCamera(speed){const oldDirX=this.dirX,oldPlaneX=this.planeX;this.dirX=this.dirX*Math.cos(speed)-this.dirY*Math.sin(speed);this.dirY=oldDirX*Math.sin(speed)+this.dirY*Math.cos(speed);this.planeX=this.planeX*Math.cos(speed)-this.planeY*Math.sin(speed);this.planeY=oldPlaneX*Math.sin(speed)+this.planeY*Math.cos(speed);}
  fireWeapon(){
    AudioSys.shoot(); this.recoil=10; let bestHit=null,bestDist=Infinity;
    this.enemies.forEach(en=>{if(!en.alive)return;const dx=en.x-this.px,dy=en.y-this.py,dist=Math.hypot(dx,dy),dot=(dx*this.dirX+dy*this.dirY)/dist;let los=true;for(let i=1;i<dist*10;i++){if(this.isWall(this.px+(dx/dist)*(i/10),this.py+(dy/dist)*(i/10))){los=false;break;}}if(dot>0.9&&los&&dist<bestDist){bestDist=dist;bestHit=en;}});
    if(bestHit){bestHit.alive=false;GameState.addScore(SCORE.KILL);GameState.stats.kills++;AudioSys.kill();this.createExplosion(bestHit.x,bestHit.y,'#22e0ff');}
  }
  createExplosion(x,y,color){for(let i=0;i<15;i++){const angle=Math.random()*Math.PI*2,speed=Math.random()*2+1;this.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.0,color});}}
  createPixelExplosion(x,y,color,count=30){for(let i=0;i<count;i++){const angle=Math.random()*Math.PI*2,speed=Math.random()*400+100;this.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.0,color,type:'burst'});}}
  updateFPS(dt){
    this.recoil=Math.max(0,this.recoil-dt*50); const moveSpeed=4.0*dt; let fwd=0,str=0;
    if(this.keys['w']||this.keys['arrowup'])fwd+=1; if(this.keys['s']||this.keys['arrowdown'])fwd-=1; if(this.keys['a']||this.keys['arrowleft'])str-=1; if(this.keys['d']||this.keys['arrowright'])str+=1;
    if(fwd){if(!this.isWall(this.px+this.dirX*moveSpeed*fwd,this.py))this.px+=this.dirX*moveSpeed*fwd;if(!this.isWall(this.px,this.py+this.dirY*moveSpeed*fwd))this.py+=this.dirY*moveSpeed*fwd;}
    if(str){const sx=-this.dirY,sy=this.dirX;if(!this.isWall(this.px+sx*moveSpeed*str,this.py))this.px+=sx*moveSpeed*str;if(!this.isWall(this.px,this.py+sy*moveSpeed*str))this.py+=sy*moveSpeed*str;}
    this.updateDistanceMap();
    this.enemies.forEach(en=>{
      if(!en.alive)return; const dx=this.px-en.x,dy=this.py-en.y,dist=Math.hypot(dx,dy);
      if(dist<0.6){en.alive=false;GameState.damage(20);GameState.addScore(SCORE.ENEMY_REACH);GameState.stats.enemyReach++;AudioSys.hurt();}
      else{
        let targetDirX=en.dirX,targetDirY=en.dirY;
        if(this.hasLOS(en.x,en.y,this.px,this.py)){targetDirX=dx/dist;targetDirY=dy/dist;}
        else if(this.distMap){const ex=Math.floor(en.x),ey=Math.floor(en.y);let bestD=9999,bestCell=null;const dirs=[[0,-1],[1,0],[0,1],[-1,0]];for(let d of dirs){const nx=ex+d[0],ny=ey+d[1];if(nx>=0&&nx<this.mapW&&ny>=0&&ny<this.mapH&&this.map[ny][nx]!=='1'){if(this.distMap[ny][nx]<bestD){bestD=this.distMap[ny][nx];bestCell={x:nx+0.5,y:ny+0.5};}}}if(bestCell){const cdx=bestCell.x-en.x,cdy=bestCell.y-en.y,cdist=Math.hypot(cdx,cdy);if(cdist>0.1){targetDirX=cdx/cdist;targetDirY=cdy/cdist;}}}
        en.dirX=en.dirX*0.85+targetDirX*0.15; en.dirY=en.dirY*0.85+targetDirY*0.15;
        let len=Math.hypot(en.dirX,en.dirY)||1; en.dirX/=len; en.dirY/=len;
        const speed=2.4*dt,nextX=en.x+en.dirX*speed,nextY=en.y+en.dirY*speed,padX=Math.sign(en.dirX)*0.35,padY=Math.sign(en.dirY)*0.35; let moved=false;
        if(!this.isWall(nextX+padX,en.y)){en.x=nextX;moved=true;} if(!this.isWall(en.x,nextY+padY)){en.y=nextY;moved=true;}
        if(!moved){en.dirX=Math.random()-0.5;en.dirY=Math.random()-0.5;}
      }
    });
    this.enemies=this.enemies.filter(e=>e.alive);
    if(this.enemies.length<5&&Math.random()<0.02)this.spawnEnemy();
    this.particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt*2;}); this.particles=this.particles.filter(p=>p.life>0);
  }
  renderFPS(){
    const cw=this.canvas.width,ch=this.canvas.height;
    this.ctx.fillStyle='#05060f';this.ctx.fillRect(0,0,cw,ch/2);this.ctx.fillStyle='#0b1030';this.ctx.fillRect(0,ch/2,cw,ch/2);
    for(let x=0;x<cw;x++){
      const cameraX=2*x/cw-1,rayDirX=this.dirX+this.planeX*cameraX,rayDirY=this.dirY+this.planeY*cameraX;
      let mapX=Math.floor(this.px),mapY=Math.floor(this.py),sideDistX,sideDistY;
      const deltaDistX=Math.abs(1/rayDirX),deltaDistY=Math.abs(1/rayDirY); let stepX,stepY,hit=0,side;
      if(rayDirX<0){stepX=-1;sideDistX=(this.px-mapX)*deltaDistX;}else{stepX=1;sideDistX=(mapX+1.0-this.px)*deltaDistX;}
      if(rayDirY<0){stepY=-1;sideDistY=(this.py-mapY)*deltaDistY;}else{stepY=1;sideDistY=(mapY+1.0-this.py)*deltaDistY;}
      while(hit===0){if(sideDistX<sideDistY){sideDistX+=deltaDistX;mapX+=stepX;side=0;}else{sideDistY+=deltaDistY;mapY+=stepY;side=1;}if(this.map[mapY][mapX]==="1")hit=1;}
      const perpWallDist=(side===0)?(sideDistX-deltaDistX):(sideDistY-deltaDistY); this.zBuffer[x]=perpWallDist;
      const lineHeight=Math.floor(ch/perpWallDist),drawStart=Math.max(0,-lineHeight/2+ch/2),drawEnd=Math.min(ch-1,lineHeight/2+ch/2);
      let wallX; if(side===0)wallX=this.py+perpWallDist*rayDirY;else wallX=this.px+perpWallDist*rayDirX; wallX-=Math.floor(wallX);
      const curveShade=Math.sin(wallX*Math.PI),distFade=Math.max(0.1,1-perpWallDist/10),shade=distFade*(0.3+0.7*curveShade);
      const baseR=side===1?10:15,baseG=side===1?25:35,baseB=side===1?40:60;
      this.ctx.fillStyle=`rgba(${baseR}, ${baseG}, ${baseB}, ${shade})`; this.ctx.fillRect(x,drawStart,1,drawEnd-drawStart);
      const neonEdge=distFade*(1-curveShade); this.ctx.fillStyle=`rgba(34, 224, 255, ${neonEdge*0.4})`; this.ctx.fillRect(x,drawStart,1,drawEnd-drawStart);
    }
    this.renderEntities();
    const baseW=cw*0.15,baseH=ch*0.35,swayX=Math.sin(performance.now()/200)*3,swayY=Math.cos(performance.now()/400)*3,recoilOffset=this.recoil*3,wx=cw/2+swayX,wy=ch-baseH+swayY+recoilOffset;
    this.ctx.fillStyle='#11131a';this.ctx.beginPath();this.ctx.moveTo(wx-baseW*0.5,ch);this.ctx.lineTo(wx-baseW*0.2,wy);this.ctx.lineTo(wx+baseW*0.2,wy);this.ctx.lineTo(wx+baseW*0.5,ch);this.ctx.fill();
    this.ctx.fillStyle='#1f222e';this.ctx.beginPath();this.ctx.moveTo(wx-baseW*0.3,ch);this.ctx.lineTo(wx-baseW*0.1,wy+baseH*0.1);this.ctx.lineTo(wx+baseW*0.1,wy+baseH*0.1);this.ctx.lineTo(wx+baseW*0.3,ch);this.ctx.fill();
    this.ctx.strokeStyle='#22e0ff';this.ctx.lineWidth=3;this.ctx.shadowBlur=10;this.ctx.shadowColor='#22e0ff';this.ctx.beginPath();this.ctx.moveTo(wx-baseW*0.15,ch);this.ctx.lineTo(wx-baseW*0.05,wy+baseH*0.3);this.ctx.moveTo(wx+baseW*0.15,ch);this.ctx.lineTo(wx+baseW*0.05,wy+baseH*0.3);this.ctx.stroke();
    this.ctx.fillStyle='#0a0a0a';this.ctx.fillRect(wx-baseW*0.15,wy-baseH*0.05,baseW*0.3,baseH*0.15);this.ctx.strokeStyle='#22e0ff';this.ctx.lineWidth=2;this.ctx.strokeRect(wx-baseW*0.15,wy-baseH*0.05,baseW*0.3,baseH*0.15);this.ctx.shadowBlur=0;
    if(this.recoil>2){const flashSize=this.recoil*5;this.ctx.fillStyle='rgba(34, 224, 255, 0.8)';this.ctx.shadowBlur=20;this.ctx.shadowColor='#22e0ff';this.ctx.beginPath();for(let i=0;i<8;i++){const angle=(i/8)*Math.PI*2,dist=flashSize*(i%2===0?1:0.4);this.ctx.lineTo(wx+Math.cos(angle)*dist,wy-baseH*0.05+Math.sin(angle)*dist);}this.ctx.fill();this.ctx.fillStyle='#fff';this.ctx.beginPath();this.ctx.arc(wx,wy-baseH*0.05,flashSize*0.3,0,Math.PI*2);this.ctx.fill();this.ctx.shadowBlur=0;}
  }
  renderEntities(){
    const cw=this.canvas.width,ch=this.canvas.height;
    const sprites=[...this.enemies,...this.particles];
    sprites.sort((a,b)=>Math.hypot(this.px-b.x,this.py-b.y)-Math.hypot(this.px-a.x,this.py-a.y));
    sprites.forEach(sprite=>{
      const spriteX=sprite.x-this.px,spriteY=sprite.y-this.py,invDet=1.0/(this.planeX*this.dirY-this.dirX*this.planeY),transformX=invDet*(this.dirY*spriteX-this.dirX*spriteY),transformY=invDet*(-this.planeY*spriteX+this.planeX*spriteY);
      if(transformY>0){const spriteScreenX=Math.floor((cw/2)*(1+transformX/transformY));
        if(sprite.life!==undefined){if(transformY<this.zBuffer[spriteScreenX]){const size=(ch/transformY)*0.05;this.ctx.fillStyle=sprite.color;this.ctx.globalAlpha=sprite.life;this.ctx.fillRect(spriteScreenX-size/2,(ch/2)-size/2,size,size);this.ctx.globalAlpha=1.0;}}
        else{const sizeMult=0.9;let spriteHeight=Math.abs(Math.floor(ch/transformY))*sizeMult;if(spriteScreenX>-spriteHeight&&spriteScreenX<cw+spriteHeight){if(transformY<this.zBuffer[spriteScreenX]||!this.zBuffer[spriteScreenX]){this.drawMonster(spriteScreenX,ch/2,spriteHeight,false,sprite);}}}
      }
    });
  }
  spawnPacket(timeRatio){const p=Traffic.getRandom(timeRatio*20);this.packets.push({text:p.text,safe:p.safe,x:this.canvas.width/2,y:-80,speed:180+(1-timeRatio)*120,vx:0,routed:null});}
  routePacket(isAllow){const p=this.packets.find(pkt=>!pkt.routed);if(!p)return;p.routed=isAllow?'right':'left';p.vx=isAllow?700:-700;p.isCorrect=(isAllow&&p.safe)||(!isAllow&&!p.safe);const gate=isAllow?$('gate-allow'):$('gate-trash');gate.style.background=p.isCorrect?'var(--neon-green)':'var(--neon-red)';setTimeout(()=>gate.style.background='rgba(0,0,0,0.8)',200);}
  updateSort(dt){
    this.packetTimer-=dt; const timeRatio=this.phaseTimer/20;
    if(this.packetTimer<=0&&this.packets.length<3){this.spawnPacket(timeRatio);this.packetTimer=1.0+timeRatio;}
    this.matrixColumns.forEach(col=>{col.y+=col.speed*dt;if(col.y>this.canvas.height+50)col.y=-50;});
    for(let i=this.packets.length-1;i>=0;i--){let p=this.packets[i];
      if(p.routed){p.x+=p.vx*dt;const cw=this.canvas.width;if(p.x<cw*0.15||p.x>cw*0.85){
        if(p.isCorrect){
          GameState.combo++;
          const points=Math.min(GameState.combo,SCORE.SORT_COMBO_CAP)*SCORE.SORT_COMBO_UNIT;
          GameState.addScore(points);
          GameState.stats.sortCorrect++;
          AudioSys.good();
          if(GameState.combo>=3&&GameState.combo%2===1){UI.showBanner(GameState.combo+"X COMBO!");}
        }else{
          GameState.combo=0;UI.update();
          GameState.addScore(SCORE.SORT_WRONG);
          GameState.stats.sortWrong++;
          GameState.damage(10);AudioSys.bad();
        }
        for(let j=0;j<30;j++){const angle=Math.random()*Math.PI*2;this.particles.push({x:p.x,y:p.y,vx:Math.cos(angle)*200,vy:Math.sin(angle)*200,life:1.0,color:p.isCorrect?'#21f39a':'#ff2d55',type:'burst'});}this.packets.splice(i,1);}}
      else{p.y+=p.speed*dt;if(p.y>this.canvas.height-80){
        GameState.combo=0;UI.update();
        if(!p.safe){GameState.damage(15);GameState.stats.sortWrong++;}
        AudioSys.bad();
        for(let j=0;j<30;j++){const angle=Math.random()*Math.PI*2;this.particles.push({x:p.x,y:p.y,vx:Math.cos(angle)*200,vy:Math.sin(angle)*200,life:1.0,color:'#ff2d55',type:'burst'});}this.packets.splice(i,1);}}
    }
    this.particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt*2.5;}); this.particles=this.particles.filter(p=>p.life>0);
  }
  renderSort(){
    const cw=this.canvas.width,ch=this.canvas.height;
    this.ctx.fillStyle='#04050d';this.ctx.fillRect(0,0,cw,ch);
    const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*"; this.ctx.font='16px Consolas, monospace'; this.ctx.textAlign='center';
    this.matrixColumns.forEach(col=>{const baseColor=col.isLeft?'255, 45, 85':'33, 243, 154';this.ctx.fillStyle=`rgb(${baseColor})`;this.ctx.fillText(chars[Math.floor(Math.random()*chars.length)],col.x,col.y);for(let i=1;i<12;i++){this.ctx.fillStyle=`rgba(${baseColor}, ${1-i/12})`;this.ctx.fillText(chars[Math.floor(Math.random()*chars.length)],col.x,col.y-i*16);}});
    this.ctx.fillStyle='rgba(4, 5, 13, 0.9)';this.ctx.fillRect(cw/2-170,0,340,ch);
    this.ctx.strokeStyle='#22e0ff';this.ctx.lineWidth=2;this.ctx.shadowBlur=15;this.ctx.shadowColor='#22e0ff';this.ctx.beginPath();this.ctx.moveTo(cw/2-170,0);this.ctx.lineTo(cw/2-170,ch);this.ctx.moveTo(cw/2+170,0);this.ctx.lineTo(cw/2+170,ch);this.ctx.stroke();this.ctx.shadowBlur=0;
    this.ctx.fillStyle='rgba(255,255,255,0.85)';this.ctx.font='bold 26px Consolas, monospace';this.ctx.textAlign='center';this.ctx.shadowBlur=10;this.ctx.shadowColor='#ff2d55';this.ctx.fillText("EXTERNAL",cw*0.15,50);this.ctx.shadowColor='#21f39a';this.ctx.fillText("INTERNAL",cw*0.85,50);this.ctx.shadowBlur=0;
    this.ctx.globalCompositeOperation='lighter';this.particles.forEach(p=>{this.ctx.fillStyle=p.color;this.ctx.globalAlpha=Math.max(0,p.life);this.ctx.beginPath();this.ctx.arc(p.x,p.y,p.life*4,0,Math.PI*2);this.ctx.fill();});this.ctx.globalAlpha=1.0;this.ctx.globalCompositeOperation='source-over';
    const activePacket=this.packets.find(pkt=>!pkt.routed);
    this.packets.forEach((p)=>{
      const w=310,h=60,rx=p.x-w/2,ry=p.y-h/2;
      this.ctx.fillStyle='rgba(10, 15, 30, 0.95)';this.ctx.fillRect(rx,ry,w,h);
      if(p.routed){this.ctx.strokeStyle=p.routed==='left'?'#ff2d55':'#21f39a';this.ctx.lineWidth=3;this.ctx.shadowBlur=15;this.ctx.shadowColor=this.ctx.strokeStyle;}else{this.ctx.strokeStyle='#22e0ff';this.ctx.lineWidth=(p===activePacket)?3:1;this.ctx.shadowBlur=(p===activePacket)?15:0;this.ctx.shadowColor='#22e0ff';}
      this.ctx.strokeRect(rx,ry,w,h);this.ctx.shadowBlur=0;
      this.ctx.fillStyle=this.ctx.strokeStyle;this.ctx.fillRect(rx,ry,w,6);
      this.ctx.fillStyle='#fff';this.ctx.font='10px Consolas, monospace';this.ctx.textAlign='left';this.ctx.fillText("[DATA_PKT]",rx+8,ry+22);
      let fontSize=16;if(p.text.length>26)fontSize=13;else if(p.text.length>22)fontSize=14;
      this.ctx.fillStyle='#e8f0ff';this.ctx.font=(p===activePacket?'bold ':'')+`${fontSize}px Consolas, monospace`;this.ctx.textAlign='center';this.ctx.fillText(p.text,p.x,p.y+12);
    });
  }
  handleTyping(key){
    if(this.typeWords.length===0)return;
    if(this.activeTypeWord){
      if(this.activeTypeWord.text[this.activeTypeWord.progress]===key){this.activeTypeWord.progress++;AudioSys.play(800+this.activeTypeWord.progress*100,'sine',0.1);if(this.activeTypeWord.progress===this.activeTypeWord.text.length){this.shootLaserAtBoss(this.activeTypeWord);GameState.addScore(SCORE.WORD);GameState.stats.wordsCompleted++;this.typeWords=this.typeWords.filter(w=>w!==this.activeTypeWord);this.activeTypeWord=null;}}
      else{this.activeTypeWord.progress=0;this.activeTypeWord=null;AudioSys.bad();GameState.addScore(SCORE.WRONG_KEY);this.boss2D.x-=20;UI.flash();}
    } else {
      const wordToStart=this.typeWords.find(w=>w.text[0]===key);
      if(wordToStart){this.activeTypeWord=wordToStart;this.activeTypeWord.progress=1;AudioSys.play(800,'sine',0.1);}else{AudioSys.bad();GameState.addScore(SCORE.WRONG_KEY);this.boss2D.x-=15;}
    }
  }
  shootLaserAtBoss(word){
    AudioSys.laser();this.defenderRecoil=1;this.lasers.push({x1:140,y1:this.canvas.height-95,x2:this.boss2D.x-50,y2:this.boss2D.y-50,life:0.3});this.boss2D.hp-=20;this.boss2D.x+=40;
    if(this.boss2D.hp<=0){GameState.addScore(SCORE.BOSS);GameState.stats.bossKills++;this.boss2D.hp=100;this.boss2D.x=this.canvas.width+100;this.typeWords=[];this.activeTypeWord=null;this.lasers=[];UI.showBanner("THREAT ELIMINATED! STAND BY...");}
  }
  updateType(dt){
    this.defenderRecoil=Math.max(0,(this.defenderRecoil||0)-dt*8);
    if(this.exploding){this.explodeTimer-=dt;this.particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt*0.8;});this.particles=this.particles.filter(p=>p.life>0);if(this.explodeTimer<=0)this.stop();return;}
    if(!this.boss2D)return;
    this.boss2D.x-=(this.bossSpeed||30)*dt;
    const coreX=this.coreX||160;
    if(this.boss2D.x<coreX){
      GameState.damage(this.coreHitDamage||50); AudioSys.hurt(); UI.flash();
      this.createPixelExplosion(coreX,this.canvas.height-60,'#ff2d55',60);
      if(GameState.health<=0){
        UI.showBanner("CORE BREACHED");
        this.exploding=true;this.explodeTimer=2.0;AudioSys.play(50,'sawtooth',2.0,0.4);
        this.createPixelExplosion(60,this.canvas.height-60,'#ff2d55',200);
        return;
      } else {
        UI.showBanner("CORE HIT \u00B7 "+GameState.health+"%");
        this.boss2D.x=this.canvas.width*0.6;
        this.boss2D.hp=this.boss2D.maxHp;
      }
    }
    this.wordTimer-=dt;
    if(this.wordTimer<=0&&this.typeWords.length<5){const dict=["MALWARE","RANSOMWARE","PHISHING","BOTNET","TROJAN","ROOTKIT","SPYWARE","EXPLOIT","PAYLOAD"];const text=dict[Math.floor(Math.random()*dict.length)];if(!this.typeWords.find(w=>w.text[0]===text[0])){const spawnX=200+Math.random()*(this.canvas.width-300);const isClumped=this.typeWords.some(w=>Math.abs(w.y- -40)<60&&Math.abs(w.x-spawnX)<100);if(!isClumped){this.typeWords.push({text:text,progress:0,x:spawnX,y:-40,speed:35+Math.random()*20});this.wordTimer=1.2+Math.random();}}}
    for(let i=this.typeWords.length-1;i>=0;i--){let w=this.typeWords[i];w.y+=w.speed*dt;if(w.y>this.canvas.height-60){this.boss2D.x-=40;AudioSys.bad();this.createPixelExplosion(w.x,w.y,'#ff2d55',20);this.typeWords.splice(i,1);if(this.activeTypeWord===w)this.activeTypeWord=null;}}
    this.particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt*0.8;}); this.particles=this.particles.filter(p=>p.life>0);
    this.lasers.forEach(l=>l.life-=dt); this.lasers=this.lasers.filter(l=>l.life>0);
  }
  renderType(){
    const cw=this.canvas.width,ch=this.canvas.height;
    this.ctx.fillStyle='#0b0f19';this.ctx.fillRect(0,0,cw,ch);
    const groundY=ch-60;this.ctx.fillStyle='#111827';this.ctx.fillRect(0,groundY,cw,60);this.ctx.strokeStyle='#22e0ff';this.ctx.lineWidth=2;this.ctx.beginPath();this.ctx.moveTo(0,groundY);this.ctx.lineTo(cw,groundY);this.ctx.stroke();
    for(let i=0;i<cw;i+=60){this.ctx.fillStyle='rgba(34,224,255,0.05)';this.ctx.fillRect(i,groundY,30,60);}
    this.ctx.fillStyle='rgba(34, 224, 255, 0.05)';this.ctx.fillRect(0,0,120,ch);
    this.ctx.fillStyle='#22e0ff';this.ctx.shadowBlur=40;this.ctx.shadowColor='#22e0ff';this.ctx.beginPath();this.ctx.arc(0,ch/2,100,-Math.PI/2,Math.PI/2);this.ctx.fill();this.ctx.shadowBlur=0;
    this.ctx.strokeStyle='#22e0ff';this.ctx.lineWidth=4;this.ctx.beginPath();this.ctx.moveTo(120,0);this.ctx.lineTo(120,ch);this.ctx.stroke();
    this.ctx.fillStyle='#0a101d';this.ctx.fillRect(0,groundY-20,140,80);this.ctx.strokeStyle='#22e0ff';this.ctx.strokeRect(0,groundY-20,140,80);
    const defX=110,defY=groundY,recoil=this.defenderRecoil||0;
    this.ctx.strokeStyle='#22e0ff';this.ctx.lineWidth=3;this.ctx.lineCap='round';this.ctx.lineJoin='round';
    this.ctx.beginPath();this.ctx.moveTo(defX-10,defY);this.ctx.lineTo(defX,defY-20);this.ctx.lineTo(defX+15,defY);this.ctx.stroke();
    this.ctx.beginPath();this.ctx.moveTo(defX,defY-20);this.ctx.lineTo(defX-5,defY-40);this.ctx.stroke();
    this.ctx.fillStyle='#22e0ff';this.ctx.beginPath();this.ctx.arc(defX-5,defY-48,6,0,Math.PI*2);this.ctx.fill();
    const gunStartX=defX-5,gunStartY=defY-35,gunEndX=defX+25-(recoil*8),gunEndY=defY-33-(recoil*10);
    this.ctx.beginPath();this.ctx.moveTo(defX-5,defY-35);this.ctx.lineTo(defX+5,defY-30);this.ctx.lineTo(gunStartX+12,gunStartY+2);this.ctx.stroke();
    this.ctx.strokeStyle='#fff';this.ctx.lineWidth=4;this.ctx.shadowBlur=10;this.ctx.shadowColor='#fff';this.ctx.beginPath();this.ctx.moveTo(gunStartX,gunStartY);this.ctx.lineTo(gunEndX,gunEndY);this.ctx.stroke();this.ctx.shadowBlur=0;
    if(this.exploding){this.ctx.globalAlpha=Math.max(0,this.explodeTimer/2.0);this.drawMonster(this.boss2D.x,groundY,320,true);this.ctx.globalAlpha=1.0;}else{this.drawMonster(this.boss2D.x,groundY,320,true);}
    const hpW=200;this.ctx.fillStyle='#333';this.ctx.fillRect(cw-hpW-30,20,hpW,12);this.ctx.fillStyle='#ff8800';this.ctx.fillRect(cw-hpW-30,20,hpW*(Math.max(0,this.boss2D.hp)/this.boss2D.maxHp),12);
    this.lasers.forEach(l=>{this.ctx.strokeStyle='#22e0ff';this.ctx.lineWidth=l.life*20;this.ctx.shadowBlur=20;this.ctx.shadowColor='#22e0ff';this.ctx.beginPath();this.ctx.moveTo(l.x1,l.y1);this.ctx.lineTo(l.x2,l.y2);this.ctx.stroke();this.ctx.shadowBlur=0;});
    this.ctx.font='bold 20px Consolas, monospace';this.ctx.textAlign='center';
    this.typeWords.forEach(w=>{const isActive=(w===this.activeTypeWord);this.ctx.fillStyle=isActive?'rgba(34,224,255,0.15)':'rgba(5,10,20,0.9)';this.ctx.strokeStyle=isActive?'#22e0ff':'#ff2d55';this.ctx.lineWidth=2;const width=this.ctx.measureText(w.text).width+30;this.ctx.shadowBlur=isActive?15:0;this.ctx.shadowColor=this.ctx.strokeStyle;this.ctx.fillRect(w.x-width/2,w.y-20,width,40);this.ctx.strokeRect(w.x-width/2,w.y-20,width,40);this.ctx.shadowBlur=0;const typed=w.text.substring(0,w.progress),untyped=w.text.substring(w.progress),typedW=this.ctx.measureText(typed).width,untypedW=this.ctx.measureText(untyped).width,startX=w.x-(typedW+untypedW)/2;this.ctx.textAlign='left';this.ctx.fillStyle='#22e0ff';this.ctx.fillText(typed,startX,w.y+6);this.ctx.fillStyle='#fff';this.ctx.fillText(untyped,startX+typedW,w.y+6);this.ctx.textAlign='center';});
    this.ctx.globalCompositeOperation='lighter';this.particles.forEach(p=>{this.ctx.fillStyle=p.color;this.ctx.globalAlpha=Math.max(0,Math.min(1,p.life));this.ctx.beginPath();this.ctx.arc(p.x,p.y,p.life*6,0,Math.PI*2);this.ctx.fill();});this.ctx.globalAlpha=1.0;this.ctx.globalCompositeOperation='source-over';
  }
  drawMonster(x,centerY,height,isBoss,enemyData=null){
    const time=performance.now()/250,h=height*0.8,bodyR=h*0.3,walkPhase=time*(isBoss?2.5:5),bounce=Math.abs(Math.sin(walkPhase))*h*0.05;
    this.ctx.save();
    const bodyBase='#605060',bodyDark='#2a1a2a',virusRed='#e62e2e',virusDarkRed='#8b0000',eyeGreen='#ccff00';
    if(isBoss){
      const bodyY=centerY-bodyR*1.3-bounce;this.ctx.translate(x,bodyY);this.ctx.scale(-1,1);
      const drawLeg=(isFront,phase)=>{const lift=Math.max(0,Math.sin(phase))*bodyR*0.5,reach=Math.cos(phase)*bodyR*0.6,hipX=isFront?bodyR*0.2:-bodyR*0.2,hipY=bodyR*0.4,kneeX=hipX+reach*0.5,kneeY=bodyR*0.8-lift*0.5,footX=hipX+reach,footY=bodyR*1.3-lift;this.ctx.lineWidth=bodyR*0.4;this.ctx.lineCap="round";this.ctx.lineJoin="round";this.ctx.strokeStyle=isFront?virusDarkRed:'#4d0000';this.ctx.beginPath();this.ctx.moveTo(hipX,hipY);this.ctx.lineTo(kneeX,kneeY);this.ctx.lineTo(footX,footY);this.ctx.stroke();this.ctx.lineWidth=bodyR*0.15;this.ctx.strokeStyle=isFront?virusRed:'#b30000';this.ctx.beginPath();this.ctx.moveTo(hipX,hipY);this.ctx.lineTo(kneeX,kneeY);this.ctx.lineTo(footX,footY);this.ctx.stroke();this.ctx.fillStyle=isFront?virusRed:'#b30000';this.ctx.beginPath();this.ctx.moveTo(footX-bodyR*0.2,footY);this.ctx.lineTo(footX+bodyR*0.4,footY+bodyR*0.1);this.ctx.lineTo(footX+bodyR*0.1,footY-bodyR*0.2);this.ctx.fill();};
      drawLeg(false,walkPhase+Math.PI);
      this.ctx.lineWidth=bodyR*0.12;this.ctx.lineCap="round";
      for(let i=0;i<10;i++){const angle=(i/10)*Math.PI+Math.PI,sx=Math.cos(angle)*bodyR*0.8,sy=Math.sin(angle)*bodyR*0.8,ex=Math.cos(angle)*bodyR*1.5,ey=Math.sin(angle)*bodyR*1.5;this.ctx.strokeStyle=virusDarkRed;this.ctx.beginPath();this.ctx.moveTo(sx,sy);this.ctx.lineTo(ex,ey);this.ctx.stroke();this.ctx.fillStyle=virusRed;this.ctx.beginPath();this.ctx.arc(ex,ey,bodyR*0.15,0,Math.PI*2);this.ctx.fill();}
      const grad=this.ctx.createRadialGradient(bodyR*0.2,-bodyR*0.2,bodyR*0.1,0,0,bodyR);grad.addColorStop(0,bodyBase);grad.addColorStop(1,bodyDark);this.ctx.fillStyle=grad;this.ctx.beginPath();this.ctx.ellipse(0,0,bodyR,bodyR*0.9,0,0,Math.PI*2);this.ctx.fill();
      this.ctx.fillStyle=eyeGreen;this.ctx.shadowBlur=20;this.ctx.shadowColor=eyeGreen;this.ctx.beginPath();this.ctx.ellipse(bodyR*0.4,-bodyR*0.2,bodyR*0.25,bodyR*0.15,-Math.PI/8,0,Math.PI*2);this.ctx.fill();this.ctx.shadowBlur=0;this.ctx.fillStyle='#000';this.ctx.beginPath();this.ctx.arc(bodyR*0.5,-bodyR*0.2,bodyR*0.08,0,Math.PI*2);this.ctx.fill();
      this.ctx.fillStyle='#111';this.ctx.strokeStyle=virusRed;this.ctx.lineWidth=bodyR*0.08;this.ctx.beginPath();this.ctx.moveTo(bodyR*0.9,bodyR*0.2);this.ctx.lineTo(bodyR*0.2,bodyR*0.1);this.ctx.lineTo(bodyR*0.5,bodyR*0.6);this.ctx.closePath();this.ctx.fill();this.ctx.stroke();
      this.ctx.fillStyle='#e6e6c8';this.ctx.beginPath();this.ctx.moveTo(bodyR*0.8,bodyR*0.2);this.ctx.lineTo(bodyR*0.7,bodyR*0.4);this.ctx.lineTo(bodyR*0.6,bodyR*0.15);this.ctx.moveTo(bodyR*0.6,bodyR*0.15);this.ctx.lineTo(bodyR*0.5,bodyR*0.35);this.ctx.lineTo(bodyR*0.4,bodyR*0.1);this.ctx.moveTo(bodyR*0.7,bodyR*0.5);this.ctx.lineTo(bodyR*0.6,bodyR*0.3);this.ctx.lineTo(bodyR*0.5,bodyR*0.6);this.ctx.fill();
      const drawArm=(isFront,phase)=>{const swing=Math.cos(phase)*bodyR*0.5,shoulderX=isFront?bodyR*0.1:-bodyR*0.1,shoulderY=bodyR*0.1,elbowX=shoulderX+bodyR*0.4+swing*0.5,elbowY=shoulderY+bodyR*0.5,handX=elbowX+bodyR*0.3+swing,handY=elbowY+bodyR*0.4;this.ctx.lineWidth=bodyR*0.35;this.ctx.strokeStyle=isFront?virusDarkRed:'#4d0000';this.ctx.lineJoin="round";this.ctx.beginPath();this.ctx.moveTo(shoulderX,shoulderY);this.ctx.lineTo(elbowX,elbowY);this.ctx.lineTo(handX,handY);this.ctx.stroke();this.ctx.lineWidth=bodyR*0.12;this.ctx.strokeStyle=isFront?virusRed:'#b30000';this.ctx.beginPath();this.ctx.moveTo(shoulderX,shoulderY);this.ctx.lineTo(elbowX,elbowY);this.ctx.lineTo(handX,handY);this.ctx.stroke();this.ctx.fillStyle=isFront?virusRed:'#b30000';this.ctx.beginPath();this.ctx.moveTo(handX,handY-bodyR*0.2);this.ctx.lineTo(handX+bodyR*0.4,handY+bodyR*0.1);this.ctx.lineTo(handX+bodyR*0.1,handY+bodyR*0.4);this.ctx.lineTo(handX-bodyR*0.2,handY+bodyR*0.2);this.ctx.fill();};
      drawLeg(true,walkPhase);drawArm(false,walkPhase+Math.PI);drawArm(true,walkPhase);
    } else {
      const floatY=Math.sin(time*4)*bodyR*0.15,bodyY=centerY+height*0.45-bodyR*1.5-bounce;this.ctx.translate(x,bodyY+floatY);
      this.ctx.lineWidth=bodyR*0.12;this.ctx.lineCap="round";
      for(let i=0;i<12;i++){const angle=(i/12)*Math.PI*2+time,sx=Math.cos(angle)*bodyR*0.8,sy=Math.sin(angle)*bodyR*0.8,ex=Math.cos(angle)*bodyR*1.5,ey=Math.sin(angle)*bodyR*1.5;this.ctx.strokeStyle=virusDarkRed;this.ctx.beginPath();this.ctx.moveTo(sx,sy);this.ctx.lineTo(ex,ey);this.ctx.stroke();this.ctx.fillStyle=virusRed;this.ctx.beginPath();this.ctx.arc(ex,ey,bodyR*0.15,0,Math.PI*2);this.ctx.fill();}
      const drawFrontLeg=(side,phase)=>{const lift=Math.max(0,Math.sin(phase))*bodyR*0.4,hipX=side*bodyR*0.4,hipY=bodyR*0.6,kneeX=side*bodyR*0.6,kneeY=bodyR*1.0-lift*0.5,footX=side*bodyR*0.7,footY=bodyR*1.4-lift;this.ctx.lineWidth=bodyR*0.35;this.ctx.lineJoin="round";this.ctx.strokeStyle=virusDarkRed;this.ctx.beginPath();this.ctx.moveTo(hipX,hipY);this.ctx.lineTo(kneeX,kneeY);this.ctx.lineTo(footX,footY);this.ctx.stroke();this.ctx.lineWidth=bodyR*0.15;this.ctx.strokeStyle=virusRed;this.ctx.beginPath();this.ctx.moveTo(hipX,hipY);this.ctx.lineTo(kneeX,kneeY);this.ctx.lineTo(footX,footY);this.ctx.stroke();this.ctx.fillStyle=virusRed;this.ctx.beginPath();this.ctx.moveTo(footX,footY-bodyR*0.1);this.ctx.lineTo(footX+side*bodyR*0.3,footY+bodyR*0.1);this.ctx.lineTo(footX-side*bodyR*0.1,footY+bodyR*0.1);this.ctx.fill();};
      drawFrontLeg(-1,walkPhase);drawFrontLeg(1,walkPhase+Math.PI);
      const grad=this.ctx.createRadialGradient(0,-bodyR*0.2,bodyR*0.1,0,0,bodyR);grad.addColorStop(0,bodyBase);grad.addColorStop(1,bodyDark);this.ctx.fillStyle=grad;this.ctx.beginPath();this.ctx.arc(0,0,bodyR,0,Math.PI*2);this.ctx.fill();
      this.ctx.fillStyle=eyeGreen;this.ctx.shadowBlur=20;this.ctx.shadowColor=eyeGreen;this.ctx.beginPath();this.ctx.ellipse(0,-bodyR*0.2,bodyR*0.4,bodyR*0.25,0,0,Math.PI*2);this.ctx.fill();this.ctx.shadowBlur=0;this.ctx.fillStyle='#000';this.ctx.beginPath();this.ctx.arc(0,-bodyR*0.2,bodyR*0.12,0,Math.PI*2);this.ctx.fill();
      this.ctx.fillStyle='#111';this.ctx.strokeStyle=virusRed;this.ctx.lineWidth=bodyR*0.08;this.ctx.beginPath();this.ctx.ellipse(0,bodyR*0.4,bodyR*0.5,bodyR*0.3,0,0,Math.PI*2);this.ctx.fill();this.ctx.stroke();
      this.ctx.fillStyle='#e6e6c8';for(let i=-1;i<=1;i+=0.5){if(i===0)continue;this.ctx.beginPath();this.ctx.moveTo(i*bodyR*0.4,bodyR*0.2);this.ctx.lineTo((i-0.1)*bodyR*0.4,bodyR*0.4);this.ctx.lineTo((i+0.1)*bodyR*0.4,bodyR*0.2);this.ctx.fill();this.ctx.beginPath();this.ctx.moveTo(i*bodyR*0.4,bodyR*0.6);this.ctx.lineTo((i-0.1)*bodyR*0.4,bodyR*0.4);this.ctx.lineTo((i+0.1)*bodyR*0.4,bodyR*0.6);this.ctx.fill();}
      const drawFrontArm=(side,phase)=>{const swing=Math.cos(phase)*bodyR*0.4,shoulderX=side*bodyR*0.7,shoulderY=0,elbowX=side*bodyR*1.1+swing,elbowY=bodyR*0.3,handX=side*bodyR*1.3+swing*1.5,handY=bodyR*0.7;this.ctx.lineWidth=bodyR*0.3;this.ctx.strokeStyle=virusDarkRed;this.ctx.lineJoin="round";this.ctx.beginPath();this.ctx.moveTo(shoulderX,shoulderY);this.ctx.lineTo(elbowX,elbowY);this.ctx.lineTo(handX,handY);this.ctx.stroke();this.ctx.lineWidth=bodyR*0.12;this.ctx.strokeStyle=virusRed;this.ctx.beginPath();this.ctx.moveTo(shoulderX,shoulderY);this.ctx.lineTo(elbowX,elbowY);this.ctx.lineTo(handX,handY);this.ctx.stroke();this.ctx.fillStyle=virusRed;this.ctx.beginPath();this.ctx.moveTo(handX,handY-bodyR*0.2);this.ctx.lineTo(handX+side*bodyR*0.3,handY+bodyR*0.2);this.ctx.lineTo(handX-side*bodyR*0.3,handY+bodyR*0.2);this.ctx.fill();};
      drawFrontArm(-1,walkPhase+Math.PI);drawFrontArm(1,walkPhase);
    }
    this.ctx.restore();
  }
  loop(timestamp){
    if(!this.running)return;
    if(this.paused){
      this.lastTime=timestamp;
      requestAnimationFrame(t=>this.loop(t));
      return;
    }
    const dt=Math.min((timestamp-this.lastTime)/1000,0.1); this.lastTime=timestamp;
    if(GameState.mode==='transition'){this.renderTransition(dt);requestAnimationFrame(t=>this.loop(t));return;}
    this.phaseTimer-=dt; const tleft=Math.max(0,Math.ceil(this.phaseTimer)),te=$('hud-time'); te.textContent=tleft; te.classList.toggle('urgent',tleft<=5); te.classList.toggle('warn',tleft>5&&tleft<=10);
    if(this.phaseTimer<=40&&this.phaseTimer>39&&GameState.mode==='purge'){this.startTransition('sort','FIREWALL BREACH: SORT PACKETS');}
    else if(this.phaseTimer<=20&&this.phaseTimer>19&&GameState.mode==='sort'){this.startTransition('type','CORE MELTDOWN: DESTROY MALWARE');}
    else if(this.phaseTimer<=0){this.stop();return;}   
    if(GameState.mode==='purge'){this.updateFPS(dt);this.renderFPS();}
    else if(GameState.mode==='sort'){this.updateSort(dt);this.renderSort();}
    else if(GameState.mode==='type'){this.updateType(dt);this.renderType();}
    requestAnimationFrame(t=>this.loop(t));
  }
}

const game = new Engine();

// UI WIRING
if($('btn-restart')) $('btn-restart').addEventListener('click',()=>game.start());
if($('btn-menu')) $('btn-menu').addEventListener('click',()=>location.reload());

if($('btn-start-p2')) $('btn-start-p2').addEventListener('click',()=>{
  $('screen-intermission').classList.add('g-off');
  currentPlayer = 2;
  game.playerName = player2Name;
  game.start();
});
if($('btn-multi-rematch')) $('btn-multi-rematch').addEventListener('click',()=>{
  $('screen-multi-result').classList.add('g-off');
  currentPlayer = 1;
  game.playerName = playerName;
  game.start();
});
if($('btn-multi-menu')) $('btn-multi-menu').addEventListener('click',()=>location.reload());

if($('btn-endlb')) $('btn-endlb').addEventListener('click',()=>{ renderLeaderboardInto('lbList'); $('screen-end').classList.add('g-off'); $('gameApp').classList.remove('on'); $('app').style.display=''; window._introStopped=false; state=State.MENU; show($('menu')); $('menuPanel').classList.add('show'); refreshProfile(); wallActive=false; if(clock)clock.getDelta(); animate(); renderLeaderboardInto('lbList'); show($('lbModal')); });

if($('pause-btn')) $('pause-btn').addEventListener('click',()=>game.togglePause());
if($('btn-resume')) $('btn-resume').addEventListener('click',()=>game.resume());
if($('btn-prestart')) $('btn-prestart').addEventListener('click',()=>game.start());
if($('btn-pmenu')) $('btn-pmenu').addEventListener('click',()=>location.reload());

if($('btn-pinstr')) $('btn-pinstr').addEventListener('click',()=>{$('pause-instr').classList.remove('g-off');});
if($('btn-pinstr-close')) $('btn-pinstr-close').addEventListener('click',()=>{$('pause-instr').classList.add('g-off');});

if($('btn-plb')) $('btn-plb').addEventListener('click',()=>{ renderLeaderboardInto('pauseLbList'); $('pause-lb').classList.remove('g-off'); });
if($('pauseLbClose')) $('pauseLbClose').addEventListener('click',()=>{$('pause-lb').classList.add('g-off');});
if($('pauseLbClear')) $('pauseLbClear').addEventListener('click',()=>{ if(confirm('Clear the local leaderboard and personal best on this device?')){ clearLeaderboard(); renderLeaderboardInto('pauseLbList'); } });

function bootIntro(){
  initThree(); initMenuEvents(); sizeFX();
  $('nameSubmit').onclick=submitName;
  $('nameField').addEventListener('keydown',e=>{if(e.code==='Enter')submitName();});
  $('nameField').addEventListener('input',()=>{ $('nameField').classList.remove('shake-err'); $('nameErr').textContent=''; });
  $('enter').querySelector('.enter-box').onclick=startExperience;
  window.addEventListener('resize',()=>{if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);sizeFX();});
  animate();
  setTimeout(()=>{hide($('loader'));state=State.ENTER;show($('enter'));},900);
}

if(window.THREE){ bootIntro(); }
else{ $('loader').innerHTML='<p style="color:#ff6b85;max-width:400px;line-height:1.6">Three.js failed to load from CDN.<br>This office network may block cdnjs. Open on a network that allows it, or host three.min.js locally next to this file.</p>'; }