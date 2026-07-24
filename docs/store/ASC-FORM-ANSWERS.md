# App Store Connect — form-by-form answers for PepRep v1.0.0

Copy-paste companion for submission day. Sources: `store.config.json` (already
push-ready via `eas metadata:push`), `LISTING-DRAFT.md`, `OD-3-MEDICAL-REVIEW-PACK.md`,
and `app.json` (`ios.privacyManifests`, `ITSAppUsesNonExemptEncryption`). Where Apple's
questionnaire wording shifts over time, the item is marked **verify current** — answer
the live form honestly using the facts here, not the exact labels.

---

## 1. App Information

| Field | Value |
| --- | --- |
| Name | PepRep |
| Subtitle | Peptide Calculator & Log |
| Primary language | English (U.S.) |
| Bundle ID | com.henrique919.peprep |
| SKU | peprep-ios |
| Primary category | Utilities |
| Secondary category | (none — leave empty; Health & Fitness invites stricter medical review for no listing benefit) |
| Content rights | Does not contain, show, or access third-party content |
| Age rating | Complete questionnaire honestly (see §5) |

## 2. Pricing and Availability

- Price: **Free** (no in-app purchases in v1)
- Availability: all territories (or trim as owner prefers)

## 3. App Privacy (the "nutrition label")

Privacy policy URL: `https://peprep.co/privacy`
Privacy choices URL (optional field): `https://peprep.co/privacy#your-choices`

**Facts the answers rest on:** all calculator inputs, logs, plans, and inventory stay
on-device (encrypted at rest; key in iOS Keychain). No analytics, no ads, no tracking,
no third-party SDKs that phone home. The ONLY data that ever leaves the device is the
**optional** cloud backup (off by default, explicit opt-in): account email, an opaque
user ID, and the backup itself as ciphertext encrypted on-device with a passphrase the
server never sees.

Questionnaire answers (**verify current** wording):

| Apple data type | Collected? | Linked to identity? | Used for tracking? | Purpose |
| --- | --- | --- | --- | --- |
| Email Address | Yes — only if the user enables optional cloud backup | Yes | No | App Functionality (backup account) |
| User ID | Yes — same condition | Yes | No | App Functionality |
| Other User Content | Yes — encrypted backup blobs, same condition | Yes | No | App Functionality |
| Health & Fitness | **No** — dose records never leave the device readable; backups are end-to-end encrypted ciphertext the developer cannot decrypt | — | — | — |
| Everything else (location, contacts, identifiers, usage data, diagnostics…) | No | — | — | — |

If the reviewer form forces a single top-level choice: it is **"Data collected —
linked to you"** for the three rows above, nothing tracked, nothing shared with
third parties, collection **optional** (app is fully functional without it).

## 4. Export compliance

Already answered in the binary: `ITSAppUsesNonExemptEncryption = false` in `app.json`,
so App Store Connect should not even prompt. If it does anyway (**verify current**):
- Uses encryption: **Yes** (HTTPS, at-rest AES-256-GCM)
- Qualifies for exemption: **Yes** — only standard/exempt encryption (Apple CryptoKit-
  equivalent primitives, HTTPS, data-at-rest protection); no proprietary algorithms
- French declaration: not required for exempt use

## 5. Age rating questionnaire

Answer honestly (**verify current** — Apple revised this questionnaire in 2025):
- Medical/Treatment Information: **Infrequent/Mild** (the app's whole subject is
  measurement arithmetic for substances the user already has; it gives no medical
  advice). Expect a resulting rating of 12+ or similar.
- Drug references: if asked distinctly from medical information, also
  Infrequent/Mild.
- Everything else (violence, gambling, sexual content, horror, contests,
  unrestricted web): **None/No**.
- Made for Kids: **No**.

## 6. App Review Information

- Contact: owner name, harrysfuel@outlook.com, phone number
- Sign-in required: **No** (no demo account needed — core app has no login;
  the optional cloud-backup sign-in is not required to use any reviewed feature)
- Notes for the reviewer — paste verbatim:

> PepRep is a measurement calculator and personal logbook for peptide
> reconstitution arithmetic — functionally a scientific calculator plus a
> private diary, specialised for one domain.
>
> What it does: the user types their own numbers (vial mass in mg, water volume
> in mL, their intended dose). The app performs the arithmetic and shows
> concentration, volume, and U-100 syringe units, with the worked steps visible.
> The user may optionally log what they did and track their own vial inventory.
>
> What it deliberately does NOT do: it never recommends, suggests, defaults, or
> adjusts any dose, compound, schedule, or protocol. There are no dose presets,
> no "typical ranges," no protocol templates, no sourcing/vendor content, no
> community features. A disclaimer ("PepRep is a measurement tool. It is not
> medical advice and does not recommend doses.") is shown at first run behind a
> required acknowledgement and remains visible in the app.
>
> Data: everything stays on the device (encrypted at rest via Keychain-held
> key). No analytics, no ads, no tracking. Optional cloud backup is off by
> default; when enabled it uploads only ciphertext encrypted on-device with a
> user passphrase we cannot read, plus the account email.
>
> No sign-in is required for any functionality under review.

## 7. Version release

- Release option: **Manually release this version** (approval must not
  auto-publish; the owner presses Release)

## 8. Screenshots

- 6 frames in `docs/store/screenshots/` (1320×2868, iPhone 6.9-inch class).
  Upload in numbered order. Apple auto-scales for smaller devices; a separate
  iPad set is not required (app is iPhone-only: `supportsTablet: false`).
- Before final submission, prefer re-capturing on the physical device per
  `tools/store-screenshots/README.md` (the current set is composed from the
  real UI with a seeded fictional profile and is dimensionally valid).

## 9. Metadata push (instead of typing the listing)

From `expo/` on a machine logged into EAS:

    eas metadata:push

This pushes title, subtitle, description, keywords, promo text, and URLs from
`store.config.json`. **Verify current**: confirm each field landed in the ASC UI
afterwards; metadata push does not cover privacy questionnaire, age rating, or
screenshots.

## 10. Remaining owner-side checklist (in order)

1. TestFlight: internal group → install on device → run
   `docs/release/DEVICE-VERIFICATION-CHECKLIST.md`; report failures before anything else.
2. Delete the `EXPO_TOKEN` environment variable from EAS project + account env vars
   (Access-Token page copy is the only one needed). Rotate the token if in doubt.
3. `eas metadata:push`, then upload screenshots, then §3–§7 forms.
4. Optional but recommended given the domain: attorney skim of the listing +
   OD-3 pack before pressing Submit.
5. Submit for Review (expect possible reviewer questions; §6 notes pre-answer
   the likely ones). Release manually on approval.
6. Post-release: watch App Store Connect → App Analytics/Crashes weekly (no
   third-party analytics exist by design).
