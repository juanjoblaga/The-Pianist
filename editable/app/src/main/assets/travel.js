(()=>{'use strict';
const W=1536,H=899,canvas=document.querySelector('#travelCanvas'),ctx=canvas.getContext('2d',{alpha:false});
const bg=document.createElement('canvas');bg.width=W;bg.height=H;const g=bg.getContext('2d',{alpha:false});
let mode='afternoon',weather='sunny';try{mode=localStorage.getItem('thepianist.travel.light.v1')||mode;weather=localStorage.getItem('thepianist.travel.weather.v1')||weather;}catch(_){}
const validModes=['sunrise','morning','afternoon','sunset','night'],validWeather=['sunny','cloudy','rainy','snowy'];
if(!validModes.includes(mode))mode='afternoon';if(!validWeather.includes(weather))weather='sunny';
const player={x:800,y:730,face:'down',walking:false,phase:0};let last=0,t=0,joyX=0,joyY=0,keys=new Set(),mapOpen=false,toastEnd=0;
const stage=document.querySelector('#stage');
const image=new Image();image.src='idle.png';const walk=new Image();walk.src='walk.png';
const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
const S=(x,y,w,h,color,line=1)=>{g.strokeStyle=color;g.lineWidth=line;g.strokeRect(x,y,w,h)};
const L=(x1,y1,x2,y2,c,w=1)=>{g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()};
const P=(points,c)=>{g.fillStyle=c;g.beginPath();g.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)g.lineTo(...points[i]);g.closePath();g.fill()};
const ell=(x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill()};
const text=(txt,x,y,size,color='#fff',bold=false)=>{g.fillStyle=color;g.font=(bold?'700 ':'')+size+'px system-ui,Segoe UI';g.fillText(txt,x,y)};
const grd=(y0,y1,colors)=>{const a=g.createLinearGradient(0,y0,0,y1);colors.forEach(([p,c])=>a.addColorStop(p,c));g.fillStyle=a;g.fillRect(0,y0,W,y1-y0)};
const rand=(n)=>{const v=Math.sin(n*118.23+94)*43113.333;return v-Math.floor(v)};
function paint(){
 grd(0,430,[[0,'#97b9d3'],[.55,'#d8d9bf'],[1,'#e8c6a6']]);
 // Low cloudbanks and soft Manchester light.
 for(let i=0;i<44;i++){let x=rand(i)*W,y=rand(i+70)*275;ell(x,y,65+rand(i+20)*115,12+rand(i+40)*24,'#e4e6dac2');}
 // Industrial mill and neighbouring terraces, with the tall brick chimney.
 R(0,178,620,270,'#513c38');R(8,188,605,255,'#965d48');
 P([[0,178],[0,156],[156,174],[325,161],[605,180],[620,188]],'#463b39');
 for(let i=0;i<3;i++)R(0,244+i*78,620,5,'#6b4134');
 for(let i=0;i<14;i++){
   const x=20+i*43;
   R(x,220,26,61,'#3c4f54');R(x+3,223,20,54,'#8aa8a8');
   for(let r=0;r<3;r++){const y=298+r*46;R(x,y,26,37,'#4d4b4c');R(x+3,y+3,20,30,'#7d9b9c');L(x+13,y+4,x+13,y+33,'#50484a',2);L(x+3,y+18,x+23,y+18,'#554d48',2);}
   R(x-6,208,38,4,'#b37d5b');
 }
 R(537,68,37,335,'#703c31');R(544,57,24,329,'#854434');R(537,67,37,13,'#59382d');
 for(let i=0;i<21;i++)L(538,87+i*15,571,87+i*15,'#a05c43',2);
 // Modern apartments further right.
 for(let b=0;b<4;b++){
  const x=780+b*174,y=195-(b%2)*36,w=174,h=256+(b%2)*36;
  R(x,y,w,h,'#52646c');R(x+6,y+5,w-12,h-12,'#7d898b');
  for(let r=0;r<6;r++)for(let col=0;col<4;col++){
   const xx=x+12+col*40,yy=y+14+r*38;
   R(xx,yy,32,27,'#b4c4be');R(xx+2,yy+2,28,23,(r+col+b)%3===0?'#dfd6bd':'#86a7af');
   L(xx,yy+14,xx+32,yy+14,'#607579',2);
  }
  for(let r=0;r<5;r++)L(x+6,y+r*39+35,x+w-7,y+r*39+35,'#495a61',4);
 }
 // Canal-side green belt; foliage includes depth and dappled color.
 grd(375,495,[[0,'#64805d'],[1,'#3c6d50']]);
 R(0,398,1536,60,'#557b58');
 for(let i=0;i<62;i++){
   const x=rand(i+40)*W,y=358+rand(i+55)*107,rad=14+rand(i+88)*29;
   ell(x,y,rad,rad*.9,rand(i+92)>.5?'#54774d':'#71916b');
   ell(x-8,y-4,rad*.65,rad*.5,'#8fa36c66');
 }
 // A sliver of the canal and white parapet behind the island platforms.
 P([[780,449],[1168,443],[1450,478],[1165,496]],'#53868a');
 for(let i=0;i<14;i++)L(785+i*40,452+i*.7,940+i*33,458+i*.8,'#c1c5b2',1);
 // Street across the mill and tracks, with rail-side fence.
 R(0,451,1536,31,'#8e9688');R(0,462,1536,7,'#bec0ab');
 // Rear platform and perspective track bed.
 P([[0,478],[1536,472],[1536,588],[0,611]],'#393f43');
 for(const y of [496,531,573]){L(0,y+9,1536,y-7,'#c1ac91',9);L(0,y+7,1536,y-9,'#61514b',3);}
 for(let i=0;i<62;i++){const x=i*26;L(x,488,x+2,598,'#675448',4)}
 // Footpath further-side platform with a slightly raised concrete kerb.
 P([[0,445],[1536,442],[1536,477],[0,485]],'#9a9f93');
 L(0,469,1536,460,'#dbc17b',3);
 // Foreground station island platform, tactile paving and yellow line.
 P([[0,591],[1536,568],[1536,899],[0,899]],'#bcaa8e');
 P([[0,589],[1536,565],[1536,581],[0,606]],'#ddd2b7');
 L(0,611,1536,585,'#d6ad52',5);
 for(let i=0;i<24;i++){
  const x=i*68;
  for(let yy=625;yy<658;yy+=15){for(let xx=x;xx<x+60;xx+=13){ell(xx+(yy%3),yy,2,1.7,'#928775')}}
 }
 // Warm limestone slabs with subtle seams and small texture.
 for(let yy=675;yy<930;yy+=84){L(0,yy,1536,yy-8,'#988c7a',2);for(let x=20;x<1600;x+=195)L(x+(Math.floor(yy/84)%2)*80,yy-3,x+(Math.floor(yy/84)%2)*80,yy+84,'#ab9a83',2)}
 for(let i=0;i<1450;i++){const x=rand(i+920)*W,y=610+rand(i+1490)*289;R(x,y,1.6,1.3,rand(i+240)>.5?'#eddbbe64':'#7b79634d')}
 // Black wrought-iron fencing at rear (real transparency through bars).
 R(0,446,1536,4,'#555c57');for(let x=7;x<1536;x+=28){R(x,411,3,41,'#53625d');ell(x+1,411,3,3,'#6c766a')}
 // Shelter: glass tinted panels, yellow dotted treatment, metal roof and benches.
 P([[916,363],[1374,361],[1416,382],[878,388]],'#516671');P([[902,354],[1361,353],[1403,370],[892,375]],'#9aa9a7');
 for(const x of [916,1033,1148,1259,1374]){R(x,379,9,195,'#637579');R(x+3,382,2,187,'#b6b9ad')}
 R(918,390,450,168,'#b8c9b25f');R(923,395,438,159,'#adbfb55a');
 for(let i=0;i<190;i++){
  const xx=920+rand(i*7)*449,yy=392+rand(i*13)*150;
  if((xx>1030&&xx<1100)||(xx>1250&&xx<1320))continue;
  ell(xx,yy,3.3,3.1,'#e4c64cbf');
 }
 for(const y of [391,565])R(914,y,466,5,'#596a6e');
 R(1090,500,220,11,'#536b72');for(let i=0;i<3;i++){R(1104+i*71,471,62,33,'#929e9b');S(1104+i*71,471,62,33,'#586b71',2)}
 R(1130,510,11,49,'#53616c');R(1270,510,11,49,'#53616c');
 // Electronic departure screen, no invented real-time departure estimates.
 R(1023,338,221,67,'#243441');R(1032,345,203,52,'#171b22');
 text('NEW ISLINGTON',1047,367,18,'#f8d289',true);text('Travel hub',1048,389,14,'#d3ab63');
 // Signed stopboard and yellow post.
 R(240,327,13,280,'#617477');R(249,327,6,280,'#b4b7ad');R(208,342,215,94,'#e9bd47');
 R(208,404,215,32,'#25364a');text('◆  Metrolink',226,375,21,'#24333e',true);text('New Islington',221,428,20,'#faf9f0',true);
 // A stand-alone map and ticket machine, clear interaction target.
 R(678,384,110,207,'#66747a');R(687,394,93,135,'#223d46');
 R(695,404,77,104,'#c0c7bd');R(709,415,47,78,'#d9e0d1');
 L(713,430,753,484,'#d3a055',6);L(746,417,724,491,'#87a0ad',5);
 text('MAP',712,408,13,'#273945',true);R(697,539,70,18,'#efc75b');text('TRAVEL',706,553,11,'#203441',true);
 // Ticket machine with bright small screen.
 R(1349,408,89,190,'#647379');R(1359,420,69,83,'#253b45');
 R(1367,428,51,46,'#92baba');R(1374,437,37,25,'#cce6d2');
 text('TICKETS',1359,405,13,'#283f4d',true);R(1375,520,40,7,'#182d37');
 // Tram: yellow front and grey cars on the far track; stands behind avatar.
 P([[30,473],[634,463],[677,479],[680,546],[52,558],[31,541]],'#333d42');
 R(46,473,528,72,'#93a4a3');R(44,473,75,77,'#f0bf39');
 for(let i=0;i<7;i++){const x=145+i*59;R(x,485,49,40,'#263a47');R(x+3,488,43,33,'#60747e');R(x+8,490,20,31,'#455964')}
 for(let i=0;i<7;i++)for(let j=0;j<3;j++){ell(141+i*58+j*14,534,3.3,3.3,'#eac749')}
 R(48,485,70,42,'#384951');R(53,489,58,26,'#8eabb1');
 R(61,531,42,6,'#e9d161');R(119,472,11,74,'#35454d');R(596,474,8,72,'#35454d');
 text('3045',78,549,11,'#252d34',true);
 // Traction wire suspended over the tracks and pole.
 R(884,226,8,253,'#8b9290');R(879,238,19,5,'#c1beb2');L(0,228,1536,218,'#606a69',2);
 L(400,0,760,228,'#666b65',2);L(720,0,1040,225,'#747c78',1);
 // Lamp posts and soft overhang lights.
 for(const x of [818,1456]){R(x,276,8,324,'#7e8584');R(x-18,278,43,8,'#8e958c');ell(x+3,288,18,8,'#efe2ae')}
 // Green pots and yellow platform handrails near the camera.
 for(const x of [75,1465]){
  R(x-18,758,105,55,'#66685b');R(x-10,760,89,46,'#79745c');
  for(let i=0;i<22;i++){
   const xx=x+rand(i+x)*75,yy=753-rand(i*3+x)*27;
   ell(xx,yy,5+rand(i*9)*8,11+rand(i*6)*8,rand(i*5)>.5?'#4d8050':'#768a51');
  }
  for(let i=0;i<12;i++){ell(x+rand(i+90)*79,741-rand(i*6)*23,2.6,3.5,'#dbbe65')}
 }
 // Soft ambient shadow under shelter and subtle roof shafts.
 g.fillStyle='#353e4640';g.fillRect(902,577,511,17);
 for(let i=0;i<12;i++){const x=rand(i+750)*1536,y=580+rand(i+730)*290;ell(x,y,6+rand(i+810)*11,1.3,'#675d504a')}
}
paint();
const currentTime=document.querySelector('#light'),weatherButton=document.querySelector('#weather');
function setMode(v){if(!validModes.includes(v))return;mode=v;try{localStorage.setItem('thepianist.travel.light.v1',v)}catch(_){ }document.querySelector('#timeMenu').hidden=true;currentTime.textContent=({sunrise:'◒',morning:'☼',afternoon:'☀',sunset:'◕',night:'☾'})[v]}
function setWeather(v){if(!validWeather.includes(v))return;weather=v;try{localStorage.setItem('thepianist.travel.weather.v1',v)}catch(_){ }document.querySelector('#weatherMenu').hidden=true;weatherButton.textContent=({sunny:'☀',cloudy:'☁',rainy:'☂',snowy:'❄'})[v]}
function openMap(){mapOpen=true;keys.clear();resetJoy();document.querySelector('#mapOverlay').hidden=false}
function closeMap(){mapOpen=false;document.querySelector('#mapOverlay').hidden=true}
const helpOverlay=document.querySelector('#helpOverlay');function closeHelp(){helpOverlay.hidden=true}
function goHome(){try{localStorage.setItem('thepianist.travel.spawnFromStop.v1','1')}catch(_){}window.location.assign('index.html')}
function notice(s){const el=document.querySelector('#toast');el.textContent=s;el.classList.add('show');toastEnd=t+2.1}
function interact(){if(!document.querySelector('#mapOverlay').hidden){closeMap();return}if(!helpOverlay.hidden){closeHelp();return}
 const nearMap=Math.hypot(player.x-732,player.y-604)<148;
 const nearStop=Math.hypot(player.x-278,player.y-625)<145;
 const nearTram=player.y<677&&player.x<677;
 const nearHome=player.x<295&&player.y>775;
 if(nearMap||nearStop||nearTram){openMap();return}if(nearHome){goHome();return}notice('Approach the travel map, sign or tram')}
function canWalk(x,y){return x>45&&x<1490&&y>610&&y<829&&!(x>660&&x<793&&y<596)&&!(x>1340&&x<1450&&y<615)}
function drawPlayer(){if(!image.complete||!image.naturalWidth){ctx.fillStyle='#2e2832';ctx.fillRect(player.x-20,player.y-58,40,58);return}
 const frame={down:0,left:1,right:2,up:3}[player.face]||0;
 ctx.imageSmoothingEnabled=false;
 if(player.walking&&walk.complete&&walk.naturalWidth){const idx=(Math.floor(t*8)%8);ctx.drawImage(walk,frame*80,idx*112,80,112,player.x-34,player.y-89,68,89)}
 else ctx.drawImage(image,frame*80,0,80,112,player.x-34,player.y-89,68,89);
 ctx.imageSmoothingEnabled=true;
}
function render(ts){const dt=Math.min(.045,(ts-last)/1000||.016);last=ts;t+=dt;
 let x=joyX,y=joyY;
 if(keys.has('ArrowLeft')||keys.has('a'))x--;
 if(keys.has('ArrowRight')||keys.has('d'))x++;
 if(keys.has('ArrowUp')||keys.has('w'))y--;
 if(keys.has('ArrowDown')||keys.has('s'))y++;
 if(mapOpen||!helpOverlay.hidden||!document.querySelector('#timeMenu').hidden||!document.querySelector('#weatherMenu').hidden){x=y=0}
 const mag=Math.hypot(x,y);player.walking=mag>.1;
 if(player.walking){x/=mag;y/=mag;const speed=210*dt*(keys.size?1:Math.min(1,mag*1.35));const nx=player.x+x*speed,ny=player.y+y*speed;
  if(canWalk(nx,player.y))player.x=nx;if(canWalk(player.x,ny))player.y=ny;
  player.face=Math.abs(x)>Math.abs(y)?(x<0?'left':'right'):(y<0?'up':'down');player.phase+=dt*9;}
 ctx.clearRect(0,0,W,H);ctx.drawImage(bg,0,0);
 if(mode==='night'){ctx.fillStyle='#101f37a1';ctx.fillRect(0,0,W,H);
  for(const [x,y] of [[380,396],[1115,377],[1443,274]]){const grd=ctx.createRadialGradient(x,y,0,x,y,120);grd.addColorStop(0,'#ffc97166');grd.addColorStop(1,'#ffc97100');ctx.fillStyle=grd;ctx.fillRect(x-120,y-120,240,240)}}
 else if(mode==='sunrise'||mode==='sunset'){ctx.fillStyle=mode==='sunset'?'#b6656233':'#e9ad6c38';ctx.fillRect(0,0,W,H)}
 else if(mode==='morning'){ctx.fillStyle='#d9e9dd1c';ctx.fillRect(0,0,W,H)}
 if(weather==='cloudy'){ctx.fillStyle='#889db13c';ctx.fillRect(0,0,W,H)}
 if(weather==='rainy'){ctx.fillStyle='#7c98ac43';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#d4e3f380';ctx.lineWidth=1;for(let i=0;i<110;i++){const px=(i*257+Math.floor(t*200))%W,py=(i*91+Math.floor(t*580))%H;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-6,py+18);ctx.stroke()}}
 if(weather==='snowy'){ctx.fillStyle='#dce9f18c';for(let i=0;i<90;i++){const px=(i*197+Math.floor(t*24))%W,py=(i*113+Math.floor(t*60))%H;ctx.fillRect(px,py,3,3)}}
 // Walking surface markers and animated destination indicator.
 ctx.save();ctx.strokeStyle='#f2d396a8';ctx.lineWidth=2;ctx.setLineDash([6,8]);ctx.beginPath();ctx.arc(733,592,56+Math.sin(t*2)*2,0,7);ctx.stroke();ctx.setLineDash([]);ctx.restore();
 drawPlayer();
 // Return-home exit marker at platform lower left, passable when approached.
 ctx.fillStyle='#202a39e0';ctx.fillRect(83,809,230,41);ctx.strokeStyle='#e9c77a';ctx.strokeRect(83,809,230,41);
 ctx.fillStyle='#ffe4a3';ctx.font='16px system-ui';ctx.fillText('⌂  WAY BACK HOME',99,835);
 if(t>toastEnd)document.querySelector('#toast').classList.remove('show');
 requestAnimationFrame(render)}
requestAnimationFrame(render);
function resetJoy(){joyX=joyY=0;document.querySelector('#stick').style.transform='translate(0,0)'}
const pad=document.querySelector('#joystick');let activePointer=null;
function updateJoy(ev){const box=pad.getBoundingClientRect(),cx=box.left+box.width/2,cy=box.top+box.height/2;const r=box.width*.35;const dx=ev.clientX-cx,dy=ev.clientY-cy,ratio=Math.max(1,Math.hypot(dx,dy)/r);joyX=dx/r/ratio;joyY=dy/r/ratio;document.querySelector('#stick').style.transform=`translate(${joyX*r}px,${joyY*r}px)`}
pad.addEventListener('pointerdown',e=>{activePointer=e.pointerId;pad.setPointerCapture(e.pointerId);updateJoy(e)});
pad.addEventListener('pointermove',e=>{if(activePointer===e.pointerId)updateJoy(e)});
pad.addEventListener('pointerup',e=>{if(activePointer===e.pointerId){activePointer=null;resetJoy()}});
pad.addEventListener('pointercancel',()=>{activePointer=null;resetJoy()});
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='Escape'){closeMap();closeHelp();return}if(e.key===' '||e.key==='Enter'){interact();return}keys.add(e.key.length===1?e.key.toLowerCase():e.key)});
window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));
window.addEventListener('blur',()=>{keys.clear();resetJoy()});
document.querySelector('#action').addEventListener('click',interact);
document.querySelector('#travelButton').addEventListener('click',openMap);
document.querySelector('#closeMap').addEventListener('click',closeMap);
document.querySelector('#mapOverlay').addEventListener('pointerdown',e=>{if(e.target===e.currentTarget)closeMap()});
document.querySelector('#returnHome').addEventListener('click',goHome);
document.querySelector('#travelStop').addEventListener('click',closeMap);
document.querySelector('#help').addEventListener('click',()=>{helpOverlay.hidden=false;keys.clear();resetJoy()});
document.querySelector('#closeHelp').addEventListener('click',closeHelp);
document.querySelector('#dismissHelp').addEventListener('click',closeHelp);
document.querySelector('#light').addEventListener('click',()=>{let t=document.querySelector('#timeMenu');t.hidden=!t.hidden;document.querySelector('#weatherMenu').hidden=true});
document.querySelector('#weather').addEventListener('click',()=>{let t=document.querySelector('#weatherMenu');t.hidden=!t.hidden;document.querySelector('#timeMenu').hidden=true});
for(const button of document.querySelectorAll('[data-time]'))button.addEventListener('click',()=>setMode(button.dataset.time));
for(const button of document.querySelectorAll('[data-weather]'))button.addEventListener('click',()=>setWeather(button.dataset.weather));
setMode(mode);setWeather(weather);
if(new URLSearchParams(location.search).has('qa'))window.__travelTest={getPlayer:()=>({...player}),setPlayer:(x,y)=>{player.x=x;player.y=y},canWalk,interact,openMap,closeMap,getState:()=>({mode,weather,mapOpen,helpOpen:!helpOverlay.hidden})};
})();