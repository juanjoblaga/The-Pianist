const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'../editable/app/src/main/assets');
const A=require(path.join(base,'game-assets.js'));
const scene=require(path.join(base,'game-config.js'));
const exists=name=>fs.existsSync(path.join(base,name));
const pngSize=name=>{const b=fs.readFileSync(path.join(base,name));assert.equal(b.toString('hex',0,8),'89504e470d0a1a0a',name+' is not a PNG');return {w:b.readUInt32BE(16),h:b.readUInt32BE(20)};};
test('all active time-of-day images and every portrait exist',()=>{
 for(const mode of A.modes)for(const layer of A.modeLayers){const ext=(layer==='world'||layer==='light')?'jpg':'png';assert(exists(layer+'_'+mode+'.'+ext),'missing '+layer+'_'+mode);}
 for(const [id,entry] of Object.entries(scene.dialogueScript)){assert(exists(entry.portrait),id+' portrait missing');}
});
test('sprite source frames fit their canonical atlases',()=>{
 for(const [type,frames] of Object.entries(A.atlas)){
  const name=A.sprites[type]+'.png';assert(exists(name),'missing sprite '+name);
  const size=pngSize(name);assert(size.w>=frames.columns*frames.width,name+' atlas width');
  assert(size.h>=frames.rows*frames.height,name+' atlas height');
 }
 for(const name of A.persistentAssets){assert(exists(name+'.png'),'missing persistent image '+name);}
});
test('approved artwork reused rather than unknown pose fallback',()=>{
 const s=fs.readFileSync(path.join(base,'game.js'),'utf8');
 assert(s.includes('files[spriteFile.idle]'),'lying uses approved sprite head');
 assert(!s.includes('files.walk_indoor'),'invisible unpreloaded image must not return');
 assert(s.includes('drawShower(p)'),'private shower pose retained');
});