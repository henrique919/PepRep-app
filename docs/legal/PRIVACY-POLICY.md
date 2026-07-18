# PepRep Privacy Policy (draft)

**Status:** Draft for the owner to host and publish.  
**TODO (owner):** Host this page at a public HTTPS URL, then paste that URL into Apple App
Store Connect and Google Play Console data-safety / privacy fields. Do not invent a URL here.

**Applies to:** PepRep mobile app v1.0.0 (`com.henrique919.peprep`)  
**Last updated:** 2026-07-18

## Summary

PepRep is a **local-first measurement and personal record-keeping** tool. In v1 it does **not**
create accounts, does **not** include analytics or advertising SDKs, and does **not** transmit
your vials, doses, plans, or history to PepRep or any third party as part of normal use.

## What PepRep stores

On your device only (app storage), PepRep may store:

- Vial records you enter (name, amounts, optional lot / expiry / notes)
- Dose / event history you log
- Plans and schedules you define
- Local reminder settings you create
- App preferences (including onboarding / safety acknowledgement version)

Inventory remaining is derived from an append-only local ledger. PepRep does not sell or share
this data.

## What PepRep does **not** collect by default (v1)

- No analytics, crash-reporting, or advertising identifiers sent by PepRep
- No automatic background sync
- No “Ask” / AI cloud feature in the v1 build (disabled; no AI SDK in the binary)

## Optional encrypted cloud backup (only if enabled in your build)

If the build includes Supabase configuration for PepRep project `opbqlsmwljqkkdvguojh`:

- You may opt in with **passwordless email** (one-time code).
- PepRep uploads only a **password-encrypted backup file** you create — not your passphrase,
  not a plaintext database.
- Supabase stores account email + ciphertext object + non-health manifest metadata.
- Local calculation, logging, and file backups work without an account.
- You can delete individual cloud backups and sign out from Settings.

Until that configuration is present, cloud backup UI does not appear and nothing is uploaded.

## Notifications

Reminders use **local notifications** scheduled on your device. Notification content is not
sent to a PepRep server.

## Export and encrypted backups

- **Plaintext export** (CSV/JSON): created only when you choose Export. Files are unencrypted;
  you control where they are shared (Files, Drive, email, etc.).
- **Encrypted backup**: created only when you choose Create encrypted backup. The file is
  password-protected on device (AES-GCM). PepRep does not upload it; you choose where to save
  or share it. Restore requires the password and replaces local PepRep data on that device
  after confirmation.

These are **user-controlled** off-device copies, not PepRep-operated cloud sync.

## Deleting your data

Use **Settings → Erase all data** to remove PepRep records from the device. Uninstalling the
app also removes local app storage (subject to OS behavior). Encrypted backups or exports you
previously saved elsewhere must be deleted by you from those locations.

## Children’s privacy

PepRep is not directed at children. Do not use the app to store data about anyone who cannot
consent to local record-keeping under applicable law.

## Medical disclaimer

PepRep is a measurement instrument. It is **not medical advice** and does **not** recommend
doses, schedules, or treatments. You are responsible for your own decisions and for verifying
every result.

## Changes

If this policy changes materially, we will update the “Last updated” date on the hosted page.
App safety acknowledgement copy is versioned in the app and may re-prompt when it changes.

## Contact

**TODO (owner):** Add a support email or contact form URL here before store submission.
