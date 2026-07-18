# PepRep v1 — Data Flow Inventory

**Date:** 2026-07-18 · **Branch:** `cursor/peprep-launch-verification`  
**Method:** Static source inventory + generated Android manifest sample. Runtime App Privacy
Report / Android network capture = **owner device gate** (not observed in this session).

## Verdict on prior claims

| Prior claim | Status |
|---|---|
| “Zero network calls at rest” | **Unsupported.** Android manifest includes `INTERNET`. Optional citation links, optional Supabase cloud backup, and OS/notification infrastructure may use the network. |
| “Data Not Collected” (blanket) | **Do not assert** once optional Auth email + encrypted cloud backup are enabled. Local-only mode collects nothing off-device; optional cloud collects account email + ciphertext + manifest metadata. |
| “Nothing leaves your device” | **False as a blanket.** Replace with scoped statements. |

`expo-updates` is **not** a dependency — no OTA update checks from that package.

## Paths

| Data | Source | Destination | Purpose | Trigger | Retention | User control | Form |
|---|---|---|---|---|---|---|---|
| Vials, doses, events, plans, reminders | User entry | Device AsyncStorage | App function | Continuous | Until erase/uninstall | Erase all data | Local only |
| Local notification content | User reminder labels/times | OS notification center | Reminders | Schedule | OS-managed | Disable/delete reminder | Local |
| Plaintext export CSV/JSON | Local DB | User-chosen share target | Export | User tap | User’s storage | User deletes files | Unencrypted user copy |
| Encrypted local backup file | Local DB → PBKDF2+AES-GCM | User-chosen share target | Backup | User tap | User’s storage | Password + file delete | Ciphertext |
| Citation URL open | Reference compound citations | External browser (user site) | Read source | User tap | N/A | Don’t tap | Network |
| Auth email (optional cloud) | User | Supabase Auth (`opbqlsmwljqkkdvguojh`) | Sign-in | Opt-in | Supabase Auth | Sign out / delete account | Account metadata |
| Encrypted backup blob (optional cloud) | Local ciphertext | Supabase Storage private bucket | Cloud backup | User tap after auth | Until user deletes | Delete backup / account | Ciphertext |
| Backup manifest row | Operational metadata only | `peprep_backup_manifests` | List/restore UX | Upload | Until delete | Delete row+object | No health content |
| Fonts (`@expo-google-fonts/*`) | Bundled in app binary | N/A at runtime | UI | App load | N/A | N/A | Not a runtime fetch if packaged |
| Ask / AI | Disabled; SDK removed | — | — | — | — | — | Off |

## Android permissions (generated prebuild sample, then discarded)

Observed in disposable `expo prebuild --platform android`:
- Present: `INTERNET`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `SCHEDULE_EXACT_ALARM`, `VIBRATE`, `SYSTEM_ALERT_WINDOW`
- Removed via `tools:node="remove"`: camera, mic, location, contacts, legacy storage
- Follow-up: `SYSTEM_ALERT_WINDOW` added to `blockedPermissions` in `app.json`

## Icons

Verified: `icon.png`, `adaptive-icon.png`, `splash-icon.png`, `favicon.png` — 1024×1024 RGB, no alpha/tRNS.

## Runtime domain capture

**Blocked / owner:** Run release build with iOS App Privacy Report and Android network inspection; paste contacted domains into this doc before store submission.
