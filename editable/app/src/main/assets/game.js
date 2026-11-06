(()=>{'use strict';
// The Pianist v0.5.0 — approved dialogue, portraits, shower, mirror, elevated city environment.
const W=1536,H=899,canvas=document.querySelector('#game'),ctx=canvas.getContext('2d',{alpha:false});
canvas.width=W;canvas.height=H;ctx.imageSmoothingEnabled=true;
// Keep only one fully decoded time-of-day scene in memory. A second scene is
// temporarily retained during a requested transition, then released.
const files=Object.create(null);
const art=window.ThePianistAssets;
const modes=art.modes,modePrefixes=art.modeLayers,persistentAssets=art.persistentAssets;
const spriteFile=art.sprites;
const assetPromises=Object.create(null);
const imageExtension=n=>n.startsWith('world_')||n.startsWith('light_')?'jpg':'png';
function ensureAsset(name){
 if(files[name]&&files[name].complete&&files[name].naturalWidth)return Promise.resolve(files[name]);
 if(assetPromises[name])return assetPromises[name];
 const img=new Image(); img.decoding='async'; files[name]=img;
 const promise=new Promise((resolve,reject)=>{
  img.onload=()=>resolve(img);
  img.onerror=()=>reject(new Error('Missing game artwork: '+name));
  img.src=name+'.'+imageExtension(name);
 });
 assetPromises[name]=promise;
 // Permit retry after a failure, and avoid an unhandled rejection in Android WebView.
 promise.catch(err=>{delete assetPromises[name];delete files[name];
  const el=document.querySelector('#loadStatus');if(el){el.textContent='Could not load '+name+'. Tap to retry.';el.hidden=false;}
  console.error(err);
 });
 return promise;
}
function ensureMode(mode){return Promise.all(modePrefixes.map(p=>ensureAsset(p+'_'+mode)));}
function discardMode(mode){if(!mode||mode===lightMode)return;
 for(const prefix of modePrefixes){const key=prefix+'_'+mode;
  if(files[key]){files[key].onload=null;files[key].onerror=null;delete files[key]};delete assetPromises[key];}
}
let modeToken=0,ready=false,failedStartup=false;
Promise.all([...persistentAssets.map(ensureAsset),ensureMode('afternoon')]).then(()=>{
 ready=true;document.querySelector('#loadStatus')?.remove();
}).catch(e=>{failedStartup=true;console.error('Game startup:',e)});
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const player={x:730,y:570,dir:'down',moving:false,phase:0,pose:null,transition:null};
const keyState=new Set();let joy={x:0,y:0},last=0,time=0,cameraY=0,stormFlash=0,stormNext=18,toastTimer;
player.speed=0;
let lightMode='afternoon',lastLight='afternoon',lightAmount=1;
let weather='sunny',lastWeather='sunny',weatherBlend=1;
let balconyOpening=0;let gamePaused=false;let soundWanted=false;
const weatherModes=['sunny','cloudy','foggy','rainy','snowy','storm','windy'];
const modeLabels={sunrise:'Sunrise',morning:'Morning',afternoon:'Afternoon',sunset:'Sunset',night:'Night'};
const weatherLabels={sunny:'Sunny',cloudy:'Cloudy',foggy:'Foggy',rainy:'Rainy',snowy:'Snowy',storm:'Storm',windy:'Windy'};
const lighting=$('#lighting'),lightMenu=$('#lightmenu'),weatherButton=$('#weather'),weatherMenu=$('#weathermenu');
const dialogue=$('#dialogue'),dlgText=$('#dialoguetext'),choicePanel=$('#dialoguechoices');
let dialogueFull='',dialogueStart=0,dialogueDuration=0,activeOptions=[];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const ease=x=>x*x*(3-2*x);
function setLighting(mode){
 if(!modes.includes(mode)||mode===lightMode)return;
 const request=++modeToken;
 lightMenu.hidden=true;weatherMenu.hidden=true;
 ensureMode(mode).then(()=>{
  if(request!==modeToken){discardMode(mode);return;}
  // A quick new selection never holds on to the earlier three scene palettes.
  if(lastLight!==lightMode)discardMode(lastLight);
  lastLight=lightMode;lightMode=mode;lightAmount=0;
  lighting.textContent=({sunrise:'◒',morning:'☼',afternoon:'☀',sunset:'◕',night:'☾'})[mode];
  $$('[data-light]').forEach(b=>b.classList.toggle('selected',b.dataset.light===mode));
 }).catch(()=>notice('Unable to load '+mode+' lighting'));
}
function setWeather(mode){if(!weatherModes.includes(mode))return;lastWeather=weather;weather=mode;weatherBlend=0;weatherMenu.hidden=true;lightMenu.hidden=true;weatherButton.textContent=({sunny:'☀',cloudy:'☁',foggy:'≋',rainy:'☂',snowy:'❄',storm:'ϟ',windy:'〰'})[mode];$$('[data-weather]').forEach(b=>b.classList.toggle('selected',b.dataset.weather===mode));}
lighting.addEventListener('click',()=>{lightMenu.hidden=!lightMenu.hidden;weatherMenu.hidden=true});
weatherButton.addEventListener('click',()=>{weatherMenu.hidden=!weatherMenu.hidden;lightMenu.hidden=true});
$$('[data-light]').forEach(b=>b.addEventListener('click',()=>setLighting(b.dataset.light)));
$$('[data-weather]').forEach(b=>b.addEventListener('click',()=>setWeather(b.dataset.weather)));
function notice(s){const t=$('#toast');t.textContent=s;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1400)}
// User-authored dialogue. Preserve every letter, punctuation mark, and approved portrait.
const {dialogueScript,rooms,solids,objects,furniture}=window.ThePianistConfig;
const portraitEl=$('#dialogueportrait');
function showDialogue(id,options=[]){
 resetJoystick();
 const entry=dialogueScript[id];
 if(!entry){console.warn('No written dialogue for',id);return;}
 activeOptions=options;dialogueFull=entry.text;dialogueDuration=dialogueFull.length*23;
 dialogueStart=performance.now();dlgText.textContent='';choicePanel.replaceChildren();
 portraitEl.src=entry.portrait;portraitEl.alt='The Pianist — '+id;
 for(const opt of options){
  const b=document.createElement('button');b.type='button';b.textContent=opt.label;
  if(opt.disabled){b.disabled=true;b.title='This destination is not available yet';}
  else b.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();hideDialogue();opt.action()});
  choicePanel.appendChild(b);
 }
 dialogue.hidden=false;
}
function hideDialogue(){dialogue.hidden=true;activeOptions=[]}
dialogue.addEventListener('pointerdown',e=>{
 if(e.target.closest('button'))return;e.preventDefault();
 if(dlgText.textContent!==dialogueFull){dlgText.textContent=dialogueFull;return}
 if(activeOptions.length===0)hideDialogue();
});
// Navigable geometry: a 9-pixel foot-radius permits slim clearance beside furniture.
// Full sprite is VISUAL, only the foot position is solid. Zones connect through actual doors.
// Collision regions re-aligned to the actual visible floor and wall footprint.
// rooms is defined in game-config.js.
// solids is defined in game-config.js.
// Feet anchored to floor; narrow enough to approach walls, never walk on walls.
const physics=window.ThePianistPhysics.create(window.ThePianistConfig,9);
const passable=physics.passable;
const nearest=()=>physics.nearest(player.x,player.y,player.dir);
function changePose(id,type){if(id==='sofa'&&type==='lie')return;const data=furniture[id]?.[type];if(!data)return;const fromX=player.x,fromY=player.y;const approach=data.exit;
 // Reach condition enforced by nearest(); move towards a nearby safe approach point.
 player.transition={kind:'enter',id,type,t:0,fromX,fromY,toX:data.x,toY:data.y,exit:approach,face:data.face};
 player.moving=false;player.phase=0;resetJoystick();}
