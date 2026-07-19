# PepRep Privacy Policy

**Status:** Published at `https://peprep.co/privacy`; final legal-owner review remains recommended.

**Applies to:** PepRep mobile app v1.0.0 (`com.henrique919.peprep`)  
**Last updated:** 2026-07-19

## Summary

PepRep is a **local-first measurement and personal record-keeping** tool. It does **not**
include analytics or advertising SDKs and does **not** transmit your vials, doses, plans, or
history as part of normal use. An account is optional and used only for encrypted cloud backup.

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

If you choose encrypted cloud backup:

- You may opt in with **passwordless email** (a sign-in link or one-time code).
- PepRep uploads only a **password-encrypted backup file** you create — not your passphrase,
  not a plaintext database.
- Supabase stores account email + ciphertext object + non-health manifest metadata.
- Local calculation, logging, and file backups work without an account.
- You can delete individual cloud backups, sign out, or permanently delete the cloud account
  and all its backups from Settings.

## Notifications

Reminders use **local notifications** scheduled on your device. Notification content is not
sent to a PepRep server.

## Export and encrypted backups

- **Plaintext export** (CSV/JSON): created only when you choose Export. Files are unencrypted;
  you control where they are shared (Files, Drive, email, etc.).
- **Encrypted backup**: created only when you choose Create encrypted backup. The file is
  password-protected on device (AES-GCM). PepRep uploads it only if you separately choose the
  encrypted cloud backup action; otherwise you choose where to save or share it. Restore
  requires the password and replaces local PepRep data on that device after confirmation.

These are **user-controlled** off-device copies, not PepRep-operated cloud sync.

## Deleting your data

Use **Settings → Erase all data** to remove PepRep records from the device. Uninstalling the
app also removes local app storage (subject to OS behavior). Encrypted backups or exports you
previously saved elsewhere must be deleted by you from those locations.

If you created an optional cloud account, use **Settings → Encrypted cloud backup → Delete
cloud account**. The app requires a second confirmation, then removes the account and all
associated cloud backup files. This does not erase local records on the device.

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

Support is available at `https://peprep.co/contact`. Do not include health or treatment details
in a public support request.
