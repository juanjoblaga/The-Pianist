#!/usr/bin/env python3
"""The Pianist v0.6.6: non-destructive atmosphere/collision polish.

Apply to the extracted v0.6.5 CLEAN source only. No signing keys, game data,
approved artwork or dialogue changes. Uses only numpy and Pillow.
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

root = Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
assets = root / 'app/src/main/assets'
W, H = 1536, 899
rng = np.random.default_rng(6606)
X = np.arange(W, dtype=np.float32)[None, :]
Y = np.arange(H, dtype=np.float32)[:, None]


def smooth(lo, hi, z):
    q = np.clip((z-lo)/(hi-lo), 0, 1)
    return q*q*(3-2*q)


def save_rgba(name, arr):
    Image.fromarray(np.uint8(np.clip(arr, 0, 255)), 'RGBA').save(assets/name, optimize=True)


def soft_noise(seed=0):
    r = np.random.default_rng(6606+seed)
    arr = np.zeros((H, W), np.float32)
    for grid, weight in ((48, .50), (110, .29), (290, .16), (600, .05)):
        sh = (max(3, round(H/grid)), max(3, round(W/grid)))
        a = (r.random(sh)*255).astype(np.uint8)
        scaled = np.asarray(Image.fromarray(a, 'L').resize((W, H), Image.Resampling.BICUBIC)).astype(np.float32)
        arr += weight*(scaled-127.5)/64
    return np.clip(arr, -1.7, 1.7)


# 1) Cloud source edges become periodic in alpha AND premultiplied colour.
# This prevents moving textures creating rectangular seams when repeated.
# An extended feather also prevents low cloud fog banks from ending in a strip.
for weather in ('sunny','cloudy','windy','foggy','rainy','storm','snowy'):
    file = assets/f'station_clouds_{weather}.png'
    raw = np.array(Image.open(file).convert('RGBA'), np.float32)
    alpha = raw[:,:,3:4]/255
    premul = raw[:,:,:3]*alpha
    # Fade only near the sky/world transition; retain painted cloud volume.
    yfade = (1-smooth(335 if weather=='foggy' else 350, 428, Y))[:,:,None]
    alpha *= yfade
    premul *= yfade
    # Edge repair uses a textured, continuous cloud parcel sampled from the
    # middle of the image, not a constant per-row edge colour (which creates
    # visible horizontal streaks). The two sides meet at one shared sample.
    k = 215
    center = W//2
    original_a = alpha.copy()
    original_rgb = premul.copy()
    for i in range(k):
        edge_weight = 1-float(smooth(0,k,i))
        left, right = i, W-1-i
        alpha[:,left,:] = original_a[:,center+i,:]*edge_weight + original_a[:,left,:]*(1-edge_weight)
        alpha[:,right,:] = original_a[:,center-i,:]*edge_weight + original_a[:,right,:]*(1-edge_weight)
        premul[:,left,:] = original_rgb[:,center+i,:]*edge_weight + original_rgb[:,left,:]*(1-edge_weight)
        premul[:,right,:] = original_rgb[:,center-i,:]*edge_weight + original_rgb[:,right,:]*(1-edge_weight)
    rgb = np.where(alpha>1e-5, premul/np.maximum(alpha,1e-5), 0)
    out = np.concatenate((rgb,alpha*255),axis=2)
    save_rgba(file.name,out)
    # A single pixel on either edge must match for a genuinely periodic layer.
    image = np.array(Image.open(file))
    assert np.max(np.abs(image[:,0,:].astype('i2') - image[:,-1,:].astype('i2'))) <= 1, weather

# 2) Fog is a continuous softly modulated field, not elliptical flat strips.
n = soft_noise(51)
fog = (
    .075*np.exp(-((Y-355)/144)**2/2) +
    .145*np.exp(-((Y-514)/122)**2/2) +
    .037*np.exp(-((Y-620)/164)**2/2)
)
fog = fog * (1+.12*n + .055*np.sin(X/190+Y/121))
fog *= smooth(125,310,Y)*(1-smooth(685,878,Y))
fog_rgba = np.empty((H,W,4),np.uint8)
fog_rgba[:,:,:3] = [195,209,220]
fog_rgba[:,:,3] = np.uint8(np.clip(fog,0,.23)*255)
save_rgba('station_weather_mist.png',fog_rgba)

# 3) Puddles as irregular, blurred, subdued water reflections. No outlined
# ellipse shapes and no large rectangular wet patch or alpha region edges.
noise = soft_noise(66)
base = .008*smooth(595,850,Y)  # no rectangular onset
water = np.broadcast_to(base,(H,W)).copy()
silver = np.zeros((H,W),np.float32)
for cx,cy,rx,ry,k in [(295,719,133,15,.13),(780,769,185,18,.17),
                         (1080,728,105,13,.105),(520,799,83,12,.085)]:
    u=(X-cx)/rx
    v=(Y-cy)/ry
    warped=u*u*(1+.17*np.sin(X/36+Y/53)) + (v+.12*np.sin(X/48+Y/84))**2
    plume=1-smooth(.34,1.33,warped + .085*noise)
    water += k*plume
    silver += .037*plume*np.clip(.5+.5*np.sin((X+Y*.3)/54),0,1)
water *= smooth(645,700,Y)
water=np.clip(water,0,.22)
wet_rgba=np.empty((H,W,4),np.uint8)
# Cold-grey reflective values, subtly lighter where stray sky reflections fall.
wet_rgba[:,:,0] = np.uint8(np.clip(78+silver*470+noise*2,0,255))
wet_rgba[:,:,1] = np.uint8(np.clip(105+silver*470+noise*2,0,255))
wet_rgba[:,:,2] = np.uint8(np.clip(124+silver*520+noise*2,0,255))
wet_rgba[:,:,3] = np.uint8(water*255)
save_rgba('station_weather_wet.png', wet_rgba)

# 4) Patchy winter deposition: avoid a continuous white pavement sheet.
# Scatter only subdued frost on natural surfaces and pavement seams.
n1 = soft_noise(83)
n2 = soft_noise(86)
fleck = smooth(-.36,.94,.65*n1+.35*n2)
park = smooth(467,530,Y)*(1-smooth(582,660,Y))
platform = smooth(662,770,Y)
# Winter frost clusters are intentionally discontinuous rather than banded.
platform_patch = np.clip(fleck-.41,0,1)**1.5
park_patch = np.clip(fleck-.27,0,1)**1.1
snow_a=(.15*park_patch*park+.12*platform_patch*platform)
# Compacted path near the entrance, where footprints expose wet slabs.
trampled=np.exp(-((X-777)/400)**2/2)*smooth(681,800,Y)
snow_a*=(1-.50*trampled)
snow_rgba=np.empty((H,W,4),np.uint8)
snow_rgba[:,:,:3]=[229,239,246]
snow_rgba[:,:,3]=np.uint8(np.clip(snow_a,0,.22)*255)
save_rgba('station_weather_snow_ground.png',snow_rgba)

# No straight, two-pixel snow bars spanning 200-500 pixels. Broken specks
# settle on small ledges and canopy edges, NOT the full width of the scene.
accents=Image.new('RGBA',(W,H),(0,0,0,0))
d=ImageDraw.Draw(accents,'RGBA')
for x1,x2,yy,count in ((166,275,369,32),(308,718,415,115),
                       (890,923,243,13),(976,1096,288,30)):
    for _ in range(count):
        px=int(rng.uniform(x1,x2));py=int(yy+rng.uniform(-1,2))
        width=int(rng.integers(1,5))
        d.line((px,py,px+width,py),fill=(234,242,249,int(rng.integers(40,129))),width=1)
accents=accents.filter(ImageFilter.GaussianBlur(.55))
accents.save(assets/'station_weather_snow_accents.png',optimize=True)

foreground=Image.new('RGBA',(W,H),(0,0,0,0))
d=ImageDraw.Draw(foreground,'RGBA')
for _ in range(510):
    px=float(rng.choice([rng.uniform(0,454),rng.uniform(1036,1535)]))
    py=float(rng.uniform(730,897))
    r=float(rng.uniform(.45,1.35))
    d.ellipse((px-r,py-r,px+r,py+r),fill=(242,247,252,int(rng.integers(28,97))))
foreground.save(assets/'station_weather_snow_foreground.png',optimize=True)

# 5) Fence is the REAR boundary of the walkable platform. Foot position
# cannot move into/through the railing; character can still interact with
# benches, signs and tram from the proper side of the fence.
travel = assets/'travel.js'
s = travel.read_text()
old = 'function canWalk(x,y){if(x<76||x>1461||y<618||y>817)return false;'
new = ('function canWalk(x,y){'
       '// The back platform railing is impassable (foot position). '
       'Do not allow stepping into shelter/fence/track art.\n'
       ' if(x<76||x>1461||y<692||y>817)return false;')
assert s.count(old)==1,'Navigation source changed; review before patching'
s=s.replace(old,new).replace('New Islington v0.6.5','New Islington v0.6.6')
travel.write_text(s)

# Version all embedded/runtime source metadata; do not change package ID,
# app signing, stored progress keys or the dialogues.
for f in (root/'VERSION.json',assets/'VERSION.json'):
    meta=json.loads(f.read_text())
    assert meta['versionName']=='0.6.5' and meta['versionCode']==34
    meta['versionName']='0.6.6';meta['versionCode']=35
    meta['baseVersion']='0.6.5'
    meta['status']='Signed Android phone-test candidate; physical device testing pending'
    meta['changes']=['Seam-free moving weather clouds','Continuous fog and smooth rain reflections',
                     'Organic restrained snow without accumulation bars',
                     'Platform fence movement boundary fixed at foot level']
    f.write_text(json.dumps(meta,indent=2)+'\n')

p=root/'app/build.gradle'
s=p.read_text()
assert re.search(r'\bversionCode\s+34\b',s)
p.write_text(re.sub(r'\bversionCode\s+34\b','versionCode 35',s).replace("versionName '0.6.5'","versionName '0.6.6'"))
for page in ('index.html','travel.html'):
    p=assets/page
    s=p.read_text()
    assert '0.6.5' in s,page
    p.write_text(s.replace('0.6.5','0.6.6'))
# Keep CI's existing source integrity contract runnable with the new version.
p=root/'qa/verify_integrity.py'
s=p.read_text()
s=s.replace("expected['versionName']=='0.6.5' and expected['versionCode']==34", "expected['versionName']=='0.6.6' and expected['versionCode']==35")
s=s.replace("'versionCode 34'", "'versionCode 35'").replace('APARTMENT · 0.6.5','APARTMENT · 0.6.6')
p.write_text(s)
# Two additional regression gates that catch this release's actual faults.
assert 'y<692' in travel.read_text()
for w in ('sunny','cloudy','windy','foggy','rainy','storm','snowy'):
    a=np.asarray(Image.open(assets/f'station_clouds_{w}.png'))
    assert abs(a[:,0,:].astype(int)-a[:,-1,:].astype(int)).max()<=1
assert np.max(np.array(Image.open(assets/'station_weather_wet.png'))[:,:,3])<65
print('v0.6.6: periodic cloud edges, diffuse fog, soft puddles, broken snow and rear-fence collision PASS')
