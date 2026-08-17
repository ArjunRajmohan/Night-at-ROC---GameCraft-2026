const UST={navy:0x050a18,navy2:0x0a1230,panel:0x101a44,cyan:0x22e6ff,cyanDim:0x0fb9d6,red:0xff3355};
const State={LOADING:'LOADING',ENTER:'ENTER',TUTORIAL:'TUTORIAL',SEATED:'SEATED',NAME:'NAME',WALL:'WALL',GLITCH:'GLITCH',VORTEX:'VORTEX',RETURN:'RETURN',TITLE:'TITLE',MENU:'MENU',VICTORY:'VICTORY'};
let state=State.LOADING;

function show(el){el.classList.remove('gone');requestAnimationFrame(()=>el.classList.remove('hidden'));}
function hide(el){el.classList.add('hidden');setTimeout(()=>el.classList.add('gone'),650);}

let renderer,scene,camera;
const monitors=[];
let wallMesh,wallCtx,wallTex,wallCanvas;
const SEAT=new THREE.Vector3(0,1.6,-17);
const START=new THREE.Vector3(0,1.6,7);
let chairSpin=null;

function initThree(){
  const cv=$('glcanvas');
  renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x16305e);
  scene.fog=new THREE.FogExp2(0x1a3868,0.012);
  camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.1,400);
  camera.position.copy(START);
  clock=new THREE.Clock();
  buildRoom(); buildDeskRows(); buildMyChair(); buildWall(); buildLights();
}
function buildLights(){
  scene.add(new THREE.AmbientLight(0x9db8e6,1.05));
  scene.add(new THREE.HemisphereLight(0xbfe6ff,0x24406e,0.9));
  const key=new THREE.DirectionalLight(0xffffff,0.85); key.position.set(6,20,10); scene.add(key);
  const fill=new THREE.DirectionalLight(0x7fd4ff,0.4); fill.position.set(-8,12,-6); scene.add(fill);
  for(let z=6;z>-24;z-=4){
    const p=new THREE.PointLight(0xaef0ff,1.1,20,2); p.position.set(0,4.6,z); scene.add(p);
    const bar=new THREE.Mesh(new THREE.BoxGeometry(2.8,0.1,0.4),new THREE.MeshBasicMaterial({color:0xdaf8ff}));
    bar.position.set(0,4.88,z); scene.add(bar);
    [-6,6].forEach(sx=>{const sp=new THREE.PointLight(UST.cyan,0.5,14,2);sp.position.set(sx,4.4,z);scene.add(sp);});
  }
}
function buildRoom(){
  const W=26,L=90;
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(W,L),new THREE.MeshStandardMaterial({color:0x1c3357,roughness:0.3,metalness:0.55}));
  floor.rotation.x=-Math.PI/2; floor.position.z=-30; scene.add(floor);
  const grid=new THREE.GridHelper(90,60,0x5fe0ff,0x2a4a80); grid.material.opacity=0.35; grid.material.transparent=true; grid.position.z=-30; scene.add(grid);
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(W,L),new THREE.MeshStandardMaterial({color:0x152a4e,roughness:0.85}));
  ceil.rotation.x=Math.PI/2; ceil.position.set(0,5,-30); scene.add(ceil);
  const wallMat=new THREE.MeshStandardMaterial({color:0x22406e,roughness:0.7,metalness:0.25});
  const mkWall=x=>{const w=new THREE.Mesh(new THREE.PlaneGeometry(L,5),wallMat);w.rotation.y=x<0?Math.PI/2:-Math.PI/2;w.position.set(x,2.5,-30);scene.add(w);};
  mkWall(-W/2); mkWall(W/2);
  const back=new THREE.Mesh(new THREE.PlaneGeometry(W,5),wallMat); back.position.set(0,2.5,15); back.rotation.y=Math.PI; scene.add(back);
}
function buildMyChair(){
  const chair=new THREE.Group();
  const cushionMat=new THREE.MeshStandardMaterial({color:0x14294d,roughness:0.55,metalness:0.2});
  const trimMat=new THREE.MeshStandardMaterial({color:0x0c1c38,roughness:0.5,metalness:0.35,emissive:UST.cyanDim,emissiveIntensity:0.25});
  const chromeMat=new THREE.MeshStandardMaterial({color:0x8fb6d8,roughness:0.25,metalness:0.9});
  const seat=new THREE.Mesh(new THREE.BoxGeometry(0.62,0.12,0.6),cushionMat); seat.position.y=0.52; chair.add(seat);
  const seatEdge=new THREE.Mesh(new THREE.BoxGeometry(0.66,0.05,0.64),trimMat); seatEdge.position.y=0.46; chair.add(seatEdge);
  const back=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.72,0.09),cushionMat); back.position.set(0,0.92,-0.28); back.rotation.x=-0.12; chair.add(back);
  const backGlow=new THREE.Mesh(new THREE.BoxGeometry(0.64,0.76,0.04),trimMat); backGlow.position.set(0,0.92,-0.32); backGlow.rotation.x=-0.12; chair.add(backGlow);
  const head=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.16,0.08),cushionMat); head.position.set(0,1.34,-0.31); head.rotation.x=-0.12; chair.add(head);
  [-1,1].forEach(sx=>{
    const arm=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.05,0.42),trimMat); arm.position.set(sx*0.36,0.62,0.02); chair.add(arm);
    const armPost=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.16,0.05),chromeMat); armPost.position.set(sx*0.36,0.53,0.02); chair.add(armPost);
  });
  const post=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.42,12),chromeMat); post.position.y=0.24; chair.add(post);
  const wheels=new THREE.Group();
  for(let i=0;i<5;i++){
    const ang=(i/5)*Math.PI*2;
    const leg=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.04,0.34),chromeMat); leg.position.set(Math.sin(ang)*0.18,0.045,Math.cos(ang)*0.18); leg.rotation.y=-ang; wheels.add(leg);
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.05,10),trimMat); wheel.rotation.z=Math.PI/2; wheel.position.set(Math.sin(ang)*0.34,0.05,Math.cos(ang)*0.34); wheels.add(wheel);
  }
  chair.add(wheels);
  chair.position.set(0,0,SEAT.z+0.55); scene.add(chair); window._chair=chair;
}

