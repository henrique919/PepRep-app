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
