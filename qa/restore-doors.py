#!/usr/bin/env python3
"""Remove two baked-in diagonal open-door renderings from the original
1536x1024 interior plates, preserving all furniture and lighting.

Each opening has a painted jamb/threshold, which is retained. Door triangles
inside the walkable passages are retextured from unobstructed floor in the same
lighting plate. Source editable/ artwork is never modified; only the staged
Android game's copies are changed, reproducibly from a fresh baseline.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import numpy as np

ASSETS=Path('build-project/app/src/main/assets')
MASKS=(
    ('front door',[(718,804),(728,806),(764,832),(783,845),(797,859),
                   (800,901),(719,901)],(92,-96)),
    ('front right stub',[(835,832),(840,830),(859,847),(860,872),(834,874)],(-55,-85)),
    ('bathroom door',[(973,736),(1019,736),(1019,829),(973,829)],(-70,0)),
)
for mode in ('sunrise','morning','afternoon','sunset','night'):
    path=ASSETS/f'light_{mode}.jpg'
    image=Image.open(path).convert('RGB')
    if image.size!=(1536,1024):raise ValueError((path,image.size))
    original=np.array(image)
    result=original.astype(np.float32)
    h,w=original.shape[:2]
    for name,polygon,(sx,sy) in MASKS:
        mask=Image.new('L',(w,h),0)
        ImageDraw.Draw(mask).polygon(polygon,fill=255)
        alpha=np.asarray(mask.filter(ImageFilter.GaussianBlur(2.2)),dtype=np.float32)/255.
        region=np.nonzero(alpha>.001)
        y0,y1=int(region[0].min()),int(region[0].max())+1
        x0,x1=int(region[1].min()),int(region[1].max())+1
        Y,X=np.mgrid[y0:y1,x0:x1]
        src=original[np.clip(Y+sy,0,h-1),np.clip(X+sx,0,w-1)]
        a=alpha[y0:y1,x0:x1,None]
        result[y0:y1,x0:x1,:]=result[y0:y1,x0:x1,:]*(1-a)+src*a
    Image.fromarray(np.uint8(np.clip(result,0,255)),'RGB').save(path,quality=94,subsampling=0,optimize=True)
    print('restored baked-in door leaves:',mode)
