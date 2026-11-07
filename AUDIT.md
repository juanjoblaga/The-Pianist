# The Pianist — engineering and visual QA audit

## v0.5.1 follow-up: user screenshot review

The user reviewed gameplay captures and reported that the original 0.5.0 pass was NOT acceptable as a visual sign-off. Treat this list as more important than earlier generic "passes".

- **Sitting:** Common pose scales/anchors now live in `game-poses.js`. Adjust after screenshot review; never tweak pose sizes independently in scattered renderer conditions.
- **Sofa lying:** Restored as an explicit user request. Uses the approved idle side sprite rotated horizontally over the long sofa; button and safe stand exit regression tested.
- **Sofa exit:** In 0.5.0 furniture transition x/y travelled in a straight line through solids. In 0.5.1 entry/exit cross-fades between an actual passable interaction point and the furniture anchor. Standing returns to the exact position where the interaction started.
- **Piano playing:** Huge extended-arm atlas is disabled. Use restrained approved seated sprite (no fake moving fingers); original finger articulation still needs an appropriately authored sprite.
- **Bed lying:** Head moved to the pillows, and the torso is covered with the same lighting-specific white linen texture used on the bed plate. Check that it does not look like an upright cropped figure.
- **Shower exit:** Fixed staging at `(1060,720)` on clear bathroom floor. Browser checks both physical passability and the ability to walk away afterward.
- **Bathroom selection:** Direction-aware nearest targeting resolves mirror/toilet/shower and action button displays its selected target.
- **Outdoor lighting:** Nightly amber-lit windows were baked into all five original exterior art plates. Build derives daytime corrections for morning/afternoon and a milder sunrise. Night and sunset remain warm; original editable artwork stays unchanged.
- **Doors:** Upright procedural rotating additions removed, replaced by top-down hinge slabs. **Still not artistically finished:** old open-door triangles remain painted into the original light plates. Do not obscure them with crude inpainting; a true art-layer correction must be approved.
- **QA:** Browser regression asserts old sofa-table teleport is absent, sofa lying exists, shower exits are walkable, bathrooms select by facing, and night differs from day. Physical Android and human visual QA remain outstanding.

This review starts from the user's approved v0.4.5 ZIP, not a redesigned game. **Story and dialogue are owned by the user; this work changes technical infrastructure and repairs visual/interaction bugs only.**

## Findings and repairs

| Area | Found in v0.4.5 | 0.5.0 action | Verification |
| --- | --- | --- | --- |
| Bed — lying down | `drawReclining` referenced `walk_indoor`, which was never loaded, leaving the person invisible | Show the approved head/shoulders over pillow while torso is under duvet | Script regression + real browser pose/screenshot; subjective visual acceptance pending |
| Bed — sitting | Old code pasted an unrelated image strip over the sitter | Remove misplaced cover strip | Browser sitting screenshot and on-phone review |
| Sofa — sitting | Legs intruded into coffee-table space | Shorten visible seated height and move feet back onto sofa | Browser screenshot; real phone still needed |
| Sofa — lying | Previous poses had incorrect human anatomy | Remains **disabled**; never auto-restore rejected artwork | Script assertion |
| Balcony chair / beanbag | Seated sprites extended onto the glass railing | Adjust draw scale/anchor to sit on approved balcony furniture without relocating it | Browser pose screenshots and stand exit tests |
| Sofa–table walkway | Two colliders left only a 16px passage for an 18px foot diameter | Fine-tune collision rectangles (no furniture relocation) | Geometry + full reachable grid |
| Bedroom wall | Wall collision stopped too high, permitting wall crossing | Extend wall collision to painted wall end | Geometry negative assertions |
| Bedroom extra door | A separate fake oak leaf was drawn over existing architecture | Remove extra simulated leaf | Browser screenshot; manual review |
| Balcony slider | Old threshold image created a floating opaque square over living room | Replace with a thin translucent slider aligned to glass track | Browser scene screenshot |
| Shower | Previous stuck/wall issues | Reuse tested safe exit; keep shower mosaic and completion dialogue | Browser 5.2s shower test and exit test |
| Mirror, toilet, wardrobe | Existing interactions important to preserve | Keep icons/positions/dialogue | 13-object browser interaction tour + canonical text checks |
| Bedroom window | Physical obstruction made interaction impossible | Keep visible but not interactable | Interaction registry assertion |
| Doors / front entrance | No second outside scene has been approved | Preserve existing front-door interaction as disabled destination | Browser dialog and collision test |
| Rain / lighting | Prior sound and weather issues | Retain existing physical sound model, load only needed scenes, test all presets | Browser mode/UI checks; **audible quality not yet verified** |
| 8-way motion | Prior seam/arm issues | Retain approved walking atlases and test diagonal movement | Browser input plus atlas dimension tests; phone appearance review pending |
| Custom touch controls | Layout persistence required | Preserve `thepianist.controls.v1`; test size across reload | Browser persistence check; touch/drag physical QA pending |

## Editing/build architecture

- Original v0.4.5 is kept as an Android build/signing baseline.
- Working game definitions are in `editable/app/src/main/assets/game-config.js`.
- Collision, nearest object targeting and safe exits are isolated in `game-physics.js`, with unit tests independent of the render loop.
- Asset names and sprite atlas sizes are in `game-assets.js`. Every original scene/portrait/sprite is available under `editable/` for targeted changes.
- A dedicated browser simulation walks the scene, checks all 13 interactables, tests entering and leaving furniture poses, completes the shower, switches lighting/weather and verifies persisted controls. Screenshots are attached to CI artifacts.
- GitHub Actions validates JS, geometry, artwork coverage and browser behavior before compiling the APK.
- The preview keeps the Android app ID, old localStorage keys and original signing identity; it sets `versionCode 19` and `versionName 0.5.0`.
- The source export excludes duplicated signing configuration and keystore.

## Remaining acceptance gates

1. Inspect the latest browser screenshots to ensure the lying person, sitting pose, balcony slider and doors genuinely look natural.
2. Install the preview **over** the existing APK after backing up preferences, and confirm touch joystick/pointer capture/position, interaction button and safe-area layout.
3. Listen to rain, wind and storm audio on a real device; browser tests cannot judge sound quality or physical speaker output.
4. Confirm Android WebView performance and memory on the user's device, including fast environment switching and app background/resume.
5. Retain the approved pixel-art character proportions; do not add a sofa-lying sprite without an approved visual.

## Security (high priority)

The source repository is public and the pre-existing ZIP itself contains the app-signing keystore **and** the corresponding signing configuration. That is a security risk independent of this refactor. The user should consider making the repository private and deciding on a responsible signing strategy. Removing the file in a later commit alone does not erase the original blob or already-downloaded copies. Do not casually replace the signing certificate because that can prevent an Android update in place.
