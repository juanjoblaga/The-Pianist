## v0.5.2 — proportionate poses and reproducible piano animation

- **Bed lying:** the face is now sampled from the same original 80×54 sprite proportionally (84×57 rendered), fixing the stretched/narrow head of v0.5.1.
- **Sofa lying:** clothes/legs and upright head are composed separately from the approved sprite, instead of rotating the face and eyes sideways. The head overlaps the torso rather than floating beside it.
- **Piano stool:** seated anchor (746,407) sits on the painted bench. The two hands reach the keyboard using four small bent-arm key-press poses; the exaggerated elongated-arm atlas and temporary fake wrist lines are not used.
- **Asset authoring:** `qa/generate-piano-frames.py` uses the right-facing approved `sitting_indoor.png` frame to make `piano_motion_v052.png` reproducibly before all tests and the APK build. Change the four elbow/wrist poses there rather than modifying unrelated motion code. The original sitting sprites and user-approved face remain unmodified.
- **Doors:** duplicate procedural overlays were removed. The large open panels remain baked into the approved original scene plates and need separate art-layer reconstruction. Don't mark the doors finished.
- **QA:** automated checks now enforce proportional bed head, keyboard and bench alignment, independent four-frame piano articulation, and run through a real screenshot-based bedroom, sofa and piano scene. Physical-device and visual acceptance remain necessary.

## v0.5.1 visual/interaction review (draft)

The app's user feedback identified defects that automated pass/fail scripts did not catch. This branch includes a reusable pose map (`game-poses.js`), natural floor-return transitions, a sofa reclining action, revised bed-head placement/sheet covering, safer shower staging, direction-aware bathroom targets with explicit action-button labels, and deterministically graded *exterior* daylight paintings.

The four-frame exaggerated piano-arm atlas is deliberately not used: the approved seated sprite replaces it, with understated movement. Genuine new finger-playing artwork still requires art direction. The upright baked-in entrance/bathroom door panels are still present in the original `light_*.jpg` plates: changing code-only rotating overlays cannot fully repair those paintings. **Do not claim the doors are artistically finished or merge without visual acceptance.**

# The Pianist — editable game source

**This branch is an engineering/QA preview of the original v0.4.5 game.** It does not change the user's story, approved portraits, apartment layout or spoken dialogue.

## What changed for easier future editing

The source of truth is now the `editable/` directory. The original v0.4.5 source ZIP remains as a **legacy Android signing baseline**, but it is no longer where gameplay or artwork is edited.

| File | Edit here for... |
| --- | --- |
| `editable/app/src/main/assets/game-config.js` | Furniture and action coordinates, room boundaries, collisions, seating/resting locations, and **user-approved dialogue** |
| `editable/app/src/main/assets/game-physics.js` | Reusable foot-based collision, directional approach detection, safe pose exits |
| `editable/app/src/main/assets/game-assets.js` | Canonical active sprite filenames, atlas dimensions and time-of-day artwork layers |
| `editable/app/src/main/assets/game.js` | Animation, drawing, controls, dialogue transitions, weather, sound, rendering |
| `editable/app/src/main/assets/index.html` + `style.css` | Game HUD, responsive landscape controls, dialogs, settings |
| `editable/app/src/main/assets/*.png, *.jpg` | Original approved sprites, portraits, interior scenes and weather/time assets |
| `qa/*.test.cjs` | Automated scene geometry, asset availability, dialogue preservation |
| `qa/browser-roam.cjs` | Real Chrome walkthrough, interactions, poses, controls, screenshot capture |

**Creative ownership:** Only the user supplies new characters, plot and dialogue. Never automatically invent dialogue or replace approved art in an engineering-only update.

## How to work safely

1. Start a new GitHub branch (e.g. `fix/sofa-seating`) from `main`. Never overwrite the original ZIP.
2. Edit individual files in `editable/` rather than rebuilding or uploading the ZIP.
3. Run the Node tests and real-browser smoke suite. Tests include 8-direction traversability to all 13 interaction regions, approved dialogue wording, pose exit safety, atlas coverage, five lighting presets and seven weather presets.
4. Build Android through the QA GitHub workflow. It overlays `editable/app/src/main` onto the original Android project and uses the existing signature and application ID.
5. Download the preview APK from Actions and **export an in-app backup before installing it over the current release**. Test on an actual landscape Android phone before merging.
6. Review the pull request, screenshot diffs and gameplay tests, then merge only a verified version.

## Key coordinate conventions

