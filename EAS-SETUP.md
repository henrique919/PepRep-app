# EAS / Expo GitHub setup (monorepo)

The Expo app lives in **`expo/`**, not the repo root.

## Required dashboard setting

1. Open your project on [expo.dev](https://expo.dev)
2. **Project → GitHub** (or Project settings → GitHub)
3. Set **Base directory** to:
   ```
   expo
   ```
4. Save, then open **Workflows** → Load ref `main` → run **Create Production Builds**

Without Base directory = `expo`, EAS looks at the repo root (no `app.json` there) and reports `Available profiles: []`.

## Files (must stay siblings under `expo/`)

- `expo/eas.json` — build profiles (`production`, `preview`, …)
- `expo/.eas/workflows/*.yml` — workflows
- `expo/app.json` — Expo app config

## Local CLI (from `expo/`)

```powershell
cd expo
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build -p android --profile production
```
