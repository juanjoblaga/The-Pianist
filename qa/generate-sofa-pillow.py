#!/usr/bin/env python3
"""Prepare dark cushion sprite OFFLINE, not through WebView canvas.getImageData."""
from pathlib import Path
from PIL import Image
import numpy as np
import sys
assets=Path(sys.argv[1]) if len(sys.argv)>1 else Path('editable/app/src/main/assets')
src=np.array(Image.open(assets/'sofa_lie_v053.png').convert('RGBA'),copy=True)
assert src.shape==(96,720,4)
for f in range(3):
    area=src[58:95,f*240+164:f*240+238]
    r,g,b,a=[area[:,:,i].astype('int16') for i in range(4)]
    pale=(a>=7)&(r>89)&(g>85)&(b>81)&(abs(r-g)<31)&(abs(g-b)<33)
    t=np.clip(((r+g+b)/3-164)*.24,-15,22)
    for i,c in enumerate((42,45,67)):
        area[:,:,i]=np.where(pale,np.clip(np.round(c+t),0,255),area[:,:,i]).astype('uint8')
Image.fromarray(src,'RGBA').save(assets/'sofa_rest_dark_v059.png',optimize=True)
print('Generated Android-safe reclining pillow:',assets)
