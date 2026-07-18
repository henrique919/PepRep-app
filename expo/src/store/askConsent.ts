/**
 * Ask opt-in consent helpers — pure, testable.
 * Question text must not leave the device until the user accepts the current
 * consent version. Legacy installs that had Ask on without this consent are
 * treated as off until they re-consent (OWNER-DECISIONS OD-7 recommended default).
 */

/** Bump when consent copy / provider disclosure materially changes. */
export const CURRENT_ASK_CONSENT_VERSION = 1;

export type AskConsentResolution = {
  askEnabled: boolean;
  askConsentVersion: number | null;
};

/**
 * Resolve persisted Ask flags after hydrate.
 * Missing consent ⇒ Ask off, even if a legacy `askEnabled=true` is stored.
 */
export function resolveAskEnabled(
  askRaw: string | null,
  consentRaw: string | null,
  currentConsentVersion: number = CURRENT_ASK_CONSENT_VERSION,
): AskConsentResolution {
  const parsedConsent = consentRaw !== null ? Number(consentRaw) : NaN;
  const askConsentVersion = Number.isFinite(parsedConsent) ? parsedConsent : null;
  const hasCurrentConsent = askConsentVersion === currentConsentVersion;
  const askEnabled = hasCurrentConsent && askRaw === "true";
  return { askEnabled, askConsentVersion };
}
