const test=require('node:test'), assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs');
const assets=path.resolve(__dirname,'../editable/app/src/main/assets');
const config=require(path.join(assets,'game-config.js'));
const physics=require(path.join(assets,'game-physics.js')).create(config);
const game=fs.readFileSync(path.join(assets,'game.js'),'utf8');
const visuals=require(path.join(assets,'game-poses.js'));
test('canonical dialogue and interactions',()=>{
 assert.equal(config.objects.length,13);
 assert.equal(new Set(config.objects.map(x=>x.id)).size,13);
 const d=config.dialogueScript;
 assert.equal(d.mirror.text,'Looking good! As always.');
 assert.equal(d.shower.text,'Maybe I need a shower');
 assert.equal(d.shower_done.text,'Nice and clean');
 assert.equal(d.toilet.text,'I dont need to use the toilet right now');
 assert.equal(d.wardrobe.text,'Just a bunch of clothes');
 assert.equal(d.sofa.text,'Agggh... this sofa is truly the best <3');
 assert(!config.objects.some(o=>o.id==='window'));
});
test('walls and narrow furniture clearances',()=>{
 assert(physics.passable(730,570));
 assert(physics.passable(480,319),'Sofa-table gap should be passable');
 for(let x=388;x<=625;x+=4)assert(physics.passable(x,325),'Horizontal sofa-table walk route blocked at '+x);
 for(let y=309;y<=335;y+=4)assert(physics.passable(420,y),'Sofa-chaise/table turn blocked at '+y);
 assert(physics.passable(1018,700));
 for(const [x,y] of [[100,100],[895,400],[895,420],[1080,340],[1325,650],[465,360],[260,300]])assert(!physics.passable(x,y),'Wrong collider '+x+','+y);
});
test('furniture poses have valid safe exits',()=>{
 for(const [id,poses] of Object.entries(config.furniture)){
  assert(config.objects.some(o=>o.id===id));
  for(const [pose,p] of Object.entries(poses)){
   const ex=physics.safeExit(p.exit);
   assert(physics.passable(ex.x,ex.y),id+' '+pose);
   assert(Math.hypot(ex.x-p.exit.x,ex.y-p.exit.y)<145,id+' exit too far');
  }
 }
 assert(config.furniture.sofa.lie,'Sofa should offer a lying pose');
 assert.equal(physics.passable(1250,751),true,'Shower needs a genuinely walkable exit');
});
test('all 13 objects are reachable on 8-way movement grid',()=>{
 const delta=[[8,0],[-8,0],[0,8],[0,-8],[8,8],[-8,8],[8,-8],[-8,-8]];
 const dirs=['up','down','left','right','up-left','up-right','down-left','down-right'];
 const q=[[730,570]],seen=new Set(['730,570']),found=new Set();
 for(let i=0;i<q.length&&i<45000;i++){const [x,y]=q[i];
  for(const dir of dirs){const o=physics.nearest(x,y,dir);if(o)found.add(o.id);}
  for(const [dx,dy] of delta){const nx=x+dx,ny=y+dy,key=nx+','+ny;
   if(seen.has(key)||!physics.passable(nx,ny))continue;
   if(dx&&dy&&(!physics.passable(nx,y)||!physics.passable(x,ny)))continue;
   seen.add(key);q.push([nx,ny]);
  }
 }
 assert(q.length>900,'Too few traversable cells: '+q.length);
 assert.deepEqual(config.objects.filter(o=>!found.has(o.id)).map(o=>o.id),[],'Unreachable interactions');
});
test('bed lie uses approved available sprite, and QA hook is opt-in',()=>{
 assert(game.includes('const img=files[spriteFile.idle];'));
 assert(game.includes('files[spriteFile.sofaRest]'),'Approved sofa resting artwork must be loaded');
 assert(visuals.sofa.lie&&visuals.bed.lie,'Both lying poses must be rendered');
 for(const [id,types] of Object.entries(config.furniture))for(const type of Object.keys(types))assert(visuals[id]?.[type],id+' / '+type+' missing visual');
 assert(game.includes("URLSearchParams(location.search).has('qa')"));
});
test('nearby bathroom fixtures resolve by facing, not raw proximity',()=>{
 const mirror=physics.nearest(1178,695,'up');
 const toilet=physics.nearest(1207,603,'down');
 const shower=physics.nearest(1250,590,'right');
 assert.equal(mirror?.id,'mirror');
 assert.equal(toilet?.id,'toilet');
 assert.equal(shower?.id,'shower');
 assert.notEqual(physics.nearest(1250,590,'left')?.id,'shower');
});
test('poses and release rendering avoid old unnatural assets',()=>{
 assert.equal(config.furniture.bed.lie.y,289);
 assert.equal(visuals.sofa.sit.scale,visuals.bed.sit.scale,'seating proportions should remain consistent');
 assert(visuals.balchair.sit.scale>=.85&&visuals.beanbag.sit.scale>=.85);
 assert(game.includes('const exit=id===\'shower\'?safeExit({x:1250,y:751})'),'shower must exit clear of walls');
 assert(!game.includes("const img=files[spriteFile.piano]"),'Do not restore distorted piano arm atlas');
 assert(game.includes("files['bedcover_'+lightMode]"),'Use identical patterned duvet texture');
});