function drawMyScreen(t){
  const cv=window._myCv; if(!cv) return;
  const c=cv.getContext('2d'),W=cv.width,H=cv.height,mode=window._myScreenMode;
  if(mode==='off'){
    const pulse=0.5+0.5*Math.abs(Math.sin(t*3));
    c.fillStyle='#04101f'; c.fillRect(0,0,W,H);
    const g=c.createRadialGradient(W/2,H/2,20,W/2,H/2,W/1.4); g.addColorStop(0,'rgba(34,230,255,'+(0.18*pulse)+')'); g.addColorStop(1,'rgba(4,16,31,0)'); c.fillStyle=g; c.fillRect(0,0,W,H);
    c.strokeStyle='rgba(34,230,255,'+(0.4+0.4*pulse)+')'; c.lineWidth=8; c.strokeRect(14,14,W-28,H-28);
    c.strokeStyle='#22e6ff'; c.lineWidth=10; c.lineCap='round'; c.beginPath(); c.arc(W/2,H/2-40,42,Math.PI,2*Math.PI); c.stroke();
    c.fillStyle='#0a2a44'; c.fillRect(W/2-58,H/2-40,116,90); c.strokeStyle='#22e6ff'; c.lineWidth=5; c.strokeRect(W/2-58,H/2-40,116,90);
    c.fillStyle='#22e6ff'; c.fillRect(W/2-7,H/2-8,14,34);
    c.textAlign='center'; c.fillStyle='rgba(34,230,255,'+(0.6+0.4*pulse)+')'; c.font='bold 60px Consolas'; c.fillText('\u25B6 LOG IN',W/2,H-90);
    c.fillStyle='#8fc7db'; c.font='24px Consolas'; c.fillText('walk here to start your shift',W/2,H-46); c.textAlign='left';
    window._myScreenTex.needsUpdate=true; return;
  } else if(mode==='desktop'){
    c.fillStyle='#0a1c3a'; c.fillRect(0,0,W,H); c.fillStyle='#0f2a52'; c.fillRect(0,0,W,54);
    c.fillStyle='#22e6ff'; c.font='bold 26px Consolas'; c.fillText('UST \u00B7 ROC CONSOLE',24,36);
    c.fillStyle='#8fc7db'; c.font='20px Consolas'; c.textAlign='right'; c.fillText('operator: '+(playerName||'\u2014'),W-24,36); c.textAlign='left';
    const tiles=[['NETWORK','STABLE'],['ALERTS','0 OPEN'],['LATENCY','12 ms'],['UPTIME','99.99%']];
    tiles.forEach((tl,i)=>{const x=30+i*245,y=110;c.fillStyle='rgba(43,255,136,0.12)';c.fillRect(x,y,220,120);c.strokeStyle='#2bff88';c.lineWidth=2;c.strokeRect(x,y,220,120);c.fillStyle='#7dffb5';c.font='16px Consolas';c.fillText(tl[0],x+16,y+34);c.fillStyle='#eafeff';c.font='bold 30px Consolas';c.fillText(tl[1],x+16,y+80);});
    c.fillStyle='#5fa7bd'; c.font='18px Consolas'; c.fillText('> all systems nominal. monitoring\u2026',30,300);
    if(Math.floor(t*2)%2===0){c.fillStyle='#22e6ff';c.fillRect(30+340,286,14,20);}
  } else if(mode==='secured'){
    c.fillStyle='#06180f'; c.fillRect(0,0,W,H); c.fillStyle='#0b2a1a'; c.fillRect(0,0,W,54);
    c.fillStyle='#2bff88'; c.font='bold 26px Consolas'; c.fillText('UST \u00B7 ROC CONSOLE',24,36);
    c.fillStyle='#8fe0b8'; c.font='20px Consolas'; c.textAlign='right'; c.fillText('operator: '+(playerName||'\u2014'),W-24,36); c.textAlign='left';
    const pulse=0.5+0.5*Math.abs(Math.sin(t*2));
    c.textAlign='center'; c.fillStyle='rgba(43,255,136,'+(0.7+0.3*pulse)+')'; c.font='bold 70px Consolas'; c.fillText('\u2713 CORE SECURED',W/2,H/2-10);
    c.fillStyle='#7dffb5'; c.font='26px Consolas'; c.fillText('threat neutralised \u00B7 shift complete',W/2,H/2+40); c.textAlign='left';
    const tiles=[['NETWORK','STABLE'],['ALERTS','0 OPEN'],['THREATS','CLEARED'],['UPTIME','99.99%']];
    tiles.forEach((tl,i)=>{const x=30+i*245,y=H-150;c.fillStyle='rgba(43,255,136,0.14)';c.fillRect(x,y,220,110);c.strokeStyle='#2bff88';c.lineWidth=2;c.strokeRect(x,y,220,110);c.fillStyle='#7dffb5';c.font='15px Consolas';c.fillText(tl[0],x+14,y+30);c.fillStyle='#eafeff';c.font='bold 26px Consolas';c.fillText(tl[1],x+14,y+72);});
  } else if(mode==='alert'){
    const flash=Math.abs(Math.sin(t*6));
    c.fillStyle='#12030a'; c.fillRect(0,0,W,H);
    c.strokeStyle='rgba(255,51,85,'+(0.5+0.5*flash)+')'; c.lineWidth=14; c.strokeRect(10,10,W-20,H-20);
    for(let y=0;y<H;y+=4){c.fillStyle='rgba(255,51,85,'+(Math.random()*0.06)+')';c.fillRect(0,y,W,2);}
    const jx=(Math.random()-0.5)*10; c.textAlign='center';
    c.fillStyle='rgba(255,51,85,'+(0.6+0.4*flash)+')'; c.font='bold 78px Consolas'; c.fillText('\u26A0 SOMETHING IS WRONG',W/2+jx,H/2-30);
    c.fillStyle='#ff8fa3'; c.font='34px Consolas'; c.fillText('INSIDE THE MONITOR SCREEN',W/2-jx,H/2+30);
    if(flash>0.7){c.fillStyle='rgba(34,230,255,0.5)';c.font='bold 78px Consolas';c.fillText('\u26A0 SOMETHING IS WRONG',W/2+jx+6,H/2-34);}
    c.fillStyle='#ff3355'; c.font='22px Consolas'; c.fillText('signal integrity '+Math.max(0,(100-t*60|0))+'%   \u00B7   do not look away',W/2,H-70); c.textAlign='left';
  }
  window._myScreenTex.needsUpdate=true;
}

