# The Pianist — Scene Architecture & Regression Log
Updated 8 November 2026 (review APK v0.6.4 / versionCode 33).

## Non-negotiable design rule
Any visual element that moves, changes with weather or time, can be interacted with, or should overlap a player must be an independent scene object/layer, not baked into a static background. Use the approved transparent-sky station master as the source of independent sky, scenery, tree, tram, shelter, furniture and foreground sprites. Keep all scene objects and hitboxes on a fixed 1536×899 coordinate system. No UI or characters painted into backgrounds.

## Approved work / preserve
- Apartment is approved: top-down layout, lighting, balcony props and railing, piano playing sprite/bench, dark-cushion sofa recline, bed with patterned duvet, shower exits, collisions, dialogues, HUD and controller customisation.
- New Islington shares the apartment's exact character sprite atlas and joystick/Interact; Travel Map remains a separate bottom-centre control. Walk through the apartment front door to travel automatically.
- New Islington background art is the detailed station with tree, chimney, lamp, shelter, bench, signs, tram and planters. Maintain consistent positions and proportions.
- Keep rain puddles/wet paving/reflections, settled snow on fixed ground and objects, attached snow on tree canopy, fog and day/night skies; do not leave snow on the moving tram roof.
- Three moving canopy sections rotate irregularly from pivots. Windy sway is noticeable; storms are much stronger with bend/recovery; tree trunk stays rooted.

## Failures to avoid (historical)
- Repainting and cropping 35 complete JPEG weather backgrounds produced rectangular sky edges, disconnected clouds, duplicated foreground and damaged plants.
- A transparent PNG created but not used by runtime is not a fix. Verify the runtime actually loads sky and object images separately.
- Modifying background art to hide a ghost door created visual remnants. Rebuild assets with proper object boundaries instead.
- A separate station character controller/atlas caused spinning character and different-sized HUD/buttons. Always reuse apartment sprites and control settings.
- Oversized station dialogue, repeated Travel Map/Interact controls and painting fake UI into scenery created confusion.
- Do not throw away approved sofa, bed, piano or apartment daytime fixes when updating the station.
- Including obsolete scene JPEGs, tree atlases and overlapping object masks duplicates objects and wastes APK space.

## v0.6.4 implementation
- Layer ordering: sky, cloud weather objects, transparent world, independent station objects, animated tree canopy, stationary weather surface overlays, player, foreground props, HUD.
- Source image: `new_islington_tram_hub_with_transparent_sky.png`, exported as `station_world.png` and 10 individual station objects, three canopy sprites, five sky sprites, seven cloud sprites and wet/snow/mist overlays.
- Runtime: `station-scene.js` + `station-positions.js` + updated `travel.js`. No legacy station JPEG loader.
- Package excludes 145 superseded station/weather/tree files; APK reduced from ~57.8 MB to ~16.2 MB. Apartment gameplay sprites preserved byte-for-byte apart from updated version text.
- Android review APK v0.6.4 has versionCode 33 and same v2 signing certificate as v0.6.3.
- Chromium checks passed for scenes, bench sit/stand, map, independent tram toggle, no JS errors. Android physical verification remains to be done.
- Limitations: parked tram is an independent object but is not animated yet. Empty background under tram is approximate; redraw track/grass before introducing tram motion. Some clouds are procedural and can later be replaced with higher-quality illustrated cloud objects.

## Release checklist
1. Begin from the latest complete working source and read this file before editing.
2. Inventory all assets. Remove unused assets only after verifying no runtime references remain.
3. Keep stable apartment artwork, sprite atlases, persistent game data, existing application ID and original signing certificate.
4. Run JS syntax checks and browser screenshots at 1536×899 across relevant weather/time combinations.
5. Toggle dynamic objects independently and ensure no duplicate baked silhouette appears.
6. Verify character motion/collision, bench/piano/sofa/bed/shower interactions, travel home ⇄ stop and Travel Map.
7. Compare daytime, night, rain, snow and storm visually: no rectangular sky seams; no frozen rain; no floating snow; no snow on tram roof; strong storm foliage gusts; all buttons single and functional.
8. Verify APK manifest versionName, monotonic versionCode, ZIP integrity, matching signing certificate and in-place install; distinguish Chromium tests from physical phone tests.

The fully editable v0.6.4 assets and source were delivered in a separate ZIP in the ChatGPT conversation; this documentation branch alone does not update the playable repository release.
