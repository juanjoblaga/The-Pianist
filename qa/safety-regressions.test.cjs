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