function buildDeskRows(){
  const deskMat=new THREE.MeshStandardMaterial({color:0x24406e,roughness:0.5,metalness:0.45});
  const frameMat2=new THREE.MeshStandardMaterial({color:0x18294a,roughness:0.5});
  const rows=5,perRow=2;
  for(let r=0;r<rows;r++){
    const z=0-r*3.6;
    [-1,1].forEach(side=>{
      for(let c=0;c<perRow;c++){
        const x=side*(3.2+c*2.6);
        const desk=new THREE.Mesh(new THREE.BoxGeometry(2.2,0.12,1.2),deskMat); desk.position.set(x,0.95,z); scene.add(desk);
        [-0.9,0.9].forEach(lx=>{const leg=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.95,0.08),frameMat2);leg.position.set(x+lx,0.47,z);scene.add(leg);});
        const stand=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.12,0.35,8),frameMat2); stand.position.set(x,1.18,z-0.2); scene.add(stand);
        for(let m=0;m<2;m++){
          const screenMat=new THREE.MeshStandardMaterial({color:0x0a2a44,emissive:UST.cyan,emissiveIntensity:0.45,roughness:0.25});
          const scr=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.55,0.04),screenMat); scr.position.set(x+(m?0.5:-0.5),1.55,z-0.25); scr.rotation.y=(m?-1:1)*0.18; scene.add(scr); monitors.push(screenMat);
        }
        const chair=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.1,0.6),deskMat); chair.position.set(x,0.55,z+0.9); scene.add(chair);
        const chBack=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.7,0.08),deskMat); chBack.position.set(x,0.9,z+1.18); scene.add(chBack);
      }
    });
  }
  const seatGlow=new THREE.Mesh(new THREE.RingGeometry(0.6,0.8,32),new THREE.MeshBasicMaterial({color:UST.cyan,side:THREE.DoubleSide,transparent:true,opacity:0.5}));
  seatGlow.rotation.x=-Math.PI/2; seatGlow.position.set(0,0.06,SEAT.z-0.5); scene.add(seatGlow); window._seatGlow=seatGlow;
  window._arrows=[];
  const myDesk=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.12,1.3),deskMat); myDesk.position.set(0,0.95,SEAT.z-1.1); scene.add(myDesk);
  const myCv=document.createElement('canvas'); myCv.width=1024; myCv.height=576;
  const myScreenTex=new THREE.CanvasTexture(myCv);
  const myScreenMat=new THREE.MeshStandardMaterial({color:0x000000,map:myScreenTex,emissive:0xffffff,emissiveMap:myScreenTex,emissiveIntensity:0.9,roughness:0.25});
  const myScreen=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.85,0.05),myScreenMat); myScreen.position.set(0,1.7,SEAT.z-1.5); scene.add(myScreen);
  window._myScreenMat=myScreenMat; window._myCv=myCv; window._myScreenTex=myScreenTex; window._myScreenMode='off'; drawMyScreen(0);
  const beaconCv=document.createElement('canvas'); beaconCv.width=512; beaconCv.height=256;
  const bx=beaconCv.getContext('2d');
  bx.fillStyle='rgba(5,10,24,0.85)'; bx.fillRect(0,0,512,256); bx.strokeStyle='#22e6ff'; bx.lineWidth=6; bx.strokeRect(8,8,496,240);
  bx.textAlign='center'; bx.fillStyle='#22e6ff'; bx.font='bold 72px Consolas'; bx.fillText('\u25BC LOG IN',256,110); bx.font='30px Consolas'; bx.fillStyle='#8fc7db'; bx.fillText('YOUR WORKSTATION',256,175);
  const beaconTex=new THREE.CanvasTexture(beaconCv);
  const beacon=new THREE.Mesh(new THREE.PlaneGeometry(3.8,1.9),new THREE.MeshBasicMaterial({map:beaconTex,transparent:true,side:THREE.DoubleSide}));
  beacon.position.set(0,3.2,SEAT.z-1.2); scene.add(beacon); window._beacon=beacon;
  const pillar=new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.9,4,24,1,true),new THREE.MeshBasicMaterial({color:UST.cyan,transparent:true,opacity:0.06,side:THREE.DoubleSide}));
  pillar.position.set(0,2,SEAT.z-1.2); scene.add(pillar); window._pillar=pillar;
}