The world has a virtual **1536×899** canvas. All collision and interaction rectangles are in virtual world coordinates *after image scaling*. Only the player's **foot circle** is solid (9px radius), not the visual head and shoulders. A pathway must be wide enough for that circle and connected to the other rooms.

Bed rest shows the approved character's head and shoulders above the cover. The torso is tucked under the duvet. Sofa reclining was subsequently requested by the user in v0.5.1. It uses the approved existing sprite rotated to fit the sofa; the pose remains subject to the user's visual acceptance.

Shower privacy uses the existing opaque mosaic. Window art remains visible but the bedroom window is intentionally **not** interactable.

## Canonical compatibility constraints

- `com.thepianist.game` application ID and signing certificate cannot change in a normal update.
- Keep control preferences under `thepianist.controls.v1` and audio preferences under `thepianist.sound.v1`.
- Keep the original eight user-approved portrait PNGs.
- Do not add a second balcony view, geometric trees, an outside map, a fake entrance scene or a new sofa-lying sprite without user review.
- Do not revise author-supplied dialogue text or punctuation.
- Do not ship automated CI success as proof that touch controls, sound or visual sprite quality were verified on an Android phone.

## Security issue (must address)

**The existing public v0.4.5 ZIP contains a signing keystore and a Gradle signing configuration with embedded credentials.** This was already present in the original public repository before the refactor. The editable-source overlay intentionally excludes any duplicate signing files from its new source bundle, but the existing public ZIP still exposes the signing credential.

Consider immediately changing the GitHub repository visibility to **private** and reviewing whether the existing signing identity is safe to continue using. Key rotation is not a trivial in-place Android update; do not change the installed app's signature without a deliberate migration plan. Rotating a key does not retract copies already downloaded.

## Tests: what they prove

Node geometry and asset tests are deterministic. The browser smoke test actually loads the apartment art and simulates movement, approaching 13 objects, lying/sitting, showering, weather, audio UI, controls and saved preferences. Screenshots are captured for review.

Manual physical-device checks are still required for real joystick thumb ergonomics, landscape sizing, music/audio quality, pixel-art appearance and Android installation/data retention.

## v0.5.3 regression repairs (draft)

- Restores the original approved 3-frame reclining sprite from v0.4.6, now at a proportional 174×65 world-pixel footprint on the sofa. The original pillow and upward-looking face remain.
- Retains the known-good sofa sitting and bed-lying anchors from the v0.5.2 branch, rather than v0.4.6's regression.
- Makes the walkable corridor between sofa and coffee table less brittle while preserving solid furniture interiors. A real browser movement test crosses it.
- After showering, returns the character to (1028,719) on clear bathroom floor, then tests a full walk back into the living room.
- Adds qa/restore-doors.py: removes only the two triangular door leaves painted into the five interior light images, reusing same-scene floor texture. No original paintings in editable/ are destructively overwritten, and no unapproved replacement apartment is generated. Animated door mechanics still await separate art approval.
- Retains the approved five time-of-day exteriors, 13 interactions, authored text, weather, original input preferences, and 4-frame seated piano animation from v0.5.2.

Please review screenshots and test on a phone before merging this stacked draft PR into the release branch.

## v0.5.4 user review changes (draft)

- Expanded the sofa hotspot around all accessible sides; preserved the v0.5.3 seating and collision clearance.
- Slightly increased the approved natural reclining sprite (188×70) for character-scale consistency.
- Moved shower recovery to safe nearby bathroom coordinates (1062,718).
- Restored the plain white sheet over the head/neck in bed, matching each time-of-day plate without duplicating the blue duvet.
- Rebuilt the Help UI into a vertically scrollable phone-safe panel with pinned X and Continue buttons, backdrop tap and Escape closing.
- Restored the exact user-approved **six** piano-playing frames from the retained v0.4.6 sprite (existing Git blob), and moved playing position toward the centre of the piano keyboard / stool.
- Kept all 5 time-of-day exteriors, original dialogue, 13 interactions, saved control settings and Android app identity. Version 0.5.4 / code 23.

Browser test extended for mobile help menu and multiple sofa approach points. Draft pending physical phone approval.

## v0.5.5 — user phone feedback (draft)

- Patterned duvet reaches the character's neck using the *same* original teal-and-white diamond texture, blended seamlessly into the existing lower bedspread in all five lighting modes. No floating extra fabric.
- Same approved six-frame playing animation; reposition pianist 11 world pixels toward the keys and bench centre.
- Shower safely returns to nearby floor at (1250,751), with an uninterrupted walk west toward the bathroom doorway.
- Preserve all other v0.5.4 visual, interaction, movement, weather, dialogue, sound and Help fixes. Android v0.5.5 / code 24.