function safeExit(target){return physics.safeExit(target,{x:730,y:570});}
function stand(){const old=player.pose;if(!old)return;
 const exit=safeExit(old.exit);
 player.transition={kind:'leave',id:old.id,type:old.type,t:0,fromX:player.x,fromY:player.y,toX:exit.x,toY:exit.y,exit,face:old.face};player.pose=null}

let showerSeconds=0;
function interact(){
 if(!dialogue.hidden){
  if(dlgText.textContent!==dialogueFull)dlgText.textContent=dialogueFull;
  else if(!activeOptions.length)hideDialogue();return;
 }
 if(player.transition)return;
 if(player.pose){if(player.pose.id==='shower')return;stand();return}
 const obj=nearest();if(!obj){notice('Move closer and face an object');return}
 const id=obj.id==='balchair'?'balcony':obj.id==='kitchen2'?'kitchen':obj.id;
 if(id==='frontdoor'){
  showDialogue('frontdoor',[{label:'Leave (coming later)',disabled:true},{label:'Stay',action:()=>{}}]);return;
 }
 if(id==='piano'){
  showDialogue('piano',[{label:'Play',action:()=>changePose('piano','sit')},{label:'Leave',action:()=>{}}]);return;
 }
 if(id==='sofa'){
  showDialogue('sofa',[{label:'Sit',action:()=>changePose('sofa','sit')},{label:'Leave',action:()=>{}}]);return;
 }
 if(id==='bed'){
  showDialogue('bed',[{label:'Lie down',action:()=>changePose('bed','lie')},
   {label:'Sit',action:()=>changePose('bed','sit')},{label:'Leave',action:()=>{}}]);return;
 }
 if(id==='shower'){
  showDialogue('shower',[{label:'Take shower',action:()=>{showerSeconds=0;changePose('shower','shower')}},
   {label:'Leave',action:()=>{}}]);return;
 }
 if(id==='beanbag'){
  showDialogue('beanbag',[{label:'Sit',action:()=>changePose('beanbag','sit')},{label:'Leave',action:()=>{}}]);return;
 }
 if(id==='balcony'){
  showDialogue('balcony',obj.id==='balchair'?[{label:'Sit',action:()=>changePose('balchair','sit')},
   {label:'Look outside',action:()=>{player.dir='up'}},{label:'Leave',action:()=>{}}]:
   [{label:'Look outside',action:()=>{player.dir='up'}},{label:'Leave',action:()=>{}}]);return;
 }
 showDialogue(id);
}
// Small variations only when crossing doors; visible door panels hinge/swing with easing.
// The static bedroom, bathroom and entrance doors belong to the approved art.
// Do not paint a second swinging door OVER their already-painted leaves.
// The balcony slider is a separate, physical opening with no duplicated base leaf.
function drawBalconyDoor(){
 // Fit the sliding panel inside the EXISTING painted glass track.
 // The old 89×68 threshold graphic projected as a floating opaque box above
 // the sofa; remove it rather than invent a second balcony/background layer.
 const dx=balconyOpening*56;
 ctx.save();
 ctx.globalAlpha=.78;
 ctx.fillStyle='rgba(116,169,172,.16)';
 ctx.fillRect(586+dx,164,55,34);
 ctx.strokeStyle='#c4d6cf';ctx.lineWidth=2.3;
 ctx.strokeRect(586+dx,162,55,37);
 ctx.strokeStyle='rgba(45,71,74,.55)';ctx.lineWidth=1;
 ctx.beginPath();ctx.moveTo(587+dx,191);ctx.lineTo(640+dx,191);ctx.stroke();
 ctx.fillStyle='rgba(240,231,204,.74)';ctx.fillRect(590+dx,179,2,7);
 ctx.restore();
}
let bedroomDoorAngle=0,frontDoorMotion=0,bathDoorMotion=0;
function drawPhysicalDoors(){
 const front=files['frontdoor_'+lightMode],bath=files['bathdoor_'+lightMode];
 // Rotations around physically correct hinges; source door artwork was removed from base plate.
 if(front?.complete&&front.naturalWidth){ctx.save();ctx.translate(719,811);
  ctx.rotate(-.28*ease(frontDoorMotion));ctx.drawImage(front,704-719,801-811);ctx.restore();}
 if(bath?.complete&&bath.naturalWidth){ctx.save();ctx.translate(984,739);
  ctx.rotate(-.55*ease(bathDoorMotion));ctx.drawImage(bath,978-984,733-739);ctx.restore();}
 // Bedroom entrance uses the painted architecture; no duplicated swinging leaf.
}
function updateDoors(dt){
 const bedroomNear=Math.hypot(player.x-922,player.y-554)<115;
 const frontNear=Math.hypot(player.x-755,player.y-884)<126;
 const bathNear=Math.hypot(player.x-994,player.y-790)<104;
 frontDoorMotion+=(Number(frontNear)-frontDoorMotion)*Math.min(1,dt*3.3);
 bathDoorMotion+=(Number(bathNear)-bathDoorMotion)*Math.min(1,dt*3.3);
 bedroomDoorAngle+=(Number(bedroomNear)-bedroomDoorAngle)*Math.min(1,dt*4.5);
 const near=Math.abs(player.x-614)<115&&Math.abs(player.y-206)<112;
 const target=near?1:0;
 balconyOpening+=(target-balconyOpening)*Math.min(1,dt*5.5);
}
// Stable deterministic particle seeds: arrays are tiny and reuse the same objects.
const rng=(n)=>{let v=Math.sin(n*111.371+23.77)*43758.5453;return v-Math.floor(v)};
const particles=Array.from({length:135},(_,i)=>({x:rng(i*6+1),y:rng(i*6+2),speed:.5+rng(i*6+3)*1.35,size:.9+rng(i*6+4)*1.6,seed:rng(i*6+5)*9}));
const dust=Array.from({length:20},(_,i)=>({x:340+rng(i+1)*455,y:260+rng(i+31)*375,phase:rng(i+92)*6.28}));
// Audio policy: no active WebAudio context in the background, even on Android WebView.
let ambientOn=false,audioContext=null,audioNode=null,audioFilter=null;
const soundButton=$('#sound');
function syncSoundUI(){soundButton.textContent=ambientOn?'Sound ON':'Sound OFF';soundButton.setAttribute('aria-pressed',String(ambientOn));}
function isForeground(){return !gamePaused&&!document.hidden&&document.visibilityState!=='hidden';}
function audioSuspend(){if(audioNode&&audioContext)audioNode.gain.setTargetAtTime(0,audioContext.currentTime,.05);if(audioContext&&audioContext.state==='running')audioContext.suspend().catch(()=>{});}
function audioResume(){if(audioContext&&ambientOn&&isForeground()&&audioContext.state!=='running')audioContext.resume().catch(()=>{});}
function toggleSound(){ambientOn=!ambientOn;try{localStorage.setItem('thepianist.sound.v1',ambientOn?'1':'0')}catch(_){}
 syncSoundUI();if(!ambientOn){audioSuspend();return}
 try{if(!audioContext){audioContext=new (window.AudioContext||window.webkitAudioContext)();
   const count=audioContext.sampleRate*3,buf=audioContext.createBuffer(1,count,audioContext.sampleRate),a=buf.getChannelData(0);
   let prev=0;for(let i=0;i<count;i++){const n=(Math.random()*2-1);prev=.972*prev+.028*n;a[i]=prev*2.4}
   const src=audioContext.createBufferSource();src.buffer=buf;src.loop=true;
   audioFilter=audioContext.createBiquadFilter();audioFilter.type='lowpass';audioFilter.frequency.value=670;
   audioNode=audioContext.createGain();audioNode.gain.value=0;
   src.connect(audioFilter).connect(audioNode).connect(audioContext.destination);src.start()}
 audioResume();}catch(e){ambientOn=false;syncSoundUI();notice('Audio unavailable')}
}
soundButton.addEventListener('click',toggleSound);
function updateAmbient(){if(!audioNode||!audioContext)return;
 if(!ambientOn||!isForeground()){if(audioContext.state==='running')audioNode.gain.setTargetAtTime(0,audioContext.currentTime,.08);return;}
 if(audioFilter)audioFilter.frequency.setTargetAtTime(weather==='storm'?1100:weather==='rainy'?800:weather==='windy'?340:450,audioContext.currentTime,.2);
 const gain=weather==='rainy'?.105:weather==='storm'?.135:weather==='windy'?.055:0;
 if(audioContext.state==='running')audioNode.gain.setTargetAtTime(gain,audioContext.currentTime,.25);
}
function enterBackground(){gamePaused=true;resetJoystick();keyState.clear();audioSuspend();}
function enterForeground(){gamePaused=false;last=performance.now();audioResume();}
window.__pianistPause=enterBackground;window.__pianistResume=enterForeground;
document.addEventListener('visibilitychange',()=>document.hidden?enterBackground():enterForeground());
window.addEventListener('pagehide',enterBackground);window.addEventListener('pageshow',enterForeground);
try{const savedAudio=localStorage.getItem('thepianist.sound.v1');ambientOn=savedAudio===null?true:savedAudio==='1'}catch(_){ambientOn=true}
// Resume a saved ON preference at the first game gesture (browser autoplay policy).
window.addEventListener('pointerdown',e=>{
 if(ambientOn&&!audioContext&&!e.target.closest('#sound')){
  ambientOn=false;toggleSound();
 }
},{capture:true});
syncSoundUI();
// All drawing happens in WORLD coordinates, translated by the vertical look-up camera.
function drawWorldImage(img,opacity=1){if(!img.complete||!img.naturalWidth)return;ctx.save();ctx.globalAlpha=opacity;ctx.drawImage(img,0,0,W,H);ctx.restore()}
// A single 1536 × 1604 world painting. All windows/terrace/outside reveal THIS plate.
// No duplicated balcony backdrop, no repeated top strip, no geometric garden assets.
function drawWorldPlane(img,opacity=1){
 if(!img?.complete||!img.naturalWidth)return;
 ctx.save();ctx.globalAlpha=opacity;
 ctx.drawImage(img,0,-380,W,1604);
 ctx.restore();
}
function drawCourtyard(){
 const a=files['world_'+lastLight],b=files['world_'+lightMode];
 if(lightAmount<1&&lastLight!==lightMode){drawWorldPlane(a);drawWorldPlane(b,ease(lightAmount));}
 else drawWorldPlane(b);
 drawAnimatedTrees();
}