function buildWall(){
  wallCanvas=document.createElement('canvas'); wallCanvas.width=2048; wallCanvas.height=1024;
  wallCtx=wallCanvas.getContext('2d'); wallTex=new THREE.CanvasTexture(wallCanvas); wallTex.minFilter=THREE.LinearFilter;
  wallMesh=new THREE.Mesh(new THREE.PlaneGeometry(24,10),new THREE.MeshBasicMaterial({map:wallTex}));
  wallMesh.position.set(0,3,SEAT.z-3.2); scene.add(wallMesh);
  const frame=new THREE.Mesh(new THREE.BoxGeometry(24.6,10.6,0.2),new THREE.MeshBasicMaterial({color:UST.cyanDim}));
  frame.position.set(0,3,SEAT.z-3.35); scene.add(frame);
}
let wallActive=false,wallStutter=0,wallSecured=false;
const graphs=[]; for(let i=0;i<6;i++){graphs.push(Array.from({length:60},()=>Math.random()));}
const matrixCols=Array.from({length:40},()=>({y:Math.random()*1024,sp:2+Math.random()*6}));
function drawWall(t){
  const c=wallCtx,W=2048,H=1024; c.fillStyle='#050a18'; c.fillRect(0,0,W,H);
  const stutter=wallStutter>0,jitter=stutter?(Math.random()-0.5)*40:0;
  const cardW=W/6;
  for(let i=0;i<6;i++){
    const crit=wallSecured?false:((Math.sin(t*3+i)*0.5+0.5)>0.4); const x=i*cardW+10+jitter,y=20,w=cardW-20,h=150;
    c.fillStyle=crit?'rgba(255,51,85,'+(0.25+0.25*Math.abs(Math.sin(t*6+i)))+')':'rgba(43,255,136,0.12)'; c.fillRect(x,y,w,h);
    c.strokeStyle=crit?'#ff3355':'#2bff88'; c.lineWidth=2; c.strokeRect(x,y,w,h);
    c.fillStyle=crit?'#ff6b85':'#7dffb5'; c.font='bold 22px Consolas'; c.fillText(crit?'\u25CF CRITICAL':'\u25CF OK',x+16,y+34);
    c.font='14px Consolas'; c.fillStyle='#9fc7d8'; c.fillText('NAGIOS \u00B7 host-'+(i+11),x+16,y+58); c.fillText(crit?'CHECK_DISK / CPU load':'service healthy',x+16,y+80); c.fillText(crit?('ping '+(120+Math.floor(Math.random()*400))+'ms'):'ping 12ms',x+16,y+104);
  }
  const gTop=200,gH=(H-260)/2;
  for(let g=0;g<6;g++){
    const gx=(g%3)*(W/3)+14+jitter,gy=gTop+Math.floor(g/3)*(gH+16),gw=W/3-28,ghh=gH-8;
    c.fillStyle='rgba(16,26,68,0.7)'; c.fillRect(gx,gy,gw,ghh); c.strokeStyle='rgba(34,230,255,0.3)'; c.lineWidth=1; c.strokeRect(gx,gy,gw,ghh);
    const s=graphs[g]; s.shift(); let nv=s[s.length-1]+(Math.random()-0.5)*((stutter?0.6:0.25)*(wallSecured?0.4:1)); nv=wallSecured?Math.max(0.05,Math.min(0.55,nv)):Math.max(0.02,Math.min(0.98,nv)); s.push(nv);
    c.beginPath(); c.strokeStyle=nv>0.8?'#ff3355':'#22e6ff'; c.lineWidth=2.4;
    s.forEach((v,i)=>{const px=gx+(i/(s.length-1))*gw,py=gy+ghh-v*ghh;i?c.lineTo(px,py):c.moveTo(px,py);}); c.stroke();
    c.lineTo(gx+gw,gy+ghh); c.lineTo(gx,gy+ghh); c.closePath(); c.fillStyle=nv>0.8?'rgba(255,51,85,0.12)':'rgba(34,230,255,0.10)'; c.fill();
    c.fillStyle='#8fc7db'; c.font='13px Consolas'; c.fillText('LogicMonitor \u00B7 datasource '+String.fromCharCode(65+g),gx+8,gy+18);
    c.fillStyle=nv>0.8?'#ff6b85':'#22e6ff'; c.font='bold 15px Consolas'; c.fillText((nv*100).toFixed(1)+'%',gx+gw-70,gy+18);
  }
  c.font='16px Consolas'; const glyphs='01\u2726\u203B\u2593\u2591\u039E\u03A8<>{}#@$%';
  matrixCols.forEach((col,i)=>{
    const x=i*(W/matrixCols.length)+6;
    for(let k=0;k<3;k++){const yy=(col.y-k*22)%H,a=k===0?0.9:(0.4-k*0.12);c.fillStyle='rgba(34,230,255,'+a+')';c.fillText(glyphs[Math.floor(Math.random()*glyphs.length)],x,yy);}
    col.y+=col.sp*(stutter?3:1); if(col.y>H+40)col.y=-20;
  });
  if(stutter){for(let b=0;b<6;b++){const by=Math.random()*H,bh=4+Math.random()*30;c.fillStyle='rgba(255,51,85,'+(0.15+Math.random()*0.4)+')';c.fillRect(0,by,W,bh);c.fillStyle='rgba(34,230,255,0.25)';c.fillRect(0,by+bh,W,2);}wallStutter-=1;}
  wallTex.needsUpdate=true;
}

const keys={};
let yaw=Math.PI,pitch=0,controlsEnabled=false,walkBob=0;
window.addEventListener('keydown',e=>{keys[e.code]=true; if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&!window._introStopped)e.preventDefault();});
window.addEventListener('keyup',e=>{keys[e.code]=false;});
if($('glcanvas')) $('glcanvas').addEventListener('click',()=>{if(controlsEnabled&&!document.pointerLockElement)$('glcanvas').requestPointerLock();});
window.addEventListener('mousemove',e=>{if(document.pointerLockElement===$('glcanvas')){yaw-=e.movementX*0.0022;pitch-=e.movementY*0.0022;pitch=Math.max(-1.1,Math.min(1.1,pitch));}});

function updateControls(dt){
  const dir=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
  camera.lookAt(camera.position.clone().add(dir));
  if(!controlsEnabled)return;
  const speed=5.4*dt;
  const fwd=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
  const right=new THREE.Vector3(Math.sin(yaw+Math.PI/2),0,Math.cos(yaw+Math.PI/2));
  let moved=false;
  if(keys['KeyW']||keys['ArrowUp']){camera.position.addScaledVector(fwd,speed);moved=true;}
  if(keys['KeyS']||keys['ArrowDown']){camera.position.addScaledVector(fwd,-speed);moved=true;}
  if(keys['KeyA']||keys['ArrowLeft']){camera.position.addScaledVector(right,speed);moved=true;}
  if(keys['KeyD']||keys['ArrowRight']){camera.position.addScaledVector(right,-speed);moved=true;}
  camera.position.x=Math.max(-2.0,Math.min(2.0,camera.position.x));
  camera.position.z=Math.max(SEAT.z,Math.min(8,camera.position.z));
  if(moved){walkBob+=dt*9;camera.position.y=1.6+Math.sin(walkBob)*0.05;}else camera.position.y+=(1.6-camera.position.y)*0.1;
  if(state===State.TUTORIAL&&camera.position.distanceTo(SEAT)<1.6)arriveAtSeat();
}
function setObjective(txt){const o=$('objective');o.textContent=txt;o.classList.remove('gone','hidden');}
function startExperience(){
  state=State.TUTORIAL; hide($('enter')); startHum();
  $('glcanvas').requestPointerLock(); controlsEnabled=false; setObjective('Entering the ROC\u2026');
  const air=$('airlock'); air.classList.remove('gone','open');
  setTimeout(()=>{playDoorHiss();air.classList.add('open');},650);
  setTimeout(()=>{air.classList.add('gone');show($('tutorial'));show($('loginHud'));$('crosshair').classList.remove('show');controlsEnabled=true;setObjective('Walk forward to your PC and log in');},2400);
}
function arriveAtSeat(){
  state=State.SEATED; controlsEnabled=false; document.exitPointerLock(); hide($('tutorial')); $('crosshair').classList.remove('show');
  setObjective('Taking your seat\u2026');
  if(window._beacon)window._beacon.visible=false; if(window._pillar)window._pillar.visible=false; hide($('loginHud'));
  spinChairThenSit();
}
function spinChairThenSit(){
  playChairSpin(); chairSpin={t:0,dur:1.5,spins:2.25};
  const seatedEye=new THREE.Vector3(0,1.5,SEAT.z+0.35);
  tweenCamera(seatedEye,{yaw:Math.PI,pitch:-0.05},1.5,()=>{
    setObjective('Logging in\u2026 powering on your workstation');
    tweenCamera(SEAT,{yaw:Math.PI,pitch:-0.05},0.9,()=>bootMonitor());
  });
}
function bootMonitor(){
  const m=window._myScreenMat; window._myScreenMode='desktop'; let e=0;
  const iv=setInterval(()=>{e+=0.05;m.emissiveIntensity=Math.min(1.0,e);if(e>=1.0){clearInterval(iv);showNameInput();}},40);
  setObjective('\u25B6 Monitor online');
}
function showNameInput(){state=State.NAME;show($('nameOverlay'));setTimeout(()=>$('nameField').focus(),400);}
function submitName(){
  const raw=$('nameField').value;
  const v=raw.trim();
  if(!v || raw !== v){
    const f=$('nameField'), e=$('nameErr');
    f.classList.remove('shake-err'); void f.offsetWidth; f.classList.add('shake-err');
    e.textContent = !v ? '⚠ Please enter your name to begin' : '⚠ Name cannot have leading or trailing spaces';
    return;
  }
  $('nameErr').textContent='';
  playerName=v;
  hide($('nameOverlay'));
  enterWallPhase();
}
function enterWallPhase(){
  state=State.WALL; setObjective('Monitoring the wall\u2026'); monitors.forEach(m=>{m.emissiveIntensity=0.85;}); wallActive=true; wallSecured=false;
  tweenCamera(new THREE.Vector3(0,1.7,SEAT.z-0.4),{yaw:Math.PI,pitch:0.06},2.0,()=>{
    $('objective').classList.add('gone');
    setTimeout(()=>{window._myScreenMode='alert';window._alertT=0;playStatic();},1400);
    setTimeout(triggerGlitch,4200);
  });
}

