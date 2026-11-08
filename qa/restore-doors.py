#!/usr/bin/env python3
"""Remove the entire triangular ghost entrance door, shadow and right tip.

All masks are in the approved plate's native 1536x1024 coordinates;
the canvas virtual resolution is a different height (899). Edit staged copies
only; keep the original decor, entrance mat and wall frames.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import numpy as np
import sys
assets=Path(sys.argv[1]) if len(sys.argv)>1 else Path('build-project/app/src/main/assets')
FRONT=[(710,805),(728,799),(744,810),(768,839),(799,870),(816,898),
       (821,925),(804,930),(795,942),(708,942)]
RIGHT=[(831,836),(850,835),(862,855),(864,879),(833,879)]
BATH=[(972,736),(1020,735),(1020,832),(972,832)]
def repair(image,polygon,kind):
    h,w=image.shape[:2]
    m=Image.new('L',(w,h),0)
    ImageDraw.Draw(m).polygon(polygon,fill=255)
    alpha=np.asarray(m.filter(ImageFilter.GaussianBlur(2.5)),dtype='float32')/255.
    y,x=np.nonzero(alpha>.001);y0,y1=y.min(),y.max()+1;x0,x1=x.min(),x.max()+1
    yy,xx=np.mgrid[y0:y1,x0:x1]
    if kind=='front':
        donor=image[np.clip(yy-171,618,799),np.clip(xx+96,815,934)].astype('float32')
        for row in range(904,935):
            here=yy==row
            if np.any(here):donor[here]=np.median(image[row,824:839],axis=0)
        mat=yy>934
        if np.any(mat):donor[mat]=image[yy[mat],np.clip(xx[mat]+36,740,846)]
    elif kind=='right':
        donor=image[np.clip(yy-151,0,h-1),np.clip(xx+38,0,w-1)].astype('float32')
    else:
        donor=image[yy,np.clip(xx-70,0,w-1)].astype('float32')
    return y0,y1,x0,x1,alpha[y0:y1,x0:x1,None],donor
for mode in ('sunrise','morning','afternoon','sunset','night'):
    path=assets/f'light_{mode}.jpg'
    image=np.asarray(Image.open(path).convert('RGB'))
    if image.shape[:2]!=(1024,1536):raise ValueError((path,image.shape))
    out=image.astype('float32')
    for name,poly in (('front',FRONT),('right',RIGHT),('bath',BATH)):
        y0,y1,x0,x1,a,donor=repair(image,poly,name)
        out[y0:y1,x0:x1]=out[y0:y1,x0:x1]*(1-a)+donor*a
    Image.fromarray(np.uint8(np.clip(out,0,255)),'RGB').save(
      path,quality=95,subsampling=0,optimize=True)
    print('Repaired physical entry door and matching scene',mode)
