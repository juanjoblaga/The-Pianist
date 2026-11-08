#!/usr/bin/env python3
"""Reproducible removal of the painted front-door ghost in all five lighting plates.

Operates only on the staged assets for QA/Android builds. Original editable art,
the door jambs and mat, and all five exterior backgrounds remain untouched.
The game canvas scales 1536x1024 source art to 1536x899: masks MUST use the
source art's coordinates, or the actual door will be missed.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import sys

ASSETS = Path(sys.argv[1]) if len(sys.argv)>1 else Path('build-project/app/src/main/assets')
FRONT_DOOR = [(710,805),(728,804),(729,872),(740,895),(799,923),
              (799,944),(713,947),(709,902)]
FRONT_RIGHT_STUB = [(834,838),(850,836),(862,863),(862,880),(833,881)]
BATHROOM_LEAF = [(973,736),(1019,736),(1019,829),(973,829)]

def clone_mask(result, original, polygon, offset, blur=2.4, brightness=1.0):
    h,w=original.shape[:2]
    mask=Image.new('L',(w,h),0)
    ImageDraw.Draw(mask).polygon(polygon,fill=255)
    alpha=np.asarray(mask.filter(ImageFilter.GaussianBlur(blur)),dtype=np.float32)/255.0
    ys,xs=np.nonzero(alpha>0.001)
    if len(xs)==0:return
    y0,y1=int(ys.min()),int(ys.max())+1
    x0,x1=int(xs.min()),int(xs.max())+1
    yy,xx=np.mgrid[y0:y1,x0:x1]
    dx,dy=offset
    donor=original[np.clip(yy+dy,0,h-1),np.clip(xx+dx,0,w-1)].astype(np.float32)*brightness
    if polygon is FRONT_DOOR:
        # Re-create metal threshold where the ghost door hid it, using
        # undamaged portions of the existing sill in this same lighting plate.
        for y in range(897,924):
            row=(yy==y)&(xx<=795)
            if np.any(row):donor[row]=np.median(original[y,804:830],axis=0)
        plank=(yy>=924)&(yy<934)&(xx<=795)
        donor[plank]=original[yy[plank],np.clip(xx[plank]+70,0,w-1)]
        mat=(yy>=934)&(xx<=795)
        donor[mat]=original[yy[mat],np.clip(xx[mat]+43,0,w-1)]
    a=alpha[y0:y1,x0:x1,None]
    result[y0:y1,x0:x1,:]=result[y0:y1,x0:x1,:]*(1-a)+donor*a

for mode in ('sunrise','morning','afternoon','sunset','night'):
    path=ASSETS/f'light_{mode}.jpg'
    original=np.asarray(Image.open(path).convert('RGB'))
    if original.shape[:2]!=(1024,1536):raise ValueError((path,original.shape))
    result=original.astype(np.float32)
    # Copy uninterrupted wood planks from the same indoor light plate.
    clone_mask(result,original,FRONT_DOOR,(43,-180))
    clone_mask(result,original,FRONT_RIGHT_STUB,(43,-180))
    # Keep the independent earlier bathroom treatment.
    clone_mask(result,original,BATHROOM_LEAF,(-70,0),blur=2.2)
    Image.fromarray(np.uint8(np.clip(result,0,255)),'RGB').save(
        path,quality=94,subsampling=0,optimize=True)
    print('cleaned ghost entrance door:',mode)
