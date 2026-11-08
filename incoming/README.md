# The Pianist v0.6.5 APK delivery inbox

This is an isolated candidate branch. It does not change `main`, the original APK or installed saves.

## Exact source file required

Upload the **complete** binary source archive to this folder with this exact name:

`ThePianist_v0.6.5_Clean_Editable_Source.zip`

Expected SHA-256 (verified against the cleaned v0.6.5 archive):

`4e5e8f0044ad5d77850a2c7ae11aaa99775088ba116b9771ee18366a6a90726b`

The corresponding source comes from the completed ChatGPT v0.6.5 review, NOT the old baseline. It includes five station sky layers, seven cloud/weather layers, current player assets, all approved apartment artwork, eight approved character portraits, scripts, and QA. Thirty unused historical images (older sprite variants, baked door overlays and obsolete snow) have been removed. The build verifies the clean-asset manifest and will reject an archive that still includes them.

## Automatic APK build

A push to `incoming/ThePianist_v0.6.5_Clean_Editable_Source.zip` on this branch triggers [build-v065-apk.yml](../.github/workflows/build-v065-apk.yml).

The build checks the source ZIP integrity and its exact hash, validates the v0.6.5/code34 asset contract, unpacks the **original v0.4.5 Android signing baseline** from the repository, overlays the entire current game, builds the APK, checks package `com.thepianist.game` / versionCode 34 and compares its signer with the existing v0.6.4 certificate.

Certificate SHA-256 for approved v0.6.4, extracted from the APK signing block:

`be1e4567fe575d944364ac4d24274558d494d7bd5309fcf2bdd67d5b06af8176`

If any check fails, the action does not publish a candidate APK. When all pass, the resulting installable APK appears as a GitHub Actions artifact named `ThePianist-v0.6.5-signed-APK`.

## Security and acceptance

No signing files or passwords belong in this incoming archive. The existing baseline archive in this **public** repository contains legacy signing materials; treat that as an exposure to address without changing the phone's installed signing identity. The resulting APK remains a **phone-test candidate**, not an approved art release. The station tram underlay is unfinished and the revised sky/snow visuals require review; never silently merge into main.

Do not upload a file with the correct name but different contents: the SHA-256 check is intentional and fails closed.
