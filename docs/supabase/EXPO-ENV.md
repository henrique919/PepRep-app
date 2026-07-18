# PepRep — Expo / EAS env for optional cloud backup

Not a Render-style runtime env. `EXPO_PUBLIC_*` values are inlined into the JS
bundle at `expo start` / EAS Build time.

## Local (already set)

File: `expo/.env` (gitignored). Restart Metro after changes:

```bash
cd expo
npx expo start -c
```

## EAS (set 2026-07-18 on `@henrique919/peprep-app`)

Project env vars (all three environments: development, preview, production):

| Name | Visibility |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | plaintext |
| `EXPO_PUBLIC_SUPABASE_PROJECT_REF` | plaintext |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | sensitive |

`expo/eas.json` profiles pin `environment` so builds pick the matching set.

```bash
cd expo
eas build --profile preview    # uses preview env
eas build --profile production # uses production env
```

Dashboard: https://expo.dev/accounts/henrique919/projects/peprep-app/environment-variables

## Local-only builds

Unset / omit the three vars (or delete `expo/.env`) → cloud backup UI stays hidden.
Never put `service_role` in any of these.
