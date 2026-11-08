const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const src=path.resolve(__dirname,'../editable/app/src/main/assets');
const read=n=>fs.readFileSync(path.join(src,n),'utf8');
test('travel hub asset and return-home routes are present',()=>{
 const js=read('travel.js'),html=read('travel.html'),game=read('game.js');
 assert(js.includes('function openMap()')&&js.includes('function closeMap()'));
 assert(js.includes("window.location.assign('index.html')"));
 assert(js.includes('canWalk(x,y)'));
 assert(html.includes('id="mapOverlay"')&&html.includes('id="returnHome"'));
 assert(html.includes('id="travelButton"')&&html.includes('id="closeMap"'));
 assert(game.includes("location.assign('travel.html')"));
 assert(game.includes("localStorage.setItem('thepianist.travel.light.v1',lightMode)"));
});
test('sofa cushion changes only during lying, balcony cannot approach rear rail',()=>{
 const game=read('game.js'),config=require(path.join(src,'game-config.js'));
 const physics=require(path.join(src,'game-physics.js')).create(config,9);
 assert(game.includes('function recolorRestPillow(img)'));
 assert(game.includes('function drawSofaWithoutCushion()'));
 assert(game.includes("player.pose?.id!=='sofa'"));
 assert(!physics.passable(590,90),'Rear railing must block feet near the fence');
 assert(physics.passable(590,108),'Balcony must still have usable walking space');
});