const fx=document.getElementById('fx'); 
let fxCtx = fx ? fx.getContext('2d') : null;
function sizeFX(){ if(fx) { fx.width=innerWidth; fx.height=innerHeight; } }
function triggerGlitch(){
  state=State.GLITCH; glitchT=0; setObjective('!! SIGNAL LOSS !!'); wallStutter=90; playStatic();
  show($('warpMsg'));
  setTimeout(triggerVortex,1700);
}
function triggerVortex(){state=State.VORTEX;vortexT=0;$('objective').classList.add('gone');}
function drawFX(dt){
  if(!fxCtx) return;
  const c=fxCtx,W=fx.width,H=fx.height; c.clearRect(0,0,W,H);
  if(state===State.GLITCH){
    glitchT+=dt; camera.position.x=Math.max(-2,Math.min(2,(Math.random()-0.5)*0.25)); camera.position.y=1.7+(Math.random()-0.5)*0.18;
    for(let i=0;i<26;i++){const y=Math.random()*H,h=2+Math.random()*40;const cols=['rgba(255,51,85,','rgba(34,230,255,','rgba(255,255,255,'];c.fillStyle=cols[i%3]+(0.05+Math.random()*0.5)+')';c.fillRect((Math.random()-0.5)*80,y,W+80,h);}
    if(Math.random()<0.4){c.fillStyle='rgba(34,230,255,'+Math.random()*0.3+')';c.fillRect(0,0,W,H);} return;
  }
  if(state===State.VORTEX){
    vortexT+=dt; const p=Math.min(1,vortexT/2.6);
    camera.position.z+=(SEAT.z-3.2-camera.position.z)*0.06; camera.fov=70+p*60; camera.updateProjectionMatrix();
    const cx=W/2,cy=H/2,maxR=Math.hypot(W,H),arms=140;
    for(let i=0;i<arms;i++){const ang=(i/arms)*Math.PI*2+vortexT*3,spin=ang+p*8,r=(i/arms)*maxR*(0.4+p);const x=cx+Math.cos(spin)*r*(1-p*0.2),y=cy+Math.sin(spin)*r*(1-p*0.2);c.fillStyle=`hsla(${180+Math.sin(i)*40},100%,55%,${0.06+p*0.25})`;c.beginPath();c.arc(x,y,3+p*10,0,Math.PI*2);c.fill();}
    const g=c.createRadialGradient(cx,cy,0,cx,cy,maxR*0.5*(0.2+p)); g.addColorStop(0,`rgba(255,255,255,${p})`); g.addColorStop(0.3,`rgba(34,230,255,${0.5*p})`); g.addColorStop(1,'rgba(5,10,24,0)'); c.fillStyle=g; c.fillRect(0,0,W,H);
    if(p<0.95){c.fillStyle='rgba(255,255,255,0.04)';for(let n=0;n<400;n++)c.fillRect(Math.random()*W,Math.random()*H,2,2);}
    if(p>=1&&state===State.VORTEX)fadeToTitle(); return;
  }
  if(state===State.RETURN){
    const elapsed=(performance.now()-(window._returnStart||performance.now()))/1000;
    const p=Math.min(1,elapsed/2.8), ease=1-Math.pow(1-p,3);
    camera.position.z=(SEAT.z-3.2)+3.2*ease;
    camera.position.x=(1-ease)*Math.sin(elapsed*9)*0.15;
    camera.position.y=1.7-(0.1*(1-ease));
    camera.fov=130-60*ease; camera.updateProjectionMatrix();
    yaw=Math.PI; pitch=0.06*(1-ease);
    const cx=W/2,cy=H/2,maxR=Math.hypot(W,H),arms=150;
    for(let i=0;i<arms;i++){
      const ang=(i/arms)*Math.PI*2 - elapsed*4, r=(1-ease*0.85)*maxR*(0.15+ (i/arms)*0.9);
      const x=cx+Math.cos(ang)*r, y=cy+Math.sin(ang)*r;
      c.fillStyle=`hsla(${170+Math.sin(i)*30},100%,60%,${0.30*(1-ease)})`;
      c.beginPath(); c.arc(x,y,2+ (1-ease)*8,0,Math.PI*2); c.fill();
    }
    const g=c.createRadialGradient(cx,cy,0,cx,cy,maxR*0.55);
    g.addColorStop(0,`rgba(230,255,245,${0.85*(1-ease)})`);
    g.addColorStop(0.35,`rgba(43,255,136,${0.4*(1-ease)})`);
    g.addColorStop(1,'rgba(5,16,20,0)');
    c.fillStyle=g; c.fillRect(0,0,W,H);
    if(p<0.8){c.strokeStyle=`rgba(43,255,136,${0.25*(1-ease)})`;c.lineWidth=2;for(let n=0;n<40;n++){const a=Math.random()*Math.PI*2,r1=maxR*0.1,r2=maxR*(0.4+Math.random()*0.4)*(1-ease);c.beginPath();c.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);c.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);c.stroke();}}
    if(p>=1&&state===State.RETURN){ c.clearRect(0,0,W,H); revealVictoryCard(); }
    return;
  }
}
function fadeToTitle(){
  state=State.TITLE; stopStatic(); stopHum();
  if(fxCtx){
    fxCtx.fillStyle='#fff'; fxCtx.fillRect(0,0,fx.width,fx.height);
    let a=1; const iv=setInterval(()=>{a-=0.06;fxCtx.clearRect(0,0,fx.width,fx.height);fxCtx.fillStyle='rgba(0,0,0,'+(1-a)+')';fxCtx.fillRect(0,0,fx.width,fx.height);if(a<=0){clearInterval(iv);fxCtx.fillStyle='#000';fxCtx.fillRect(0,0,fx.width,fx.height);launchMenu();}},40);
  }
}
function launchMenu(){
  hide($('warpMsg'));
  state=State.MENU; show($('menu')); wallActive=false; playMenuTone();
  const t=$('gameTitle'); t.classList.remove('zoom'); void t.offsetWidth; t.classList.add('zoom');
  setTimeout(()=>$('titleSub').classList.add('show'),1400); setTimeout(()=>$('menuPanel').classList.add('show'),1500); refreshProfile();
}

