#!/usr/bin/env python3
"""Build truly transparent furniture cutouts from the approved apartment art.

A fixed silhouette mask reveals the same plant, table, chair and beanbag in
each light plate, without carrying back the old night-only balcony backdrop.
Only small RGBA overlays are generated; no runtime image pixel access.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import numpy as np
import sys
assets=Path(sys.argv[1]) if len(sys.argv)>1 else Path('editable/app/src/main/assets')
X0,Y0,X1,Y1=235,33,830,178
W,H=X1-X0,Y1-Y0
ref=np.asarray(Image.open(assets/'light_afternoon.jpg').convert('RGB').resize((1536,899),Image.Resampling.BILINEAR))[Y0:Y1,X0:X1].astype('float32')
alpha=np.zeros((H,W),dtype='float32')
def shape(fn,feather):
    cv=Image.new('L',(W,H),0);d=ImageDraw.Draw(cv);fn(d)
    return np.asarray(cv.filter(ImageFilter.GaussianBlur(feather)),dtype='float32')/255.
def circle(rect):
    return shape(lambda d:d.ellipse((rect[0]-X0,rect[1]-Y0,rect[2]-X0,rect[3]-Y0),fill=255),.8)
def poly(pts):
    return shape(lambda d:d.polygon([(x-X0,y-Y0) for x,y in pts],fill=255),.9)
def box(x0,y0,x1,y1):
    return shape(lambda d:d.rectangle((x0-X0,y0-Y0,x1-X0,y1-Y0),fill=255),.7)
r,g,b=[ref[:,:,i] for i in range(3)]
leaf_area=circle((237,34,329,112))
pot_area=circle((251,100,307,146))
foliage=np.clip((g-b-9)/18,0,1)*np.clip((g-31)/17,0,1)
pot=np.clip((r-g-12)/19,0,1)*np.clip((r-52)/30,0,1)
alpha=np.maximum(alpha,leaf_area*foliage)
alpha=np.maximum(alpha,pot_area*pot)
alpha=np.maximum(alpha,poly([(360,65),(440,65),(441,115),(359,115)]))
for rect in ((365,111,380,143),(422,112,436,143)):
    alpha=np.maximum(alpha,box(*rect))
for pts in (
    [(478,75),(493,77),(503,88),(504,111),(495,123),(478,115),(473,88)],
    [(449,109),(484,108),(492,121),(488,131),(451,128)],
    [(448,120),(460,120),(458,146),(449,148)],
    [(487,117),(501,118),(503,145),(493,146)]
):
    alpha=np.maximum(alpha,poly(pts))
alpha=np.maximum(alpha,circle((713,61,810,150)))
for mode in ('sunrise','morning','afternoon','sunset','night'):
    pic=np.asarray(Image.open(assets/f'light_{mode}.jpg').convert('RGB').resize((1536,899),Image.Resampling.BILINEAR))[Y0:Y1,X0:X1]
    rgba=np.dstack((pic,np.uint8(np.round(np.clip(alpha,0,1)*255))))
    dest=assets/f'balconyprops_{mode}.png'
    Image.fromarray(rgba,'RGBA').save(dest,optimize=True)
    print('Generated transparent balcony props',mode,dest.stat().st_size)
