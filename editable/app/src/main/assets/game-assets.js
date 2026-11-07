/* Editable registry of artwork, sprite sheets, and lighting assets.
 * When replacing an approved sprite, update one entry and run QA.
 * All paths are local, offline and relative to the Android assets folder.
 */
(function(root){
'use strict';
const catalog={
 modes:['sunrise','morning','afternoon','sunset','night'],
 modeLayers:['world','light'],
 weather:['sunny','cloudy','foggy','rainy','snowy','storm','windy'],
 sprites:{
  walk:'walk_cycle_v045',
  idle:'idle_indoor',
  diagonalWalk:'diagonal_walk_v045',
  sit:'sitting_indoor',
  beanbagSit:'beanbag_clean_v042',
  piano:'piano_play_v045',
  pianoMotion:'piano_motion_v054',
  sofaRest:'sofa_lie_v053',
  duvet:'duvet_foreground'
 },
 atlas:{
  idle:{columns:4,rows:1,width:80,height:112},
  walk:{columns:6,rows:4,width:80,height:112},
  diagonalWalk:{columns:4,rows:4,width:80,height:112},
  sit:{columns:4,rows:1,width:128,height:170},
  beanbagSit:{columns:4,rows:1,width:128,height:170},
  piano:{columns:4,rows:1,width:128,height:170},
  pianoMotion:{columns:6,rows:1,width:128,height:170},
  sofaRest:{columns:3,rows:1,width:240,height:96}
 }
};
catalog.persistentAssets=Object.values(catalog.sprites);
root.ThePianistAssets=catalog;
if(typeof module!=='undefined'&&module.exports)module.exports=catalog;
})(typeof window!=='undefined'?window:globalThis);
