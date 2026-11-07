/* The Pianist scene definitions. User-authored dialogue is canonically preserved.
 * Gameplay tests and the renderer both consume this single source of truth.
 * Dialogue should never be rewritten or automatically invented.
 */
(function(root){
'use strict';
const dialogueScript={
 piano:{text:'I should definitely practice.',portrait:'portrait_thoughtful.png'},
 sofa:{text:'Agggh... this sofa is truly the best <3',portrait:'portrait_blissful.png'},
 bed:{text:'Time to get some rest.',portrait:'portrait_pensive.png'},
 balcony:{text:"I don't use the balcony enough... I should come here more often.",portrait:'portrait_gentle.png'},
 beanbag:{text:'Comfy.',portrait:'portrait_gentle.png'},
 frontdoor:{text:"Let's go.",portrait:'portrait_gentle.png'},
 kitchen:{text:'I could go for some salmon. No time to cook though.',portrait:'portrait_serious.png'},
 mirror:{text:'Looking good! As always.',portrait:'portrait_confident.png'},
 shower:{text:'Maybe I need a shower',portrait:'portrait_pensive.png'},
 shower_done:{text:'Nice and clean',portrait:'portrait_blissful.png'},
 toilet:{text:'I dont need to use the toilet right now',portrait:'portrait_serious.png'},
 wardrobe:{text:'Just a bunch of clothes',portrait:'portrait_thoughtful.png'}
};

const rooms=[
 [235,203,986,765],      // living/kitchen
 [233,78,832,181],      // balcony deck
 [581,144,653,242],    // sliding door aperture
 [903,380,969,543],    // bedroom passage
 [920,144,1356,541],   // bedroom, ending at bathroom's north wall
 [944,615,1041,756],   // bathroom entrance
 [1000,570,1357,765],  // bathroom itself
 [708,729,853,868]     // entrance threshold, final edge of this scene
];

const solids=[
 [275,202,581,297],[273,281,370,379],// sectional sofa
 [442,344,540,395],                   // coffee table
 [246,270,280,472],                   // shelves
 [383,464,580,614],                   // dining table
 [772,215,874,456],                   // piano
 [238,477,281,672],[241,661,635,763],// counters and fridge
 [644,617,690,773],                   // intercom (decorative but solid)
 [993,202,1215,488],[1285,290,1357,536],[1219,203,1321,289], // bed and wardrobe
 [1096,586,1175,682],[1188,626,1268,739],[1278,570,1355,765], // sink, toilet, shower
 [357,54,430,135],[445,52,492,135],[722,50,805,145], // balcony furniture
 [230,13,838,52],                   // rear railing base
 [235,160,579,177],[655,160,832,177],// balcony glass base (only doorway open)
 [864,121,920,450],                 // bedroom dividing wall
 [928,548,960,621],                 // bathroom outside corner, narrow wall
 [964,544,1358,568],               // bathroom north wall
 [984,572,1001,624],                // bathroom door frame
 [918,120,1358,153]                // bedroom rear wall/window sill
];

const objects=[
 {id:'piano',name:'Piano',rect:[754,205,879,462],reach:82,poses:['sit']},
 {id:'sofa',name:'Sofa',rect:[258,186,595,392],reach:84,poses:['sit','lie']},
 // Coffee table, dining table, plants and intercom are DECORATIVE, by request.
 {id:'kitchen',name:'Kitchen',rect:[235,477,285,675],reach:49},
 {id:'kitchen2',name:'Kitchen counter',rect:[285,661,643,766],reach:48},
 {id:'bed',name:'Bed',rect:[990,202,1216,488],reach:58,poses:['sit','lie']},
 {id:'wardrobe',name:'Wardrobe',rect:[1285,292,1356,537],reach:52},
 {id:'mirror',name:'Mirror',rect:[1094,572,1176,646],reach:61},
 {id:'toilet',name:'Toilet',rect:[1188,626,1268,741],reach:54},
 {id:'shower',name:'Shower',rect:[1277,568,1358,766],reach:55,poses:['shower']},
 {id:'balcony',name:'Balcony',rect:[518,24,701,74],reach:62},
 {id:'balchair',name:'Balcony chair',rect:[430,50,507,151],reach:54,poses:['sit']},
 {id:'beanbag',name:'Balcony beanbag',rect:[719,49,811,157],reach:58,poses:['sit']},
 {id:'frontdoor',name:'Front door',rect:[707,774,851,907],reach:54}
];

const furniture={
 // Furniture anchors are virtual canvas pixels, not walking destinations.
 // Each seat returns the player to their actual pre-interaction floor position.
 sofa:{sit:{x:450,y:307,face:'down',exit:{x:465,y:426}},lie:{x:462,y:286,face:'right',exit:{x:465,y:426}}},
 bed:{sit:{x:1103,y:502,face:'down',exit:{x:1103,y:526}},lie:{x:1104,y:289,face:'up',exit:{x:1103,y:526}}},
 balchair:{sit:{x:470,y:149,face:'left',exit:{x:527,y:144}}},
 beanbag:{sit:{x:759,y:149,face:'down',exit:{x:681,y:144}}},
 piano:{sit:{x:740,y:382,face:'right',exit:{x:699,y:420}}},
 shower:{shower:{x:1315,y:671,face:'up',exit:{x:1062,y:718}}}
};

const config={dialogueScript,rooms,solids,objects,furniture};
root.ThePianistConfig=config;
if(typeof module!=='undefined' && module.exports)module.exports=config;
})(typeof window!=='undefined'?window:globalThis);
