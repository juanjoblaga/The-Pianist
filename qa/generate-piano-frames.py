#!/usr/bin/env python3
"""Generate four natural piano hand poses from the approved seated sprite.

The original sitting_indoor right-facing frame is the body reference.
This script retains head, torso, legs, shirt and skin palette; only the two
forearms are rebuilt as short, bent, keyboard-facing limbs. It never stretches
a detached hand across the scene or scales the whole torso differently.
Run before asset regression tests and before building the APK.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

assets=Path("editable/app/src/main/assets")
original=Image.open(assets/"sitting_indoor.png").convert("RGBA")
assert original.size==(512,170), "Approved sitting atlas dimensions changed"
source=original.crop((256,0,384,170))
clean=source.copy()
px=clean.load()
mask=Image.new("L",(128,170),0)
skin=mask.load()
for y in range(100,124):
    for x in range(45,101):
        r,g,b,a=px[x,y]
        if a>100 and r>120 and r>g+14 and g>b+19 and g>58:
            skin[x,y]=255
mask=mask.filter(ImageFilter.MaxFilter(3))
for y in range(99,124):
    for x in range(44,100):
        if mask.getpixel((x,y))>128:
            px[x,y]=(0,0,0,0)

frames=[]
for n in range(4):
    frame=clean.copy()
    d=ImageDraw.Draw(frame)
    def sleeve(points,width):
        d.line(points,fill=(27,25,30,255),width=width,joint="curve")
        d.line(points,fill=(50,44,51,255),width=width-3,joint="curve")
    def forearm(points):
        d.line(points,fill=(75,44,42,255),width=8,joint="curve")
        d.line(points,fill=(228,127,89,255),width=6,joint="curve")
        d.line([(x,y-1) for x,y in points],fill=(255,161,112,255),width=3,joint="curve")
    # Shirt sleeves and bent elbows are aligned to the original shoulders.
    sleeve([(70,96),(83,106)],10)
    sleeve([(50,101),(64,115)],13)
    # Independent wrists alternate short up/down movements over the keybed.
    far_y=99+n//2
    near_y=108+n%2
    forearm([(82,106),(96,102),(109,far_y)])
    forearm([(64,115),(82,112),(99,near_y)])
    for x,y in [(109,far_y),(99,near_y)]:
        d.ellipse((x-2,y-3,x+7,y+4),fill=(251,159,110,255),
                  outline=(105,65,57,255),width=1)
        d.line([(x+5,y-1),(x+9,y)],fill=(255,185,132,255),width=2)
    frames.append(frame)

atlas=Image.new("RGBA",(512,170),(0,0,0,0))
for i,frame in enumerate(frames):
    atlas.paste(frame,(128*i,0))
dest=assets/"piano_motion_v052.png"
atlas.save(dest,optimize=True)
print("Generated",dest,"from approved sitting_indoor atlas",atlas.size)
