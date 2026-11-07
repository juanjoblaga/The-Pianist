#!/usr/bin/env python3
"""Correct the *exterior* daylight plates; v0.4.5 baked night lamps into every world image.

Apply only to build-project/app/src/main/assets/world_*.jpg, not to original
artwork in editable/. Interior light_*.jpg stays untouched. Reproducible,
idempotent per clean source extraction; night/sunset retain their warmer scene.
"""
from pathlib import Path
import numpy as np
from PIL import Image

ASSETS=Path('build-project/app/src/main/assets')
for mode in ('sunrise','morning','afternoon'):
    path=ASSETS/f'world_{mode}.jpg'
    original=np.asarray(Image.open(path).convert('RGB'),dtype=np.float32)
    r,g,b=original[:,:,0],original[:,:,1],original[:,:,2]
    luminance=.25*r+.63*g+.12*b
    # Stone should appear sunlit, rather than deep orange night-lit.
    neutral=original*.62+luminance[:,:,None]*.38+np.array([13.,17.,24.])
    foliage=np.clip((g-r+10)/40,0,1)*np.clip((g-b)/45,0,1)
    neutral=neutral*(1-foliage[:,:,None]*.4)+original*foliage[:,:,None]*.4
    # Detect the saturated golden pixels baked into lit windows and street lamps.
    # Convert those to diffuse daylight window reflections while maintaining
    # texture/geometry. We do not recolor the independent interior art plates.
    glow=np.clip((r-g-30)/65,0,1)*np.clip((g-b-20)/62,0,1)*np.clip((r-150)/90,0,1)
    glow=np.power(glow,.56)
    cool=np.stack([luminance*.65+24,luminance*.77+30,luminance*.84+41],axis=-1)
    amount=.96 if mode in ('morning','afternoon') else .54
    alpha=np.clip(glow*amount,0,1)[:,:,None]
    corrected=neutral*(1-alpha)+cool*alpha
    if mode=='sunrise':corrected=corrected*.83+original*.17
    Image.fromarray(np.uint8(np.clip(corrected,0,255)),'RGB').save(path,quality=92,optimize=True)
    print('graded exterior',mode,'dims',corrected.shape[:2])
