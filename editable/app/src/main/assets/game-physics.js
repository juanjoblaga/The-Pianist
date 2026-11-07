/* The Pianist geometry engine. Pure/testable and independent of the canvas.
 * Coordinates use the same 1536x899 virtual stage as the painted apartment.
 * Actor collision is foot-based: the full sprite is visual, not a giant collider.
 */
(function(root, factory){
  const api=factory();
  root.ThePianistPhysics=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis, function(){
'use strict';
const vectors={down:[0,1],up:[0,-1],left:[-1,0],right:[1,0],
  'down-left':[-Math.SQRT1_2,Math.SQRT1_2],
  'down-right':[Math.SQRT1_2,Math.SQRT1_2],
  'up-left':[-Math.SQRT1_2,-Math.SQRT1_2],
  'up-right':[Math.SQRT1_2,-Math.SQRT1_2]};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function create(config,footRadius=9) {
  if(!config||!Array.isArray(config.rooms)||!Array.isArray(config.solids)||!Array.isArray(config.objects))throw new Error('Invalid world geometry');
  const R=footRadius,rooms=config.rooms,solids=config.solids,objects=config.objects;
  function inRoom(x,y){return Number.isFinite(x)&&Number.isFinite(y)&&rooms.some(([a,b,c,d])=>x>=a+R&&x<=c-R&&y>=b+R&&y<=d-R);}
  function overlaps(x,y,b){return x+R>b[0]&&x-R<b[2]&&y+R>b[1]&&y-R<b[3];}
  function passable(x,y){return inRoom(x,y)&&!solids.some(b=>overlaps(x,y,b));}
  function distanceToRect(x,y,b){const ax=clamp(x,b[0],b[2]),ay=clamp(y,b[1],b[3]);return [Math.hypot(ax-x,ay-y),ax-x,ay-y];}
  function nearest(x,y,dir='down'){
    const [fx,fy]=vectors[dir]||vectors.down;
    let best=null,bestScore=Infinity;
    for(const obj of objects){
      const [dist,dx,dy]=distanceToRect(x,y,obj.rect);
      if(dist>obj.reach)continue;
      // Direction matters EVEN when near two adjoining bathroom fixtures.
      // The old distance-only selection would choose the toilet while facing
      // the mirror, or the sink while facing the shower.
      let vx=dx,vy=dy,distToAim=dist;
      if(dist<1){
        vx=(obj.rect[0]+obj.rect[2])/2-x;
        vy=(obj.rect[1]+obj.rect[3])/2-y;
        distToAim=Math.hypot(vx,vy);
      }
      const dot=distToAim<.001?1:(vx*fx+vy*fy)/distToAim;
      if(dot<.28)continue;
      const score=dist+24*(1-dot);
      if(score<bestScore){best=obj;bestScore=score;}
    }
    return best;
  }
  function safeExit(target, fallback={x:730,y:570}){
    if(target && passable(target.x,target.y))return {x:target.x,y:target.y};
    const centre=target||fallback;
    // Outward search prefers nearby safe cells, but never exits into a wall.
    for(let radius=8;radius<=144;radius+=4){
      for(let angle=0;angle<48;angle++){
        const t=angle*Math.PI/24,x=centre.x+Math.cos(t)*radius,y=centre.y+Math.sin(t)*radius;
        if(passable(x,y))return {x,y};
      }
    }
    if(passable(fallback.x,fallback.y))return {x:fallback.x,y:fallback.y};
    for(let y=0;y<899;y+=12)for(let x=0;x<1536;x+=12)if(passable(x,y))return {x,y};
    throw new Error('No safe place to stand; room geometry is invalid');
  }
  return {R,rooms,solids,objects,inRoom,overlaps,passable,distanceToRect,nearest,safeExit};
}
return {create,vectors};
});