let _victoryScore=0,_lastStats=null;
function returnToOdyssey(score){
  _victoryScore=score;
  $('gameApp').classList.remove('on');
  $('app').style.display='';
  window._introStopped=false;
  ['menu','enter','tutorial','nameOverlay','editModal','instrModal','lbModal','victory','objective','loginHud','airlock'].forEach(idn=>{const el=$(idn);if(el){el.classList.add('gone');el.classList.remove('show');}});
  $('menuPanel').classList.remove('show'); $('titleSub').classList.remove('show');
  wallActive=true; wallSecured=true; window._myScreenMode='secured';
  monitors.forEach(m=>{m.emissiveIntensity=0.85;});
  if(window._chair)window._chair.rotation.y=0;
  if(window._beacon)window._beacon.visible=false;
  if(window._pillar)window._pillar.visible=false;
  tween=null; chairSpin=null; controlsEnabled=false;
  camera.position.set(0,1.7,SEAT.z-3.2); camera.fov=130; camera.updateProjectionMatrix();
  yaw=Math.PI; pitch=0.06;
  state=State.RETURN; returnT=0; window._returnStart=performance.now();
  if(fxCtx)fxCtx.clearRect(0,0,fx.width,fx.height);
  if(clock)clock.getDelta();
  animate();
  startHum(); playWarpBack();
  setTimeout(()=>{ if(state===State.RETURN) revealVictoryCard(); }, 3200);
}
function revealVictoryCard(){
  if(state===State.VICTORY) return;
  state=State.VICTORY; controlsEnabled=false;
  camera.position.copy(SEAT); camera.fov=70; camera.updateProjectionMatrix();
  yaw=Math.PI; pitch=0.02;
  if(fxCtx)fxCtx.clearRect(0,0,fx.width,fx.height);
  $('victoryScore').textContent=_victoryScore;
  $('victoryPB').textContent='Personal Best: '+getPersonalBest();
  $('victoryName').textContent=playerName;
  if(_lastStats){
    $('vsPurge').textContent=_lastStats.kills;
    $('vsAcc').textContent=_lastStats.sortAcc+'%';
    $('vsWords').textContent=_lastStats.wordsCompleted;
  }
  const v=$('victory'); v.classList.remove('gone','hidden');
  playMenuTone();
}

function initMenuEvents(){
  const openEdit=()=>{$('editField').value=playerName;show($('editModal'));setTimeout(()=>$('editField').focus(),300);};
  const saveEdit=()=>{
    const raw=$('editField').value; const v=raw.trim();
    if(!v||raw!==v){
      const f=$('editField'),e=$('editErr'); f.classList.remove('shake-err'); void f.offsetWidth; f.classList.add('shake-err');
      e.textContent=!v?'⚠ Please enter your name to begin':'⚠ Name cannot have leading or trailing spaces'; return;
    }
    playerName=v; refreshProfile(); hide($('editModal'));
  };
  $('editBtn').onclick=openEdit; $('editSave').onclick=saveEdit; $('editCancel').onclick=()=>hide($('editModal'));
  $('editField').addEventListener('keydown',e=>{if(e.code==='Enter')saveEdit();if(e.code==='Escape')hide($('editModal'));});
  $('editField').addEventListener('input',()=>{ $('editField').classList.remove('shake-err'); $('editErr').textContent=''; });

  $('startBtn').onclick=()=>{ isMultiplayer=false; currentPlayer=1; launchGameplay(); };
  
  const openP2=()=>{$('p2Field').value="";$('p2Field').classList.remove('shake-err');$('p2Err').textContent='';show($('p2Modal'));setTimeout(()=>$('p2Field').focus(),300);};
  const startP2=()=>{
    const raw=$('p2Field').value; const v=raw.trim();
    if(!v||raw!==v){
      const f=$('p2Field'),e=$('p2Err'); f.classList.remove('shake-err'); void f.offsetWidth; f.classList.add('shake-err');
      e.textContent=!v?'⚠ Please enter Player 2 name':'⚠ Name cannot have leading or trailing spaces'; return;
    }
    player2Name=v; isMultiplayer=true; currentPlayer=1; hide($('p2Modal')); launchGameplay();
  };
  $('multiBtn').onclick=openP2; $('p2Start').onclick=startP2; $('p2Cancel').onclick=()=>hide($('p2Modal'));
  $('p2Field').addEventListener('keydown',e=>{if(e.code==='Enter')startP2();if(e.code==='Escape')hide($('p2Modal'));});
  $('p2Field').addEventListener('input',()=>{ $('p2Field').classList.remove('shake-err'); $('p2Err').textContent=''; });

  $('instrBtn').onclick=()=>show($('instrModal'));
  $('closeModal').onclick=()=>hide($('instrModal'));
  $('leaderboardBtn').onclick=()=>{ renderLeaderboardInto('lbList'); show($('lbModal')); };
  $('lbClose').onclick=()=>hide($('lbModal'));
  $('lbClear').onclick=()=>{ if(confirm('Clear the local leaderboard and personal best on this device?')){ clearLeaderboard(); renderLeaderboardInto('lbList'); } };
  $('victoryReplay').onclick=()=>{ hide($('victory')); launchGameplay(); };
  $('victoryLb').onclick=()=>{ renderLeaderboardInto('lbList'); show($('lbModal')); };
  $('victoryMenu').onclick=()=>{ hide($('victory')); wallSecured=false; window._myScreenMode='desktop'; launchMenu(); };
}

