# Store screenshot generator

Produces the six 6.9-inch App Store frames (1320×2868 PNG, RGB, no alpha) in
`docs/store/screenshots/`, following the sequence and art direction in the
2026-07-19 design audit: exact draw → visible math → vials → today → history →
privacy. Real UI, fictional data (BPC-157 / TB-500 demo profile seeded through
the app's own storage format), PepRep type and palette.

> **Before submission:** these frames are captured from the Expo *web* export,
> which renders the same components as native but is not the shipped binary.
> Re-run the capture against real device/simulator screenshots of the final
> build (drop replacements into `store-raw/` naming them `1-result.png` …
> `6-settings.png` and re-run only the composition), or at minimum review each
> frame against the native build before uploading.

## Usage

```bash
cd expo && npx expo export --platform web        # build dist/
node tools/store-screenshots/serve-dist.js &      # serves dist on :4173 with route fallbacks
npm i playwright-core                             # anywhere on PATH for the script
node tools/store-screenshots/capture.js           # seeds, captures, composes
```

Outputs land in `store-raw/` (uncomposed 390×844@3x captures) and
`store-frames/` (final 1320×2868 frames) next to the script; copy frames to
`docs/store/screenshots/`. The script expects the Chromium binary at
`/opt/pw-browsers/chromium` — point `executablePath` at any local Chromium
otherwise, and adjust the hashed font filenames if the export regenerates them.
