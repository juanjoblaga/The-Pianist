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

Bed rest shows the approved character's head and shoulders above the cover. The torso is tucked under the duvet. Sofa reclining **must remain disabled** until a genuinely human-looking approved animation exists.

Shower privacy uses the existing opaque mosaic. Window art remains visible but the bedroom window is intentionally **not** interactable.

## Canonical compatibility constraints

- `com.thepianist.game` application ID and signing certificate cannot change in a normal update.
- Keep control preferences under `thepianist.controls.v1` and audio preferences under `thepianist.sound.v1`.
- Keep the original eight user-approved portrait PNGs.
- Do not add a second balcony view, geometric trees, an outside map, a fake entrance scene or an unapproved sofa-lying pose.
- Do not revise author-supplied dialogue text or punctuation.
- Do not ship automated CI success as proof that touch controls, sound or visual sprite quality were verified on an Android phone.

## Security issue (must address)

**The existing public v0.4.5 ZIP contains a signing keystore and a Gradle signing configuration with embedded credentials.** This was already present in the original public repository before the refactor. The editable-source overlay intentionally excludes any duplicate signing files from its new source bundle, but the existing public ZIP still exposes the signing credential.

Consider immediately changing the GitHub repository visibility to **private** and reviewing whether the existing signing identity is safe to continue using. Key rotation is not a trivial in-place Android update; do not change the installed app's signature without a deliberate migration plan. Rotating a key does not retract copies already downloaded.

## Tests: what they prove

Node geometry and asset tests are deterministic. The browser smoke test actually loads the apartment art and simulates movement, approaching 13 objects, lying/sitting, showering, weather, audio UI, controls and saved preferences. Screenshots are captured for review.

Manual physical-device checks are still required for real joystick thumb ergonomics, landscape sizing, music/audio quality, pixel-art appearance and Android installation/data retention.
