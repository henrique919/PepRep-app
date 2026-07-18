# PepRep — Auth redirects for cloud backup (Expo)

Supabase default emails use a **magic/confirm link**, not a 6-digit OTP, unless you
customize the Magic Link template to include `{{ .Token }}` (needs custom SMTP).

PepRep completes sign-in when that link deep-links into the app at `…/auth/callback`.

## Dashboard

Open project `opbqlsmwljqkkdvguojh` → **Authentication → URL Configuration**.

**Owner updated 2026-07-19** (redirect / login URLs). Confirm these remain set:

1. **Site URL** (mobile-first):
   - `peprep://auth/callback`
2. **Additional Redirect URLs**:
   - `peprep://**`
   - `exp://**`
   - `http://localhost:8081/**` / `http://localhost:8082/**` (optional, web/dev)

Without these, the email link falls back to `http://localhost:3000` and shows a **blank page**.

## App flow

1. Settings → Encrypted cloud backup → enter email → **Email me a sign-in link**
2. On the **phone**, open the link from Mail (opens Expo Go / PepRep)
3. App calls `createSessionFromUrl` and shows “Signed in…”
4. Then set a **backup password** and upload (passphrase never uploaded)

## Rate limits

Supabase built-in mail is capped (~few emails/hour). A `429` means wait or add custom SMTP.
The app surfaces this in Settings status text.

## Local encrypted backup (separate)

The card above cloud backup is **password-only** — no email. It writes a file and opens
the system share sheet (Files / Drive). Dismissing the share sheet is OK; the file was
still created. RNG uses `expo-crypto` on Hermes.
