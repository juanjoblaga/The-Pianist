/* Real browser regression tour of The Pianist apartment. */
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const imageDir='qa/screenshots';fs.mkdirSync(imageDir,{recursive:true});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1365,height:768},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('/favicon.ico'))errors.push('HTTP '+response.status()+': '+response.url());});
 page.on('console',msg=>{if(msg.type()==='error'&&!msg.text().includes('Failed to load resource:'))errors.push(msg.text());});
 try{
  let opened=false;
  for(let i=0;i<12;i++){try{await page.goto('http://127.0.0.1:8033/index.html?qa=1',{waitUntil:'domcontentloaded',timeout:10000});opened=true;break;}catch(e){await pause(400);}}
  assert(opened,'local game server not reachable');
  await page.waitForFunction(()=>window.__pianistTest&&window.__pianistTest.isReady(),{timeout:30000});
  await pause(400);
  const initial=await page.evaluate(()=>window.__pianistTest.getState());
  assert(initial.x>0&&initial.y>0);
  await page.screenshot({path:imageDir+'/01-apartment.png'});
  // Real keyboard movement and diagonal input on the same collision model.
  const start=await page.evaluate(()=>window.__pianistTest.getState());
  await page.keyboard.down('ArrowRight');await pause(220);await page.keyboard.up('ArrowRight');
  const moved=await page.evaluate(()=>window.__pianistTest.getState());
  assert(moved.x>start.x+12,'Walking right should move the player');
  assert(await page.evaluate(()=>window.__pianistTest.passable(window.__pianistTest.getState().x,window.__pianistTest.getState().y)));
  await page.keyboard.down('ArrowUp');await page.keyboard.down('ArrowRight');await pause(170);
  const diag=await page.evaluate(()=>window.__pianistTest.getState());
  await page.keyboard.up('ArrowUp');await page.keyboard.up('ArrowRight');
  assert(diag.dir==='up-right','Diagonal animation/direction must be distinct');
  // Examine each object using real interaction dispatch, not text-only matches.
  const locations=[
   ['piano',730,420,'right'],['sofa',605,354,'left'],['kitchen',300,530,'left'],
   ['kitchen2',628,642,'down'],['bed',1103,525,'up'],['wardrobe',1252,525,'right'],
   ['mirror',1060,602,'right'],['toilet',1207,603,'down'],['shower',1250,590,'right'],
   ['balcony',606,106,'up'],['balchair',517,122,'left'],['beanbag',690,115,'right'],
   ['frontdoor',760,794,'down']
  ];
  for(const [id,x,y,dir] of locations){
   const result=await page.evaluate(({x,y,dir})=>{const q=window.__pianistTest;q.setPlayer(x,y,dir);return {safe:q.passable(x,y),found:q.nearestId()};},{x,y,dir});
   assert(result.safe,'Test interaction approach is blocked for '+id+' at '+x+','+y);
   assert.equal(result.found,id,'Wrong interaction target at '+id);
   await page.evaluate(()=>window.__pianistTest.interact());
   const state=await page.evaluate(()=>window.__pianistTest.getState());
   assert(state.dialogueOpen,'Dialogue did not open for '+id);
   assert(state.dialogueText.length>0,'Dialogue text missing for '+id);
  }
  // Bed: player remains visible above the cover, then safely stands on floor.
  await page.evaluate(()=>window.__pianistTest.setPlayer(1103,525,'up'));
  await page.evaluate(()=>window.__pianistTest.interact());
  await page.getByRole('button',{name:'Lie down'}).dispatchEvent('pointerdown',{bubbles:true});
  await pause(900);
  let pose=await page.evaluate(()=>window.__pianistTest.getState().pose);
  assert(pose&&pose.id==='bed'&&pose.type==='lie','Bed lying pose did not activate');
  await page.screenshot({path:imageDir+'/02-bed-lying.png'});
  await page.evaluate(()=>window.__pianistTest.interact());await pause(900);
  let standing=await page.evaluate(()=>window.__pianistTest.getState());
  assert.equal(standing.pose,null,'Cannot stand after lying down');
  assert(await page.evaluate(()=>window.__pianistTest.passable(window.__pianistTest.getState().x,window.__pianistTest.getState().y)),'Bed exit is blocked');
  // Sofa sitting must return to exact starting floor position, not through the table.
  await page.evaluate(()=>window.__pianistTest.setPlayer(605,354,'left'));
  await page.evaluate(()=>window.__pianistTest.interact());
  assert.equal(await page.getByRole('button',{name:'Lie down'}).count(),1,'Sofa must support lying down');
  await page.getByRole('button',{name:'Sit',exact:true}).dispatchEvent('pointerdown',{bubbles:true});
  await pause(850);
  assert.equal((await page.evaluate(()=>window.__pianistTest.getState().pose)).id,'sofa');
  await page.screenshot({path:imageDir+'/03-sofa-seated.png'});
  await page.evaluate(()=>window.__pianistTest.interact());await pause(850);
  const sofaExit=await page.evaluate(()=>window.__pianistTest.getState());
  assert(Math.hypot(sofaExit.x-605,sofaExit.y-354)<2,'Sofa exit should return to original approach');
  await page.evaluate(()=>window.__pianistTest.setPlayer(605,354,'left'));
  await page.evaluate(()=>window.__pianistTest.interact());
  await page.getByRole('button',{name:'Lie down'}).dispatchEvent('pointerdown',{bubbles:true});
  await pause(850);
  const sofaLie=await page.evaluate(()=>window.__pianistTest.getState());
  assert(sofaLie.pose?.id==='sofa'&&sofaLie.pose.type==='lie','Sofa lying pose missing');
  await page.screenshot({path:imageDir+'/10-sofa-lying.png'});
  await page.evaluate(()=>window.__pianistTest.interact());await pause(850);
  const sofaLieExit=await page.evaluate(()=>window.__pianistTest.getState());
  assert(Math.hypot(sofaLieExit.x-605,sofaLieExit.y-354)<2,'Sofa lie exit must return to the approach');
  // Additional pose tour: inspect actual piano hands, bed seating and beanbag/chair.
  const poseCases=[
    ['piano',730,420,'right','Play','06-piano-playing.png'],
    ['bed',1103,525,'up','Sit','07-bed-seated.png'],
    ['beanbag',690,115,'right','Sit','08-beanbag-seated.png'],
    ['balchair',517,122,'left','Sit','09-balcony-chair.png']
  ];
  for(const [id,x,y,dir,choice,shot] of poseCases){
    await page.evaluate(({x,y,dir})=>window.__pianistTest.setPlayer(x,y,dir),{x,y,dir});
    await page.evaluate(()=>window.__pianistTest.interact());
    await page.getByRole('button',{name:choice,exact:true}).dispatchEvent('pointerdown',{bubbles:true});
    await pause(820);
    const seated=await page.evaluate(()=>window.__pianistTest.getState());
    assert(seated.pose&&seated.pose.id===id,'Pose failed: '+id);
    if(id==='piano'){
      const getKeys=()=>page.evaluate(()=>Array.from(document.querySelector('#game').getContext('2d').getImageData(779,338,27,33).data));
      const a=await getKeys();
      await pause(265);
      const b=await getKeys();
      const changed=a.reduce((n,v,i)=>n+(Math.abs(v-b[i])>16?1:0),0);
      assert(changed>=18,'The pianist must visibly articulate his hands, not simply bob his torso: '+changed);
    }
    await page.screenshot({path:imageDir+'/'+shot});
    await page.evaluate(()=>window.__pianistTest.interact());await pause(820);
    const exited=await page.evaluate(()=>window.__pianistTest.getState());
    assert.equal(exited.pose,null,'Stuck after '+id);
    assert(await page.evaluate(()=>window.__pianistTest.passable(window.__pianistTest.getState().x,window.__pianistTest.getState().y)),id+' exit blocked');
  }
  // Shower: privacy glass and completion dialogue, no stuck pose.
  await page.evaluate(()=>window.__pianistTest.setPlayer(1250,590,'right'));
  await page.evaluate(()=>window.__pianistTest.interact());
  await page.getByRole('button',{name:'Take shower'}).dispatchEvent('pointerdown',{bubbles:true});
  await pause(850);
  await page.screenshot({path:imageDir+'/04-shower-privacy.png'});
  await pause(5600);
  const shower=await page.evaluate(()=>window.__pianistTest.getState());
  assert.equal(shower.dialogueText,'Nice and clean','Shower completion line changed');
  assert.equal(shower.pose,null,'Shower pose failed to clear');
  await pause(850);
  assert(await page.evaluate(()=>window.__pianistTest.passable(window.__pianistTest.getState().x,window.__pianistTest.getState().y)),'Stuck after shower');
  const showerExit=await page.evaluate(()=>window.__pianistTest.getState());
  assert(Math.hypot(showerExit.x-1060,showerExit.y-720)<2,'Shower exit must be at clear bathroom floor');
  await page.evaluate(()=>{document.querySelector('#dialogue').hidden=true;});
  await page.keyboard.down('ArrowLeft');await pause(160);await page.keyboard.up('ArrowLeft');
  const movedOut=await page.evaluate(()=>window.__pianistTest.getState());
  assert(movedOut.x<showerExit.x-5,'Avatar cannot move away after shower');
  const fixtures=[['mirror',1178,695,'up'],['toilet',1207,603,'down'],['shower',1250,590,'right']];
  for(const [id,x,y,dir] of fixtures){
   const target=await page.evaluate(({x,y,dir})=>{window.__pianistTest.setPlayer(x,y,dir);return window.__pianistTest.nearestId()},{x,y,dir});
   assert.equal(target,id,'Wrong restroom target '+id);
  }
  // Daylight must visibly differ from the previously baked-in night scene.
  await page.evaluate(()=>window.__pianistTest.setPlayer(730,570,'down'));
  await page.evaluate(()=>window.__pianistTest.setLighting('night'));
  await page.waitForFunction(()=>window.__pianistTest.getState().lightMode==='night');
  await pause(2400);
  await page.screenshot({path:imageDir+'/11-night-exterior.png'});
  const nightPixel=await page.evaluate(()=>Array.from(document.querySelector('#game').getContext('2d').getImageData(1100,56,1,1).data));
  await page.evaluate(()=>window.__pianistTest.setLighting('afternoon'));
  await page.waitForFunction(()=>window.__pianistTest.getState().lightMode==='afternoon');
  await pause(2400);
  await page.screenshot({path:imageDir+'/12-daytime-exterior.png'});
  const dayPixel=await page.evaluate(()=>Array.from(document.querySelector('#game').getContext('2d').getImageData(1100,56,1,1).data));
  assert(dayPixel.slice(0,3).reduce((v,x,i)=>v+Math.abs(x-nightPixel[i]),0)>18,'Daylight should be visibly different from night');
  // Lighting and weather can be switched without loading/rendering errors.
  await page.evaluate(()=>window.__pianistTest.setPlayer(730,570,'down'));
  for(const mode of ['sunrise','morning','afternoon','sunset','night']){
    await page.evaluate(mode=>window.__pianistTest.setLighting(mode),mode);
    await page.waitForFunction(mode=>window.__pianistTest.getState().lightMode===mode,mode,{timeout:15000});
  }
  for(const weather of ['sunny','cloudy','foggy','rainy','snowy','storm','windy']){
    await page.evaluate(mode=>window.__pianistTest.setWeather(mode),weather);await pause(180);
    assert.equal((await page.evaluate(()=>window.__pianistTest.getState())).weather,weather);
  }
  await page.evaluate(()=>window.__pianistTest.setWeather('rainy'));
  await page.screenshot({path:imageDir+'/05-rainy-evening.png'});
  await page.locator('#weather').click();
  const sound=page.locator('#sound');
  const audioInitiallyOn=await sound.getAttribute('aria-pressed');
  if(audioInitiallyOn==='true'){await sound.click();assert.equal(await sound.getAttribute('aria-pressed'),'false');}
  await sound.click();
  assert.equal(await sound.getAttribute('aria-pressed'),'true');
  await page.locator('#weather').click();
  await page.evaluate(()=>window.__pianistTest.enterBackground());
  assert.equal((await page.evaluate(()=>window.__pianistTest.getState())).gamePaused,true);
  await page.evaluate(()=>window.__pianistTest.enterForeground());
  assert.equal((await page.evaluate(()=>window.__pianistTest.getState())).gamePaused,false);
  // Persisted control positions/sizes after reload.
  await page.locator('#help').click();await page.locator('#controlEdit').click();
  await page.locator('#padSize').evaluate(el=>{el.value='136';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#closeControls').click();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__pianistTest?.isReady(),{timeout:30000});
  assert.equal((await page.evaluate(()=>window.__pianistTest.getState())).layout.pad.size,136);
  if(errors.length)throw new Error('Browser errors: '+errors.join('; '));
  console.log('PASS: real browser, 13 interactables, six seating/lying poses, shower, diagonal, weather, controls, screenshots');
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});