test('head proportions, sofa lying pose and piano bench alignment',()=>{
 const bed=visuals.bed.lie;
 assert(Math.abs(bed.headWidth/80-bed.headHeight/54)<.025,
  'Bed must scale the original face uniformly, never narrower than standing');
 assert(game.includes('files[spriteFile.sofaRest]'),
  'Sofa must show the approved natural reclining sprite, not a spliced upright head');
 assert(visuals.sofa.lie.width>=185&&visuals.sofa.lie.width<=200, 'Sofa pose must be scaled to furniture proportions');
 assert(!game.includes("ctx.drawImage(img,80,0,80,112,-38,-79"),
  'Do not rotate an entire upright character sideways for sofa lying');
 const p=config.furniture.piano.sit;
 assert(p.x>=765&&p.x<=775&&p.y>=375&&p.y<=400,
  'Piano pose should sit on the bench, not in front of it');
 assert(p.x+40>=800&&p.x+40<=820,
  'Finger tips should reach the existing keybed x=782..795');
 assert(visuals.piano.sit.handTravel<=4,'Hand articulation should be small and natural');
 assert(game.includes('spriteFile.pianoMotion')&&game.includes('Math.floor(time*spec.beatsPerSecond*6)%6'),
  'Piano playing must cycle independently authored hand poses rather than drawing fake extra arms');
});

test('v0.5.4 help, bed sheet and approved piano regressions',()=>{
 const html=fs.readFileSync(path.join(assets,'index.html'),'utf8');
 const css=fs.readFileSync(path.join(assets,'style.css'),'utf8');
 const art=require(path.join(assets,'game-assets.js'));
 assert(html.includes('id="closeHelpTop"')&&html.includes('class="helpScroll"'));
 assert(css.includes('.helpScroll{min-height:0;flex:1 1 auto;overflow-y:auto'));
 assert(game.includes("$('#closeHelpTop').onclick=closeHelpModal"));
 assert(!game.includes('ctx.drawImage(duvet,993,333,225,123)'));
 assert(game.includes("const prior=files['bedcover_'+lastLight],current=files['bedcover_'+lightMode]"));
 assert.equal(art.atlas.pianoMotion.columns,6);
 assert.equal(art.sprites.pianoMotion,'piano_motion_v054');
 assert(config.objects.find(o=>o.id==='sofa').reach>=70);
 assert.equal(config.furniture.shower.shower.exit.x,1250);
 assert.equal(config.furniture.shower.shower.exit.y,751);
});

test('v0.5.5 cover matches lighting and shower exit remains reachable',()=>{
 const art=require(path.join(assets,'game-assets.js'));
 assert(art.modeLayers.includes('bedcover'));
 const {x,y}=config.furniture.shower.shower.exit;
 assert(physics.passable(x,y));
 assert(Math.hypot(x-1277,y-711)<56);
 for(let X=x;X>=1042;X-=2)assert(physics.passable(X,y),'Bathroom return blocked: '+X);
});

test('piano close to keys and formerly invisible bedroom floor open',()=>{
 const p=config.furniture.piano.sit;
 assert(p.x>=765&&p.x<=775&&p.y>=375&&p.y<=390);
 assert(visuals.piano.sit.scale>=.98&&visuals.piano.sit.scale<=1.02);
 for(const [x,y] of [[905,452],[900,452],[925,467],[910,500],[935,510],[928,638],[975,640]])
   assert(physics.passable(x,y),'Invisible wall at visible floor tile '+x+','+y);
 const art=fs.readFileSync(path.resolve(__dirname,'restore-doors.py'),'utf8');
 assert(art.includes('FRONT_DOOR = [(710,805)')&&art.includes('1024,1536'),
   'Ghost-door cleanup must work in original image coordinates');
});
