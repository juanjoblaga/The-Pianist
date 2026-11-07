# The Pianist v0.4.5 — verified release checklist

## Browser/source checks performed
- [x] All official dialogue strings preserved exactly as supplied, including `dont`, `<3`, and no unapproved rewrites.
- [x] Eight approved, unchanged portrait originals from user's images included and loaded by dialogue ID.
- [x] Piano, sofa, bed, beanbag, balcony, front door, kitchen, mirror, shower, toilet, wardrobe actions/lines reachable via real in-game menus.
- [x] Decorative plants, intercom, dining table and coffee table removed from interactable object registry; bedroom window interaction removed.
- [x] Shower displays privacy mosaic within the actual tub bounds, after-action dialogue confirmed `Nice and clean` with player out of pose.
- [x] Bathroom mirror visible in bathroom above sink.
- [x] New world paintings use the approved fourth-floor building concept; no geometric tree/garden assets reintroduced.
- [x] Bottom camera view ends at entrance door; building façade does not reveal a second playable screen.
- [x] Six-frame cardinal walk including opposing left/right leg silhouettes, minor diagonal seam cleanup; original character head/clothing unchanged.
- [x] Silent four-frame piano hand/keyboard animation; no invented music.
- [x] Five time-of-day environments, seven weather modes exercised in the game renderer.
- [x] Room/solid geometry inspected and 11 key interactable approach coordinates independently verified passable.
- [x] No JavaScript page errors in actual browser render. `node --check` passes.
- [x] Same application ID and signing key as 0.4.4; versionCode increments from 17 to 18; no saved localStorage key changes.
- [x] ZIP integrity check passes.

## Requires GitHub Actions / physical Android verification
- [ ] `assembleDebug` compiles on installed Android SDK.
- [ ] APK installs over v0.4.4 and preserves stored layout/audio preferences.
- [ ] Phone-scale visual review of 6-frame sideways walking, diagonals, piano fingers, bathroom and weather.
- [ ] Play interactions using actual touch controls, including closed-dialogue/pose transitions and the entrance door boundary.

Note: no sofa reclining pose was reinstated. No external world/entrance scene exists yet.