let tween=null;
function tweenCamera(targetPos,targetLook,dur,done){tween={fromPos:camera.position.clone(),toPos:targetPos.clone(),fromYaw:yaw,toYaw:targetLook.yaw,fromPitch:pitch,toPitch:targetLook.pitch,t:0,dur,done};}
function updateTween(dt){if(!tween)return;tween.t+=dt;let k=Math.min(1,tween.t/tween.dur);const e=k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2;camera.position.lerpVectors(tween.fromPos,tween.toPos,e);yaw=tween.fromYaw+(tween.toYaw-tween.fromYaw)*e;pitch=tween.fromPitch+(tween.toPitch-tween.fromPitch)*e;if(k>=1){const d=tween.done;tween=null;if(d)d();}}

let audioCtx,humGain,staticNode,staticGain;
function startHum(){try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();if(humGain)return;const o1=audioCtx.createOscillator();o1.type='sine';o1.frequency.value=58;const o2=audioCtx.createOscillator();o2.type='sine';o2.frequency.value=87;humGain=audioCtx.createGain();humGain.gain.value=0.05;o1.connect(humGain);o2.connect(humGain);humGain.connect(audioCtx.destination);o1.start();o2.start();}catch(e){}}
function playDoorHiss(){try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const dur=1.4,sr=audioCtx.sampleRate,buf=audioCtx.createBuffer(1,sr*dur,sr),d=buf.getChannelData(0);for(let i=0;i<d.length;i++){const env=Math.sin(Math.PI*i/d.length);d[i]=(Math.random()*2-1)*env*0.5;}const src=audioCtx.createBufferSource();src.buffer=buf;const flt=audioCtx.createBiquadFilter();flt.type='bandpass';flt.frequency.value=900;flt.Q.value=1.2;const g=audioCtx.createGain();g.gain.value=0.18;src.connect(flt);flt.connect(g);g.connect(audioCtx.destination);src.start();}catch(e){}}
function playChairSpin(){try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const dur=1.5,sr=audioCtx.sampleRate,buf=audioCtx.createBuffer(1,sr*dur,sr),d=buf.getChannelData(0);for(let i=0;i<d.length;i++){const env=Math.sin(Math.PI*i/d.length);d[i]=(Math.random()*2-1)*env*0.4;}const src=audioCtx.createBufferSource();src.buffer=buf;const flt=audioCtx.createBiquadFilter();flt.type='bandpass';flt.Q.value=6;flt.frequency.setValueAtTime(300,audioCtx.currentTime);flt.frequency.linearRampToValueAtTime(1400,audioCtx.currentTime+dur*0.7);flt.frequency.linearRampToValueAtTime(500,audioCtx.currentTime+dur);const g=audioCtx.createGain();g.gain.value=0.14;src.connect(flt);flt.connect(g);g.connect(audioCtx.destination);src.start();}catch(e){}}
const staticVoices=[];
function playStatic(){try{if(!audioCtx)return;stopStatic();const bufSize=audioCtx.sampleRate*2,buf=audioCtx.createBuffer(1,bufSize,audioCtx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<bufSize;i++)d[i]=Math.random()*2-1;const node=audioCtx.createBufferSource();node.buffer=buf;node.loop=true;const gain=audioCtx.createGain();gain.gain.value=0.0;node.connect(gain);gain.connect(audioCtx.destination);node.start();gain.gain.linearRampToValueAtTime(0.28,audioCtx.currentTime+1.4);staticVoices.push({node,gain});}catch(e){}}
function stopStatic(){try{const now=audioCtx?audioCtx.currentTime:0;while(staticVoices.length){const v=staticVoices.pop();try{v.gain.gain.cancelScheduledValues(now);v.gain.gain.setValueAtTime(v.gain.gain.value,now);v.gain.gain.linearRampToValueAtTime(0,now+0.05);}catch(e){}try{v.node.stop(now+0.06);}catch(e){}(function(node,gain){setTimeout(()=>{try{node.disconnect();gain.disconnect();}catch(e){}},120);})(v.node,v.gain);}}catch(e){}}
function stopHum(){try{if(humGain){humGain.gain.cancelScheduledValues(audioCtx.currentTime);humGain.gain.linearRampToValueAtTime(0,audioCtx.currentTime+0.8);setTimeout(()=>{try{humGain=null;}catch(e){}},900);}}catch(e){}}
function playMenuTone(){try{if(!audioCtx)return;const notes=[196,261.6,329.6];notes.forEach((f,i)=>{const o=audioCtx.createOscillator();o.type='sine';o.frequency.value=f;const g=audioCtx.createGain();g.gain.value=0;o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.linearRampToValueAtTime(0.05,audioCtx.currentTime+1.2+i*0.15);o.stop(audioCtx.currentTime+2.4);});}catch(e){}}
function playWarpBack(){try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const now=audioCtx.currentTime;
  const o=audioCtx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(1200,now);o.frequency.exponentialRampToValueAtTime(180,now+2.4);
  const flt=audioCtx.createBiquadFilter();flt.type='lowpass';flt.frequency.setValueAtTime(4000,now);flt.frequency.exponentialRampToValueAtTime(600,now+2.4);
  const g=audioCtx.createGain();g.gain.setValueAtTime(0.0,now);g.gain.linearRampToValueAtTime(0.12,now+0.3);g.gain.linearRampToValueAtTime(0.0,now+2.6);
  o.connect(flt);flt.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+2.7);
  [392,523].forEach((f,i)=>{const oo=audioCtx.createOscillator();oo.type='sine';oo.frequency.value=f;const gg=audioCtx.createGain();gg.gain.setValueAtTime(0,now+2.0);gg.gain.linearRampToValueAtTime(0.05,now+2.5);gg.gain.linearRampToValueAtTime(0,now+3.2);oo.connect(gg);gg.connect(audioCtx.destination);oo.start(now+2.0);oo.stop(now+3.3);});
}catch(e){}}
function animate(){
  if(window._introStopped) return;
  requestAnimationFrame(animate);
  const dt=Math.min(0.05,clock.getDelta()),t=clock.elapsedTime;
  if(window._seatGlow){window._seatGlow.material.opacity=0.3+0.3*Math.abs(Math.sin(t*3));window._seatGlow.scale.setScalar(1+0.08*Math.sin(t*3));}
  if(window._beacon&&window._beacon.visible){window._beacon.position.y=2.9+Math.sin(t*2.2)*0.12;window._beacon.lookAt(camera.position.x,window._beacon.position.y,camera.position.z);}
  if(window._pillar&&window._pillar.visible){window._pillar.material.opacity=0.05+0.04*Math.abs(Math.sin(t*2.2));}
  if(window._chair){
    if(chairSpin){chairSpin.t+=dt;const k=Math.min(1,chairSpin.t/chairSpin.dur);const e=1-Math.pow(1-k,3);window._chair.rotation.y=chairSpin.spins*Math.PI*2*(1-e);if(k>=1){window._chair.rotation.y=0;chairSpin=null;}}
    else if(state===State.TUTORIAL){window._chair.rotation.y=Math.sin(t*0.6)*0.5;}
  }
  if(state===State.TUTORIAL){const d=camera.position.distanceTo(SEAT);const el=$('lhDist');if(el)el.textContent=Math.max(0,d).toFixed(1)+' m';}
  if(state===State.VICTORY){camera.position.y=1.6+Math.sin(t*1.4)*0.01;}
  monitors.forEach((m,i)=>{if(!wallActive)m.emissiveIntensity=0.4+0.12*Math.sin(t*2+i);});
  if(window._myScreenMode==='alert'){window._alertT=(window._alertT||0)+dt;drawMyScreen(window._alertT);}
  else if(window._myScreenMode==='desktop'||window._myScreenMode==='off'||window._myScreenMode==='secured'){drawMyScreen(t);}
  updateTween(dt); updateControls(dt);
  if(wallActive||state===State.GLITCH)drawWall(t);
  drawFX(dt);
  if(renderer) renderer.render(scene,camera);
}

