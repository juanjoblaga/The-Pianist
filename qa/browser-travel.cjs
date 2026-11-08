/* Browser E2E: apartment door -> station -> travel map -> home. */
const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs');fs.mkdirSync('qa/screenshots',{recursive:true});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1365,height:768},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto('http://127.0.0.1:8033/index.html?qa=1');
  await page.waitForFunction(()=>window.__pianistTest?.isReady(),{timeout:30000});
  await page.evaluate(()=>window.__pianistTest.setPlayer(760,794,'down'));
  // Real Android-style one-tap action, not test-helper navigation.
  await page.locator('#action').click();
  await page.waitForURL('**/travel.html',{timeout:10000});
  await pause(700);
  assert(await page.locator('#travelButton').isVisible());
  await page.screenshot({path:'qa/screenshots/15-new-islington-platform.png'});
  await page.locator('#travelButton').click();assert(await page.locator('#mapOverlay').isVisible());
  await page.screenshot({path:'qa/screenshots/16-travel-world-map.png'});
  await page.locator('#closeMap').click();assert(!(await page.locator('#mapOverlay').isVisible()));
  await page.goto('http://127.0.0.1:8033/travel.html?qa=1');
  await page.waitForFunction(()=>window.__travelTest?.getPlayer(),{timeout:10000});
  const start=await page.evaluate(()=>window.__travelTest.getPlayer());
  await page.keyboard.down('ArrowRight');await pause(250);await page.keyboard.up('ArrowRight');
  const end=await page.evaluate(()=>window.__travelTest.getPlayer());
  assert(end.x>start.x+10,'Player cannot walk along platform');
  await page.setViewportSize({width:844,height:390});
  await page.locator('#travelButton').click();
  assert(await page.locator('#closeMap').isVisible(),'Travel map cannot close on phone');
  await page.screenshot({path:'qa/screenshots/17-travel-map-landscape.png'});
  await page.locator('#returnHome').click();
  await page.waitForURL('**/index.html',{timeout:10000});
  assert(await page.locator('#game').count()===1,'Home button failed to return');
  assert.deepEqual(errors,[],'Browser errors: '+errors.join('; '));
  console.log('Travel Hub E2E passed');
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});