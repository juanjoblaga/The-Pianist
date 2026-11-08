const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const assets=path.resolve(__dirname,'../editable/app/src/main/assets');
const game=fs.readFileSync(path.join(assets,'game.js'),'utf8');
const cfg=require(path.join(assets,'game-config.js'));
const phys=require(path.join(assets,'game-physics.js')).create(cfg,9);
test('Android-safe sofa pose cannot taint canvas or leave persistent alpha',()=>{
 assert(!game.includes('getImageData(0,0,cv.width,cv.height)'));
 assert(game.includes('ctx.drawImage(img,frame*240'));
 assert(game.includes("ctx.globalCompositeOperation='source-over'"));
 assert(fs.existsSync(path.join(assets,'sofa_rest_dark_v059.png')));
});
test('complete balcony furniture and matched railing collision',()=>{
 assert(game.includes("files['balconyprops_'+lightMode]"));
 assert(fs.existsSync(path.join(assets,'balconyprops_afternoon.png')));
 assert(!phys.passable(590,115));
 assert(phys.passable(590,132));
});
test('direct door travel without secondary dialogue tap',()=>{
 assert(game.includes("window.location.assign('travel.html')"));
 assert(!game.includes("label:'Go to New Islington'"));
 assert(fs.existsSync(path.join(assets,'travel.html')));
 assert(cfg.objects.find(o=>o.id==='frontdoor').reach>=80);
});
test('door restoration repairs full triangular edge',()=>{
 const py=fs.readFileSync(path.join(__dirname,'restore-doors.py'),'utf8');
 assert(py.includes('(821,925)'));
 assert(py.includes('Repaired physical entry door'));
});

test('balcony cutouts are generated for all five day/night plates',()=>{
 const art=require(path.join(assets,'game-assets.js'));
 assert(art.modeLayers.includes('balconyprops'));
 for(const mode of art.modes){
  const png=fs.readFileSync(path.join(assets,'balconyprops_'+mode+'.png'));
  assert(png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
  assert(png.readUInt32BE(16)===595&&png.readUInt32BE(20)===145);
 }
});

test('entrance bright door-tip cleanup covers last right-wall triangle',()=>{
 const py=fs.readFileSync(path.join(__dirname,'restore-doors.py'),'utf8');
 assert(py.includes('RIGHT=[(847,825),(885,826),(882,868),(846,874)]'));
});
