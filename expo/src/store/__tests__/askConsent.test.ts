import {
  CURRENT_ASK_CONSENT_VERSION,
  resolveAskEnabled,
} from "../askConsent";

describe("resolveAskEnabled", () => {
  it("defaults to off when nothing is stored", () => {
    expect(resolveAskEnabled(null, null)).toEqual({
      askEnabled: false,
      askConsentVersion: null,
    });
  });

  it("keeps legacy askEnabled=true off until current consent is recorded", () => {
    expect(resolveAskEnabled("true", null)).toEqual({
      askEnabled: false,
      askConsentVersion: null,
    });
  });

  it("enables only when stored on and consent matches current version", () => {
    expect(
      resolveAskEnabled("true", String(CURRENT_ASK_CONSENT_VERSION)),
    ).toEqual({
      askEnabled: true,
      askConsentVersion: CURRENT_ASK_CONSENT_VERSION,
    });
  });

  it("disables when consent version is stale", () => {
    expect(resolveAskEnabled("true", "0")).toEqual({
      askEnabled: false,
      askConsentVersion: 0,
    });
  });

  it("disables when user turned Ask off after consenting", () => {
    expect(
      resolveAskEnabled("false", String(CURRENT_ASK_CONSENT_VERSION)),
    ).toEqual({
      askEnabled: false,
      askConsentVersion: CURRENT_ASK_CONSENT_VERSION,
    });
  });
});