const AudioSys = {
  ctx:null,
  init(){ if(!this.ctx) this.ctx=new (window.AudioContext||window.webkitAudioContext)(); },
  play(freq,type,dur,vol=0.1){ if(!this.ctx)return; const o=this.ctx.createOscillator();const g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,this.ctx.currentTime);g.gain.setValueAtTime(vol,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,this.ctx.currentTime+dur);o.connect(g);g.connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+dur);},
  shoot(){this.play(220,'square',0.1,0.1);this.play(100,'sawtooth',0.15,0.1);},
  kill(){this.play(800,'triangle',0.1);this.play(1200,'square',0.15);},
  hurt(){this.play(150,'sawtooth',0.3,0.2);},
  good(){this.play(600,'sine',0.1);this.play(800,'sine',0.15,0.05);},
  bad(){this.play(200,'sawtooth',0.2,0.15);},
  transition(){this.play(50,'sawtooth',1.5,0.2);this.play(400,'square',1.0,0.05);},
  win(){this.play(523,'sine',0.2,0.12);this.play(659,'sine',0.25,0.1);this.play(784,'sine',0.4,0.08);},
  laser(){this.play(800,'square',0.1,0.1);this.play(400,'triangle',0.2,0.1);}
};

const UI = {
  update(){
    if($('hud-score')) $('hud-score').textContent=GameState.score;
    if($('hud-phase-score')) $('hud-phase-score').textContent=(GameState.score - GameState.phaseStartScore);
    if($('health-fill')) $('health-fill').style.width=GameState.health+'%';
    if($('hud-mode')) $('hud-mode').textContent=GameState.mode.toUpperCase();
    if($('health-fill')) $('health-fill').style.background=GameState.health<34?'linear-gradient(90deg,#ff2d55,#ffb020)':'linear-gradient(90deg,#21f39a,#22e0ff)';
    if($('hud-health'))$('hud-health').style.display=(GameState.mode==='type')?'block':'none';
    if($('hud-combo-box'))$('hud-combo-box').style.display=(GameState.mode==='sort')?'block':'none';
    if($('hud-combo'))$('hud-combo').textContent='x'+Math.max(1,GameState.combo);
  },
  flash(){$('damage-flash').classList.add('flash');setTimeout(()=>$('damage-flash').classList.remove('flash'),100);},
  showBanner(text){const b=$('banner');b.textContent=text;b.classList.remove('show');void b.offsetWidth;b.classList.add('show');setTimeout(()=>b.classList.remove('show'),2000);}
};

const Traffic = {
  SAFE:["no-reply@ust.com","hr@ust.com","helpdesk@ust.com","noreply@microsoft.com","no-reply@workday.com","notifications@teams.microsoft.com","admin@office365.com","security@ust.com"],
  PHISH:["hr-support@ust-global.co","it.helpdesk@ustt-global.com","payroll@ust-gobal.com","admin@us-tglobal.com","security@ust-globa1.com","talent@macrosoft.com","no-reply@microsoft-support.com","service@0utlook.com","alerts@teams-microsoft.net","workday@workday-hr.info","ceo@ust.secure-mail.com","rewards@ust-benefits.online","login@office365-verify.com","support@lnfosys.com","noreply@amaz0n-rewards.com"],
  getRandom(){const isSafe=Math.random()>0.5;const arr=isSafe?this.SAFE:this.PHISH;return{text:arr[Math.floor(Math.random()*arr.length)],safe:isSafe};}
};

function launchGameplay(){
  stopStatic(); stopHum();
  window._introStopped=true;
  if(document.exitPointerLock)document.exitPointerLock();
  $('app').style.display='none';
  $('gameApp').classList.add('on');
  game.playerName = (isMultiplayer && currentPlayer === 2) ? player2Name : playerName;
  game.resize();
  game.start();
}