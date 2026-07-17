# EAS / Expo GitHub setup (monorepo)

The Expo app lives in **`expo/`**.

## Dashboard: two settings that must both be right

### 1. Base directory = `expo`
Project → **GitHub** → **Base directory** → `expo` → Save.

Without this, builds say `Available profiles: []` (no `app.json` at repo root).

### 2. Workflows at repo root
Expo’s “Run workflow” UI looks for:

```
.eas/workflows/*.yml   ← at the GitHub repo root
```

Those files are at the repo root. App config stays under `expo/`:

| Path | Purpose |
|------|---------|
| `.eas/workflows/*.yml` | Discovered by Expo dashboard |
| `expo/.eas/workflows/*.yml` | Same file for CLI from `expo/` |
| `expo/eas.json` | Profiles when Base directory is `expo` |
| `eas.json` | Profiles fallback at repo root |

After changing Base directory: **Load** `main` again, then select **Create Production Builds**.

## Local CLI

```powershell
cd C:\Users\Harry\Projects\PepRep\PepRep-app\expo
npx eas-cli@latest workflow:run .eas/workflows/create-production-builds.yml
```

## Web export / hosting deploy

Always use the **project-local** Expo CLI (SDK 54 in `expo/node_modules`). A bare `npx expo` can pick up a different Expo from your home directory (e.g. `C:\Users\Harry\node_modules`) and fail static render with “Unable to resolve module expo-router”.

From `expo/`:

```powershell
npm run export:web
eas deploy
```

Or in one step:

```powershell
npm run deploy:web
```

Equivalents: `bun run export:web`, or `npx --no-install expo export --platform web`.

**Avoid** `npx expo export` while a different Expo version is installed under your user home. Optional hygiene: remove accidental `expo` / React Native deps from `C:\Users\Harry\package.json` so bare `npx expo` cannot hijack again (do not mass-delete home `node_modules` without checking other projects).
