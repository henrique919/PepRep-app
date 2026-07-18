# PepRep — Device verification checklist

**Status:** Owner-run. Nothing below is marked passed unless observed on a physical device
or signed release build. Cursor cannot VoiceOver/TalkBack or App Privacy Report.

## Install & first run
- [ ] Clean install (no prior data)
- [ ] Onboarding disclaimer + ack required (`CURRENT_SAFETY_ACK_VERSION`)
- [ ] Save a vial ends onboarding
- [ ] Relaunch restores local data

## Calculate (golden arithmetic — synthetic validation only)
- [ ] 5 mg / 2 mL / 250 mcg → 10 U, 0.1 mL (not a dose recommendation)
- [ ] Overflow warning on 30-unit capacity when units > 30
- [ ] Safety numerals never tween through false values
- [ ] Reduced motion: decorative motion gated

## Today / plans / history
- [ ] Create plan → appears on Today for matching weekday
- [ ] Log / skip / snooze
- [ ] Notification permission prompt; lock-screen text is privacy-safe (your wording)
- [ ] History immutable; void/un-log works

## Local encrypted backup
- [ ] Create → share to Files
- [ ] Wrong password rejected
- [ ] Restore preview + double-confirm
- [ ] Airplane mode: local features still work

## Optional cloud backup (only if `EXPO_PUBLIC_SUPABASE_*` set to PepRep ref)
- [ ] Section hidden when env unset
- [ ] Email OTP sign-in
- [ ] Upload ciphertext only; passphrase never leaves device
- [ ] List / download / restore / delete own backups
- [ ] Sign out
- [ ] Cross-device restore with same account + password
- [ ] Offline: clear error, no silent success

## Accessibility
- [ ] VoiceOver (iOS) — Calculate, Today, New plan, Settings, Vial, History calendar
- [ ] TalkBack (Android) — same
- [ ] Largest Dynamic Type — no clipped safety numerals
- [ ] Error boundary recover (“Try again”)

## Network (signed release)
- [ ] iOS App Privacy Report / Android network inspection — list contacted domains
- [ ] Paste domains into `docs/privacy/V1-DATA-FLOW-INVENTORY.md`

## Erase
- [ ] Erase all data clears local records
- [ ] Cloud backups (if any) remain until deleted in cloud UI / account deletion
