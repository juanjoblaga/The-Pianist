#!/usr/bin/env python3
"""Generate a tucked patterned duvet from the same indoor artwork for each time."""
from pathlib import Path
from PIL import Image
import numpy as np
import sys
ROOT=Path(sys.argv[1]) if len(sys.argv)>1 else Path('build-project/app/src/main/assets')
W,H=1536,899
x0,x1=994,1220
y0,y1=276,384
for mode in ('sunrise','morning','afternoon','sunset','night'):
    background=Image.open(ROOT/f'light_{mode}.jpg').convert('RGB').resize((W,H),Image.Resampling.BILINEAR)
    raw=np.asarray(background,dtype=np.uint8)
    h=y1-y0;w=x1-x0
    rgba=np.zeros((h,w,4),dtype=np.uint8)
    for local_y in range(h):
        yy=y0+local_y
        distance=abs(365-yy)
        phase=distance%82
        donor_y=365+(phase if phase<=41 else 82-phase)
        for local_x in range(w):
            xx=x0+local_x
            t=abs((xx-1107)/113)
            top=278.5+5.5*t*t
            at_top=min(1,max(0,(yy-top)/2.2))
            at_bottom=min(1,max(0,(380-yy)/21))
            at_side=min(1,max(0,(xx-x0)/3),max(0,(x1-xx)/3))
            alpha=at_top*at_bottom*at_side
            if alpha<=0:continue
            c=raw[donor_y,xx].astype(np.float32)
            if yy-top<5:c*=.88+min(1,(yy-top)/5)*.12
            rgba[local_y,local_x,:3]=np.clip(c,0,255).astype(np.uint8)
            rgba[local_y,local_x,3]=round(alpha*255)
    out=ROOT/f'bedcover_{mode}.png'
    Image.fromarray(rgba,'RGBA').save(out,optimize=True)
    print(mode,out.stat().st_size)