function drawAnimatedTrees(){
 // The painterly courtyard tree crowns never move as rigid circles. Tiny individual leaves only.
 const strength=weather==='windy'?1.8:weather==='storm'?2.3:weather==='rainy'?.6:.13;
 const crowns=[[170,-110],[360,-210],[1328,-138],[197,370],[1344,458],[205,780],[1340,800]];
 ctx.save();
 for(let i=0;i<crowns.length;i++){
  const [cx,cy]=crowns[i];
  for(let n=0;n<4;n++){
   const t=time*(.6+.11*n)+i*3.1+n*2;
   const x=cx+Math.sin(t)*strength*(1+n)+Math.sin(i+n*8.2)*17;
   const y=cy+Math.cos(t*.7)*strength*1.5+Math.cos(i+n*4.3)*13;
   ctx.fillStyle=(i+n)%3===0?'rgba(210,191,84,.65)':'rgba(112,150,65,.68)';
   ctx.beginPath();ctx.ellipse(x,y,1.7,2.7,.3*Math.sin(t),0,Math.PI*2);ctx.fill();
  }
 }
 ctx.restore();
}

function drawFallingLeaves(){
 if(weather!=='windy'&&weather!=='storm')return;
 ctx.save();ctx.beginPath();ctx.rect(0,-380,W,510);
 ctx.rect(0,130,236,920);ctx.rect(1398,130,138,920);ctx.clip();
 for(let i=0;i<36;i++){
  const side=i%3,originX=side===0?170:side===1?1430:350+i*19;
  const wave=Math.sin(time*(.5+i%5*.08)+i*7)*11;
  const x=originX+wave+(time*12+i*29)%115;
  const y=((i*179+time*(10+i%3*5))%1370)-370;
  ctx.fillStyle=i%4===0?'rgba(163,186,112,.74)':'rgba(98,134,86,.58)';
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(time+i)*.27);
  ctx.fillRect(-2,-1,4,2);ctx.restore();
 }
 ctx.restore();
}
// The window opens directly onto the SAME world plane as the balcony and both sides.
// No drawImage(world, unrelatedSourceRect, windowDestRect) calls: doing that created
// the detached-looking courtyard in older versions.
const windowFrame={x:980,y:129,w:344,h:48};
function drawBedroomWindow(){
 const {x,y,w,h}=windowFrame;
 ctx.save();
 // Recess, glass, frame and two vertical mullions all exist in the wall's geometry.
 ctx.strokeStyle='#302e2e';ctx.lineWidth=10;ctx.strokeRect(x-1,y-1,w+2,h+6);
 // The courtyard beneath is already visible through the window opening.
 ctx.fillStyle='rgba(120,173,174,.15)';ctx.fillRect(x+4,y+3,w-8,h-8);
 const morning=lightMode==='sunrise'||lightMode==='morning';
 ctx.fillStyle=morning?'rgba(255,224,173,.10)':'rgba(197,224,219,.07)';
 ctx.fillRect(x+5,y+4,w-10,h-10);
 ctx.strokeStyle='#e2d2b9';ctx.lineWidth=5;ctx.strokeRect(x+2.5,y+2.5,w-5,h-5);
 ctx.strokeStyle='#6b766d';ctx.lineWidth=2;ctx.strokeRect(x+6,y+6,w-12,h-12);
 ctx.fillStyle='#d9cbb4';ctx.fillRect(x+w*.47-3,y+5,6,h-10);
 ctx.fillStyle='#c8bda8';ctx.fillRect(x-6,y+h-2,w+12,8); // interior sill
 ctx.fillStyle='rgba(255,255,255,.16)';
 ctx.fillRect(x+10,y+9,w*.25,2);
 ctx.restore();
}
function drawFourthFloorFacade(){
 // Short, solid cutaway façade below this fourth-floor slab. No ground-level scene
 // or geometry from a different apartment is revealed beneath the entrance.
 ctx.save();ctx.beginPath();ctx.rect(111,840,596,H-840);ctx.rect(854,840,548,H-840);ctx.clip();
 ctx.fillStyle='#5f514c';ctx.fillRect(111,840,1290,H-840);
 const g=ctx.createLinearGradient(0,840,0,H);g.addColorStop(0,'rgba(182,151,124,.28)');
 g.addColorStop(1,'rgba(23,25,32,.13)');ctx.fillStyle=g;ctx.fillRect(111,840,1290,H-840);
 ctx.strokeStyle='rgba(34,32,34,.23)';ctx.lineWidth=2;
 for(let y=852;y<H;y+=27){ctx.beginPath();ctx.moveTo(111,y);ctx.lineTo(1401,y);ctx.stroke();
  const offset=(Math.floor(y/27)%2)*43;
  for(let x=111+offset;x<1401;x+=125){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+27);ctx.stroke();}}
 ctx.restore();
}
function drawBathroomMirror(){
 // Small bevelled mirror on the bathroom's north wall, above its existing sink.
 // Drawn in game coordinates on top of the approved floor plate.
 ctx.save();ctx.translate(0,-83);
 ctx.fillStyle='#463d3a';ctx.fillRect(1096,650,78,35);
 ctx.fillStyle='#b58e66';ctx.fillRect(1100,653,70,29);
 ctx.fillStyle='#b1c7c6';ctx.fillRect(1104,657,62,21);
 const glass=ctx.createLinearGradient(1104,657,1166,678);
 glass.addColorStop(0,'rgba(219,239,231,.81)');glass.addColorStop(.57,'rgba(109,153,161,.9)');glass.addColorStop(1,'rgba(184,212,206,.79)');
 ctx.fillStyle=glass;ctx.fillRect(1105,658,60,19);
 ctx.fillStyle='rgba(255,255,255,.33)';ctx.beginPath();ctx.moveTo(1108,660);
 ctx.lineTo(1130,660);ctx.lineTo(1119,675);ctx.lineTo(1108,675);ctx.fill();
 ctx.fillStyle='rgba(69,76,75,.52)';ctx.fillRect(1135,660,2,15);
 ctx.strokeStyle='rgba(242,214,162,.47)';ctx.strokeRect(1102,655,66,25);
 ctx.restore();
}
function drawBase(){
 const a=files['light_'+lastLight],b=files['light_'+lightMode];
 ctx.save();
 // This clip removes only the EXTERIOR background from the source image: every
 // original wall, floor, bed, piano and furnishing stays within the same coordinates.
 ctx.beginPath();
 ctx.moveTo(197,16);ctx.lineTo(860,16);ctx.lineTo(860,123);
 ctx.lineTo(1401,123);ctx.lineTo(1401,967);ctx.lineTo(853,967);
 ctx.lineTo(853,1023);ctx.lineTo(708,1023);ctx.lineTo(708,967);
 ctx.lineTo(111,967);ctx.lineTo(111,149);ctx.lineTo(197,149);
 ctx.closePath();
 // The old isolated balcony view had a thick nearly-black slab above its rear rail.
 // Reveal the same courtyard plate behind it; preserve both end posts and the railing below.
 ctx.moveTo(235,16);ctx.lineTo(829,16);ctx.lineTo(829,43);ctx.lineTo(235,43);ctx.closePath();
 // A subtracted bedroom window rather than painted scenery over a solid wall.
 const {x:wx,y:wy,w:ww,h:wh}=windowFrame;
 ctx.moveTo(wx,wy);ctx.lineTo(wx,wy+wh);ctx.lineTo(wx+ww,wy+wh);
 ctx.lineTo(wx+ww,wy);ctx.closePath();ctx.clip('evenodd');
 if(lightAmount<1&&lastLight!==lightMode){drawWorldImage(a);drawWorldImage(b,ease(lightAmount))}
 else drawWorldImage(b);
 ctx.restore();
}
// Time-dependent indoor illumination. Day plates have unlit sources;
// night plate retains lamps; localized glows are additive with nearby furniture.
function glow(x,y,r,alpha,color='255,195,114'){
 const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${color},${alpha})`);g.addColorStop(.3,`rgba(${color},${alpha*.42})`);g.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)
}
function timeLight(){
 // No full-screen colour filter. The five separately painted base scenes already
 // determine wall, flooring and furniture colours. Only physical lamp glows vary.
 const night=lightMode==='night'?ease(lightAmount):lastLight==='night'?1-ease(lightAmount):0;
 if(night<=0)return;
 ctx.save();ctx.globalCompositeOperation='screen';
 glow(307,277,150,.21*night);glow(850,353,110,.16*night);glow(1247,254,118,.19*night);
 for(const [x,y] of [[332,66],[407,51],[480,78],[555,70],[611,95],[670,81],[786,62]])
   glow(x,y,19,(.17+.045*Math.sin(time*1.25+x))*night);
 ctx.restore();
}
function outdoorTint(){
 const cloud=weather==='cloudy'?.08:weather==='foggy'?.13:weather==='rainy'?.10:weather==='storm'?.19:weather==='snowy'?.05:0;
 if(!cloud)return;
 ctx.fillStyle=`rgba(39,64,78,${cloud})`;
 ctx.fillRect(0,-380,W,380);
}
function drawWeather(){
 const rain=weather==='rainy'||weather==='storm',snow=weather==='snowy',wind=weather==='windy'||weather==='storm';
 if(!rain&&!snow&&!wind&&weather!=='foggy')return;
 ctx.save();
 ctx.beginPath();
 ctx.rect(0,-380,W,1404);
 // The enclosed apartment is subtracted from the world, rather than leaving dry
 // rectangles in the courtyard or letting rain through bedroom/bathroom corners.
 ctx.moveTo(111,149);ctx.lineTo(197,149);ctx.lineTo(197,186);
 ctx.lineTo(860,186);ctx.lineTo(860,123);ctx.lineTo(1401,123);
 ctx.lineTo(1401,967);ctx.lineTo(853,967);ctx.lineTo(853,1023);
 ctx.lineTo(708,1023);ctx.lineTo(708,967);ctx.lineTo(111,967);ctx.closePath();
 // The glazing still shows the actual outdoor precipitation behind its glass.
 ctx.rect(985,133,335,41);
 ctx.clip('evenodd');
 if(weather==='foggy'){
   ctx.fillStyle='rgba(194,206,207,.14)';ctx.fillRect(0,-380,W,1404);
 }
 const count=snow?215:rain?370:88;
 for(let i=0;i<count;i++){
  const pt=particles[i%particles.length];
  const fall=snow?34+pt.speed*22:rain?235+pt.speed*105:83+pt.speed*31;
  const yy=((pt.y*1404+i*41+time*fall)%1404)-380;
  const xx=((pt.x*1536+i*67+time*(wind?51:rain?-31:25))%1536+1536)%1536;
  if(snow){
   ctx.fillStyle=`rgba(248,250,255,${.42+.30*rng(i+6)})`;
   ctx.beginPath();ctx.arc(xx+Math.sin(time+i)*3,yy,pt.size,0,6.283);ctx.fill();
  }else if(rain){
   ctx.strokeStyle=weather==='storm'?'rgba(190,222,239,.68)':'rgba(167,209,233,.64)';
   ctx.lineWidth=i%4===0?1.75:1.15;ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx-(weather==='storm'?10:5),yy+(weather==='storm'?20:14));ctx.stroke();
  }else{ctx.fillStyle='rgba(175,194,171,.30)';ctx.fillRect(xx,yy,8,1.5)}
 }
 ctx.restore();
 if(rain){
  ctx.save();ctx.fillStyle='rgba(45,73,87,.12)';ctx.fillRect(240,111,581,61);
  for(let i=0;i<38;i++){
   const xx=246+rng(i*7+20)*566,yy=110+rng(i*5+8)*61;
   const life=(time*3+rng(i+32))%1;
   ctx.strokeStyle=`rgba(181,213,226,${.25*(1-life)})`;
   ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(xx,yy,2+life*5,.7+life*2,0,0,6.283);ctx.stroke();
  }ctx.restore();
  ctx.save();ctx.beginPath();ctx.rect(239,177,590,40);ctx.rect(987,135,330,38);ctx.clip();
  for(let i=0;i<35;i++){
   const px=(i<22?242+rng(i*19+6)*581:982+rng(i*11+2)*340);
   const py=(i<22?179:133)+((time*(18+rng(i*7)*23)+i*13)%(i<22?45:33));
   ctx.strokeStyle='rgba(212,232,240,.37)';ctx.lineWidth=1.1;
   ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-1,py+5);ctx.stroke();
  }ctx.restore();
 }
 if(snow){ctx.save();ctx.strokeStyle='rgba(234,240,244,.70)';ctx.lineWidth=2.3;ctx.beginPath();ctx.moveTo(239,177);ctx.lineTo(827,177);ctx.stroke();ctx.restore()}
}
function animatedPlants(){const windy=weather==='windy'||weather==='storm'?1:weather==='rainy'?.35:.11;
 ctx.save();for(const [x,y,len] of [[268,112,21],[217,260,15],[831,265,11],[1347,570,14]]){
   const sway=Math.sin(time*(windy?2.4:1.1)+x)*windy*3;ctx.strokeStyle='rgba(72,113,64,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+len);ctx.quadraticCurveTo(x+sway-5,y+3,x+sway,y);ctx.stroke();ctx.fillStyle='#698250';ctx.beginPath();ctx.ellipse(x+sway,y-1,7,3,sway*.02,0,6.28);ctx.fill()
 }ctx.restore();}
function ambientDust(){if(lightMode==='night'||weather==='storm'||weather==='rainy')return;ctx.save();for(const d of dust){const drift=Math.sin(time*.42+d.phase)*14;ctx.globalAlpha=.17+.12*Math.sin(time*.7+d.phase);ctx.fillStyle='#fff7d0';ctx.fillRect(d.x+drift,d.y+Math.cos(time*.37+d.phase)*5,2,2)}ctx.restore()}
// Diagonal atlas is separately prepared from the approved original sprite design.
const spriteRow={down:0,left:1,right:2,up:3,'down-left':4,'down-right':5,'up-left':6,'up-right':7};
function drawWalking(x,y,dir,moving,phase,opacity=1,scale=1){
 const diagonal=dir.includes('-');
 const img=moving?(diagonal?files[spriteFile.diagonalWalk]:files[spriteFile.walk]):files[spriteFile.idle];
 if(!img?.complete||!img.naturalWidth)return;
 ctx.save();ctx.globalAlpha=opacity;ctx.imageSmoothingEnabled=false;ctx.filter=actorFilter(x,y);
 const fw=101*scale,fh=143*scale;
 if(moving){
  const row=diagonal?({'down-left':0,'down-right':1,'up-left':2,'up-right':3}[dir]??0):(spriteRow[dir]??0);
  const frame=Math.floor(phase*9)%(diagonal?4:6);
  ctx.drawImage(img,frame*80,row*112,80,112,x-fw/2,y-fh,fw,fh);
 }else{
  const neutral=dir==='up'||dir==='up-left'||dir==='up-right'?3:
   dir==='left'||dir==='down-left'?1:dir==='right'||dir==='down-right'?2:0;
  ctx.drawImage(img,neutral*80,0,80,112,x-fw/2,y-fh,fw,fh);
 }
 ctx.restore();ctx.imageSmoothingEnabled=true;
}
function drawSitting(x,y,face,phase,opacity=1,scale=1,beanbag=false){
 // Individually approved seated artwork contains the human ONLY, never a chair.
 const img=beanbag?files[spriteFile.beanbagSit]:files[spriteFile.sit];
 if(!img?.complete||!img.naturalWidth)return;
 const index=face==='right'?2:face==='left'?1:face==='up'?3:0;
 ctx.save();ctx.globalAlpha=opacity;ctx.imageSmoothingEnabled=false;ctx.filter=actorFilter(x,y);
 const w=116*scale,h=152*scale;
 const bob=Math.sin(time*.75)*.24;
 ctx.drawImage(img,index*128,0,128,170,x-w/2,y-h+bob,w,h);
 ctx.restore();ctx.imageSmoothingEnabled=true;
}
function drawPianoPlaying(p){
 const img=files[spriteFile.piano];if(!img?.complete||!img.naturalWidth)return;
 // Dedicated right-facing pianist. Arm and fingers extend to the visible keys.
 const w=116,h=150,frame=Math.floor(time*5)%4;
 ctx.save();ctx.filter=actorFilter(p.x,p.y);ctx.imageSmoothingEnabled=false;
 ctx.drawImage(img,frame*128,0,128,170,p.x-w/2,p.y-h,w,h);
 ctx.restore();ctx.imageSmoothingEnabled=true;
}
// Lying in a top-down bed: the body is under the duvet; the approved head and
// shoulders remain on the pillow. Never crop an unrelated walking animation.
function drawReclining(p){
 if(p.id!=='bed')return; // Sofa lying remains intentionally disabled.
 const img=files[spriteFile.idle];
 if(!img?.complete||!img.naturalWidth)return;
 ctx.save();ctx.filter=actorFilter(p.x,p.y);ctx.imageSmoothingEnabled=false;
 // Natural upper-body overlap under the blanket, not a detached floating head.
 ctx.fillStyle='#292b35';
 ctx.beginPath();ctx.ellipse(p.x,p.y+6,30,32,0,0,Math.PI*2);ctx.fill();
 // The front-facing head from the approved character sheet; remainder is covered.
 ctx.drawImage(img,0,2,80,63,p.x-40,p.y-80,80,71);
 ctx.restore();ctx.imageSmoothingEnabled=true;
}
function drawShower(p){
 // No unclothed character artwork: a discreet opaque mosaic and small water ripples
 // occupy the shower cubicle while the player is hidden behind the privacy glass.
 const x=1292,y=594,w=53,h=150;
 ctx.save();
 ctx.fillStyle='rgba(116,167,180,.29)';ctx.fillRect(x,y,w,h);
 for(let row=0;row<11;row++)for(let col=0;col<4;col++){
  const shimmer=Math.sin(time*3+row*2.13+col*1.5);
  ctx.fillStyle=(row+col)%3===0?'rgba(82,108,122,.64)':`rgba(181,208,214,${.42+.16*shimmer})`;
  ctx.fillRect(x+3+col*12,y+7+row*13,11,12);
 }
 ctx.strokeStyle='rgba(216,237,244,.77)';ctx.lineWidth=1.8;
 for(let n=0;n<13;n++){const xx=x+5+(n*23)%45,yy=y+((n*31+time*75)%h);
  ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx-2,yy+11);ctx.stroke();}
 ctx.fillStyle='rgba(245,249,247,.25)';
 for(let n=0;n<5;n++){let yy=y+30+n*23,xx=x+8+Math.sin(time*.9+n)*10;
  ctx.beginPath();ctx.ellipse(xx,yy,8,4,0,0,Math.PI*2);ctx.fill();}
 ctx.strokeStyle='rgba(227,237,232,.53)';ctx.strokeRect(x+.5,y+.5,w-1,h-1);
 ctx.restore();
}
function renderRest(p){
 if(p.type==='shower'){drawShower(p);return}
 if(p.type==='sit'){
  if(p.id==='piano')drawPianoPlaying(p);
  else if(p.id==='sofa')drawSitting(p.x,p.y-26,p.face,0,1,.78,false); // feet stay on the sofa
  else if(p.id==='balchair')drawSitting(p.x,p.y-38,p.face,0,1,.75,false); // seat, not railing
  else if(p.id==='beanbag')drawSitting(p.x,p.y-38,p.face,0,1,.75,true); // sit within cushion
  else drawSitting(p.x,p.y,p.face,0,1,1,false);
 }

 else drawReclining(p);
 if(p.id==='bed'){
  if(p.type==='lie'){
   const img=files[spriteFile.duvet];
   if(img.complete&&img.naturalWidth){ctx.save();ctx.drawImage(img,994,338,222,130);ctx.restore();}
  } // No transplanted art strip over the seated sprite or bed footboard.
 }
 // Beanbag artwork is a single integrated cushion: no 9px furniture strip
 // is pasted over the character's feet (it previously cut them in half).

}
function drawShoesAtEntrance(){
 // Character removes shoes at entrance. Existing interior sprites have charcoal socks.
 // Shoes are rendered from shapes: no sprite atlas must be loaded to show them.
 ctx.save();ctx.fillStyle='rgba(22,24,28,.23)';ctx.beginPath();ctx.ellipse(830,854,23,7,0,0,Math.PI*2);ctx.fill();
 // Two understated shoes beside the mat, not blocking movement.
 ctx.fillStyle='#29262a';ctx.strokeStyle='#1b1b20';ctx.lineWidth=2;
 for(const x of [818,833]){ctx.beginPath();ctx.roundRect(x,846,11,19,4);ctx.fill();ctx.stroke();
  ctx.fillStyle='#49474b';ctx.fillRect(x+3,850,5,2);ctx.fillStyle='#29262a';}
 ctx.restore();
}
function drawPlayer(){const t=player.transition;
 if(t){const f=ease(clamp(t.t/0.7,0,1));const x=t.fromX+(t.toX-t.fromX)*f,y=t.fromY+(t.toY-t.fromY)*f;
   if(t.kind==='enter'){
      if(f<.44){drawShadow(x,y);drawWalking(x,y,t.face,f<.31,0)}
      else if(f<.70){
        // A single crouching figure bends into the seat; never a translucent duplicate.
        const squash=1-.23*ease((f-.44)/.26);
        ctx.save();ctx.translate(0,y);ctx.scale(1,squash);ctx.translate(0,-y);
        drawWalking(x,y,t.face,false,0);ctx.restore();
      }else {renderRest({id:t.id,type:t.type,x:t.toX,y:t.toY,face:t.face})}
   }else{
      if(f<.28){renderRest({id:t.id,type:t.type,x:t.fromX,y:t.fromY,face:t.face})}
      else if(f<.55){const squash=.77+.23*ease((f-.28)/.27);
        ctx.save();ctx.translate(0,y);ctx.scale(1,squash);ctx.translate(0,-y);
        drawWalking(x,y,t.face,false,0);ctx.restore();
      }else {drawShadow(x,y);drawWalking(x,y,t.face,false,0)}
   }return;
 }
 if(player.pose){renderRest(player.pose);return}
 drawShadow(player.x,player.y);drawWalking(player.x,player.y,player.dir,player.moving,player.phase);
}
function actorFilter(x,y){
 // Region-aware illumination: sunlight entering from the balcony, shadow beside furniture,
 // cool night ambient and warm nearby lamps. Respect approved skin/hair palette.
 let bright=lightMode==='night'?.70:lightMode==='sunrise'?.92:lightMode==='sunset'?.93:lightMode==='morning'?.99:1.02;
 if(weather==='cloudy'||weather==='foggy'||weather==='rainy')bright*=.94;
 if(weather==='storm')bright*=.88;
 const underSofa=(x<590&&y>242&&y<365);
 if(underSofa)bright*=.91;
 const sunPatch=(x>575&&x<950&&y>214&&y<570)&&lightMode!=='night';
 if(sunPatch)bright+=lightMode==='sunset'?.16:lightMode==='sunrise'?.11:.07;
 if(lightMode==='night'){
  for(const [lx,ly,r] of [[305,258,210],[845,318,130],[1250,250,170]]){
   bright+=.23*clamp(1-Math.hypot(x-lx,y-ly)/r,0,1);
  }
 }
 const sat=lightMode==='night'?.81:lightMode==='sunset'?1.16:1.02;
 const warmth=lightMode==='sunset'?'sepia(.19)':lightMode==='sunrise'?'sepia(.08)':lightMode==='night'?'sepia(.03)':'sepia(0)';
 return `brightness(${clamp(bright,.54,1.2).toFixed(3)}) saturate(${sat}) ${warmth}`;
}
function drawShadow(x,y){ctx.save();ctx.fillStyle='rgba(19,24,28,.22)';ctx.beginPath();ctx.ellipse(x,y-3,19,6,0,0,Math.PI*2);ctx.fill();ctx.restore()}
function drawBalconyGlassInFront(){
 // The solid collision is along the threshold BASE, not the top of the pane.
 // The figure remains visible through genuinely translucent glass.
 const p=player.pose?null:player;
 if(!p||p.y>223||p.x<238||p.x>826)return;
 ctx.save();ctx.beginPath();
 ctx.rect(239,186,338,32);ctx.rect(655,186,169,32);ctx.clip();
 ctx.fillStyle='rgba(128,179,181,.18)';ctx.fillRect(238,184,590,38);
 ctx.strokeStyle='rgba(238,251,243,.20)';ctx.lineWidth=1;
 for(const x of [286,462,705,789]){ctx.beginPath();ctx.moveTo(x,190);ctx.lineTo(x+20,212);ctx.stroke()}
 ctx.restore();
}
function lightingOnSprite(){if(lightMode==='night'){
  const dx=player.x-307,dy=player.y-270,near=clamp(1-Math.hypot(dx,dy)/240,0,1);
  const dx2=player.x-1248,dy2=player.y-249,near2=clamp(1-Math.hypot(dx2,dy2)/170,0,1);
  const bright=Math.max(near,near2);if(bright>.01)glow(player.x,player.y-55,40,.075*bright);
 }}
function draw(){if(!ready){ctx.fillStyle='#111720';ctx.fillRect(0,0,W,H);return;}ctx.fillStyle='#111720';ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(0,cameraY);
 // One world plane extends behind the entire apartment, including the bedroom window.
 drawCourtyard();drawFallingLeaves();outdoorTint();
 // Opaque apartment sections cover the courtyard; true glazing reveals the same world.
 drawBase();drawFourthFloorFacade();drawBathroomMirror();drawBedroomWindow();drawBalconyDoor();drawPhysicalDoors();
 // Balcony reveal comes from gentle camera look-up; never paste a band over the flat.
 ambientDust();drawWeather();updateAmbient();
 timeLight();
 // No duplicate door leaf over the original artwork.
 drawShoesAtEntrance();drawPlayer();drawBalconyGlassInFront();lightingOnSprite();
 // The railing is painted once in the base scene. Its collider—not a second image slab—enforces depth.

 if(stormFlash>0){ctx.fillStyle=`rgba(211,224,255,${stormFlash*.43})`;ctx.fillRect(230,-350,1130,1330)}
 ctx.restore();}
function tick(ts){const dt=gamePaused?0:clamp((ts-last)/1000||0,0,.041);last=ts;time+=dt;
 lightAmount=clamp(lightAmount+dt/2.3,0,1);
 if(lightAmount===1&&lastLight!==lightMode){discardMode(lastLight);lastLight=lightMode;}weatherBlend=clamp(weatherBlend+dt/1.4,0,1);
 stormFlash=Math.max(0,stormFlash-dt*3.0);if(weather==='storm'&&time>stormNext){stormFlash=1;stormNext=time+6+rng(Math.floor(time))*12}
 let vx=joy.x,vy=joy.y;
 if(keyState.has('ArrowLeft')||keyState.has('a'))vx--;
 if(keyState.has('ArrowRight')||keyState.has('d'))vx++;
 if(keyState.has('ArrowUp')||keyState.has('w'))vy--;
 if(keyState.has('ArrowDown')||keyState.has('s'))vy++;
 if(!dialogue.hidden||!$('#modal').hidden||!$('#controlsPanel').hidden||gamePaused||player.transition){vx=0;vy=0}
 const mag=Math.hypot(vx,vy);if(player.pose&&mag>.18){stand();vx=vy=0}
 if(player.transition){const t=player.transition;t.t+=dt;player.x=t.fromX+(t.toX-t.fromX)*ease(clamp(t.t/.7,0,1));player.y=t.fromY+(t.toY-t.fromY)*ease(clamp(t.t/.7,0,1));
   if(t.t>=.7){if(t.kind==='enter'){player.pose={id:t.id,type:t.type,x:t.toX,y:t.toY,exit:t.exit,face:t.face};player.x=t.toX;player.y=t.toY}
      else{player.x=t.toX;player.y=t.toY;player.dir=t.face}player.transition=null}}
 else if(!player.pose&&mag>.13){const analog=keyState.size>0?1:clamp((mag-.13)/.87,0,1);vx/=mag;vy/=mag;player.moving=true;
   const ax=Math.abs(vx),ay=Math.abs(vy);player.dir=(ax>.33&&ay>.33&&Math.min(ax,ay)/Math.max(ax,ay)>.42)?(vy<0?'up-':'down-')+(vx<0?'left':'right'):(ax>ay?(vx<0?'left':'right'):(vy<0?'up':'down'));
   const speed=18+175*Math.pow(analog,1.32);player.speed=speed;const n=Math.max(1,Math.ceil(speed*dt/3));for(let i=0;i<n;i++){const x=player.x+vx*speed*dt/n,y=player.y+vy*speed*dt/n;
     if(passable(x,player.y))player.x=x;if(passable(player.x,y))player.y=y}
   player.phase+=dt*(.48+2.65*analog);
 }else{player.moving=false;player.phase=0;player.speed=0}
 if(player.pose?.id==='shower'&&!gamePaused){
   showerSeconds+=dt;
   if(showerSeconds>=5.2){showerSeconds=-100;stand();showDialogue('shower_done');}
 }
 updateDoors(dt);
 // When near balcony, gently lift camera; leave flat at full original scale.
 const target=player.y<255?clamp((255-player.y)/150,0,1)*184:0;
 cameraY+=(target-cameraY)*Math.min(1,dt*3.2);
 if(!dialogue.hidden){const chars=clamp(Math.floor((ts-dialogueStart)/23),0,dialogueFull.length);if(dlgText.textContent.length<chars)dlgText.textContent=dialogueFull.slice(0,chars)}
 try{draw()}catch(error){console.error('Rendering frame failed',error);
  const el=document.querySelector('#loadStatus');if(el){el.hidden=false;el.textContent='Rendering error. Restart the game.';}}
 requestAnimationFrame(tick)}requestAnimationFrame(tick);
const pad=$('#joystick'),stick=$('#stick'),actionButton=$('#action');
function movePad(e){if(layoutEdit)return;const r=pad.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,limit=r.width*.43;let x=e.clientX-cx,y=e.clientY-cy,m=Math.hypot(x,y);if(m>limit){x*=limit/m;y*=limit/m}joy={x:x/limit,y:y/limit};stick.style.left=(50+x/r.width*100)+'%';stick.style.top=(50+y/r.height*100)+'%'}
function resetJoystick(){joy={x:0,y:0};stick.style.left=stick.style.top='50%'}
pad.addEventListener('pointerdown',e=>{if(layoutEdit)return;e.preventDefault();pad.setPointerCapture(e.pointerId);movePad(e)});
pad.addEventListener('pointermove',e=>{if(pad.hasPointerCapture(e.pointerId))movePad(e)});
pad.addEventListener('pointerup',resetJoystick);pad.addEventListener('pointercancel',resetJoystick);
actionButton.addEventListener('pointerdown',e=>{if(layoutEdit)return;e.preventDefault();interact()});
// User-adjustable touch controls. Coordinates are normalized to the stage size, not APK version.
const controlsPanel=$('#controlsPanel'),controlEditButton=$('#controlEdit');
const layoutKey='thepianist.controls.v1';
const defaults={pad:{x:.079,y:.884,size:118},action:{x:.927,y:.84,size:114},opacity:.68};
let layout=JSON.parse(JSON.stringify(defaults)),layoutEdit=false,dragging=null;
try{const stored=JSON.parse(localStorage.getItem(layoutKey)||'null');if(stored&&stored.pad&&stored.action){
 for(const key of ['pad','action']){
  layout[key].x=clamp(Number(stored[key].x)||defaults[key].x,.06,.94);
  layout[key].y=clamp(Number(stored[key].y)||defaults[key].y,.10,.94);
  layout[key].size=clamp(Number(stored[key].size)||defaults[key].size,65,210);
 }
 layout.opacity=clamp(Number(stored.opacity)||.68,.2,1);
}}catch(_){}
function saveLayout(){try{localStorage.setItem(layoutKey,JSON.stringify(layout))}catch(_){notice('Control settings could not be saved')}}
function placeControls(){const r=$('#stage').getBoundingClientRect();
 for(const [name,el] of [['pad',pad],['action',actionButton]]){
  const setting=layout[name],size=Math.min(setting.size,r.height*.37,r.width*.25);
  const cx=clamp(setting.x*r.width,size/2+6,r.width-size/2-6),cy=clamp(setting.y*r.height,size/2+6,r.height-size/2-6);
  el.style.left=(cx-size/2)+'px';el.style.top=(cy-size/2)+'px';el.style.right='auto';el.style.bottom='auto';
  el.style.width=size+'px';el.style.height=size+'px';el.style.opacity=String(layout.opacity);
 }
}
function setControlEdit(active){layoutEdit=active;document.body.classList.toggle('editing-controls',active);resetJoystick();
 $('#controlInstructions').textContent=active?'Drag joystick / Interact to move them. Tap Done when satisfied.':'Sizes and positions save automatically across app updates.';
 $('#editControls').textContent=active?'Done positioning':'Move controls';
}
function updateSliders(){ $('#padSize').value=String(layout.pad.size);$('#padSizeValue').textContent=layout.pad.size+'px';
 $('#actionSize').value=String(layout.action.size);$('#actionSizeValue').textContent=layout.action.size+'px';
 $('#controlsOpacity').value=String(Math.round(layout.opacity*100));$('#controlsOpacityValue').textContent=Math.round(layout.opacity*100)+'%';}
function openControls(){controlsPanel.hidden=false;$('#modal').hidden=true;lightMenu.hidden=true;weatherMenu.hidden=true;updateSliders();placeControls();resetJoystick()}
function closeControls(){setControlEdit(false);controlsPanel.hidden=true;saveLayout()}
controlEditButton.addEventListener('click',openControls);
$('#editControls').addEventListener('click',()=>setControlEdit(!layoutEdit));
$('#closeControls').addEventListener('click',closeControls);
$('#resetControls').addEventListener('click',()=>{layout=JSON.parse(JSON.stringify(defaults));updateSliders();placeControls();saveLayout()});
for(const [id,field,name,unit] of [['padSize','pad','size','px'],['actionSize','action','size','px'],['controlsOpacity',null,'opacity','%']]){
 $('#'+id).addEventListener('input',e=>{const v=Number(e.target.value);if(field)layout[field][name]=v;else layout[name]=v/100;
  $('#'+id+'Value').textContent=v+unit;placeControls();saveLayout()});
}
function dragControl(el,which){el.addEventListener('pointerdown',e=>{if(!layoutEdit)return;e.stopImmediatePropagation();e.preventDefault();
 dragging={id:e.pointerId,which};el.setPointerCapture(e.pointerId);
 });
 el.addEventListener('pointermove',e=>{if(!layoutEdit||!dragging||dragging.id!==e.pointerId||dragging.which!==which)return;
  const r=$('#stage').getBoundingClientRect();layout[which].x=clamp((e.clientX-r.left)/r.width,.01,.99);
  layout[which].y=clamp((e.clientY-r.top)/r.height,.01,.99);placeControls();});
 el.addEventListener('pointerup',e=>{if(dragging?.id===e.pointerId){dragging=null;saveLayout()}});
 el.addEventListener('pointercancel',()=>{dragging=null;saveLayout()});
}
dragControl(pad,'pad');dragControl(actionButton,'action');
window.addEventListener('resize',placeControls);placeControls();
window.addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(k))e.preventDefault();keyState.add(k);if((k==='e'||k===' ')&&!e.repeat)interact()});
window.addEventListener('keyup',e=>keyState.delete(e.key.length===1?e.key.toLowerCase():e.key));
window.addEventListener('blur',()=>{keyState.clear();resetJoystick();audioSuspend()});
window.addEventListener('focus',()=>{if(!gamePaused)audioResume()});
$('#help').onclick=()=>{$('#modal').hidden=false;resetJoystick()};$('#close').onclick=()=>$('#modal').hidden=true;
// Debug-only hooks for screenshot/geometry tests, inert during normal play.
if(new URLSearchParams(location.search).has('qa'))window.__pianistTest={getState:()=>({x:player.x,y:player.y,dir:player.dir,pose:player.pose,lightMode,weather,cameraY,balconyOpening,layout,gamePaused,ambientOn,speed:player.speed,bedroomDoorAngle,frontDoorMotion,bathDoorMotion,dialogueText:dialogueFull,dialogueOpen:!dialogue.hidden}),nearestId:()=>nearest()?.id||null,setPlayer:(x,y,dir)=>{hideDialogue();player.x=x;player.y=y;player.dir=dir||player.dir;player.pose=null;player.transition=null},setPose:(id,type)=>{const f=furniture[id]?.[type];if(f){player.transition=null;player.pose={id,type,x:f.x,y:f.y,exit:f.exit,face:f.face};player.x=f.x;player.y=f.y;}},setLighting,setWeather,passable,rooms,solids,objects,dialogueScript,interact,actorFilter,enterBackground,enterForeground,placeControls,isReady:()=>ready,loadedImages:()=>Object.keys(files).filter(n=>files[n]?.naturalWidth)};
})();
