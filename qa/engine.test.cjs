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
 assert.equal(physics.passable(1060,720),true,'Shower needs a genuinely walkable exit');
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
 assert.equal(config.furniture.bed.lie.y,325);
 assert.equal(visuals.sofa.sit.scale,visuals.bed.sit.scale,'seating proportions should remain consistent');
 assert(visuals.balchair.sit.scale>=.85&&visuals.beanbag.sit.scale>=.85);
 assert(game.includes('const exit=id===\'shower\'?safeExit({x:1060,y:720})'),'shower must exit clear of walls');
 assert(!game.includes("const img=files[spriteFile.piano]"),'Do not restore distorted piano arm atlas');
 assert(!game.includes("ctx.drawImage(img,994,338,222,130)"),'No duplicate duvet over torso');
});
