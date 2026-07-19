# Smoke-test cloud backup without Metro QR

## Preferred: installable Android preview APK

1. Open the EAS build page (agent starts builds with  
   `npm run build:preview:android` from `expo/`).
2. When status is **finished**, tap **Install** / download the APK on your phone.
3. Open PepRep → Settings → Encrypted cloud backup.
4. Env vars are already baked from EAS `preview` environment — no `.env` / Metro needed.

Cloud Supabase URL/ref/anon key for this build come from EAS project env (not your laptop).

## If you must use Expo Go (iPhone)

LAN QR often fails (Wi‑Fi isolation, wrong port, stale Metro). Prefer tunnel:

```bash
cd expo
npm run start:tunnel
```

Then open the **exp://…** link Expo prints (or the tunnel URL) from the phone browser /
Expo Go — not a LAN `192.168.x.x` QR.

## Auth redirects (dashboard)

Confirm on `opbqlsmwljqkkdvguojh` → Authentication → URL Configuration:

- Site URL: `peprep://auth/callback`
- Additional: `peprep://**`, `exp://**`

Open the email link **on the phone**.
