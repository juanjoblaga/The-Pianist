# The Pianist — Android apartment game

The current approved update is **v0.4.6 (versionCode 19)**.

The project is distributed as a complete Android source archive. The v0.4.6
release restores lying on the sofa with a natural ceiling-facing resting pose,
adds the approved six-frame piano performance animation, and corrects sitting
positions and stand-up paths. The original apartment artwork, dialogue,
saved-data keys, application ID and signing identity are preserved.

The existing **Build The Pianist APK** GitHub Actions workflow can build the
latest source ZIP. Use Android's in-place Update installation; do not uninstall.

The new source archive SHA-256 is:
`0108cf15aa60b0cf8caad4d2f383e81a199622e94b35b0ec38788fb4c6ec0cbc`

The `publish-v046.yml` workflow reconstructs the verified upload from staged
binary parts, commits the source archive to this repository and builds a
signed APK as an Actions artifact.
