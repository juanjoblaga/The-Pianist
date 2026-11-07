/* The Pianist — pose calibration in one place.
 * A pose changes its visual anchor, never the floor collision or furniture.
 * These coordinates can be adjusted after screenshot review without touching
 * dialog, controls, animation timing, or the collision engine.
 */
(function(root){
'use strict';
const poses={
  sofa:{
    sit:{visual:'sit',scale:.90},
    lie:{visual:'sofaLie'}
  },
  bed:{
    sit:{visual:'sit',scale:.90},
    lie:{visual:'bedLie'}
  },
  balchair:{sit:{visual:'sit',scale:.88}},
  beanbag:{sit:{visual:'sit',scale:.88,beanbag:true}},
  piano:{sit:{visual:'piano',scale:.93}},
  shower:{shower:{visual:'mosaic'}}
};
root.ThePianistPoses=poses;
if(typeof module!=='undefined'&&module.exports)module.exports=poses;
})(typeof window!=='undefined'?window:globalThis);
