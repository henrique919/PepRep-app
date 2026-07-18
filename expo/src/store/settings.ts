/**
 * App preferences — Ask toggle, first-run onboarding, versioned safety ack.
 * Ask is a leaf: when off, no network is attempted.
 */

import { create } from "zustand";

import { getStorage, STORAGE_PREFIX } from "@/src/db/adapter";
import {
  CURRENT_ASK_CONSENT_VERSION,
  resolveAskEnabled,
} from "@/src/store/askConsent";

const ASK_ENABLED_KEY = `${STORAGE_PREFIX}askEnabled`;
const ASK_CONSENT_VERSION_KEY = `${STORAGE_PREFIX}askConsentVersion`;
const ONBOARDING_COMPLETE_KEY = `${STORAGE_PREFIX}onboardingComplete`;
const SAFETY_ACK_VERSION_KEY = `${STORAGE_PREFIX}safetyAckVersion`;

/** Bump when the safety acknowledgement copy materially changes. */
export const CURRENT_SAFETY_ACK_VERSION = 1;

export { CURRENT_ASK_CONSENT_VERSION };

interface SettingsState {
  askEnabled: boolean;
  askConsentVersion: number | null;
  onboardingComplete: boolean;
  safetyAckVersion: number | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  /** Persist Ask off without clearing consent (user toggle). */
  setAskEnabled: (enabled: boolean) => Promise<void>;
  /**
   * Record informed consent for the current consent version and enable Ask.
   * This is the only path that may turn Ask on.
   */
  acceptAskConsent: () => Promise<void>;
  completeOnboarding: (ackVersion: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  askEnabled: false,
  askConsentVersion: null,
  onboardingComplete: false,
  safetyAckVersion: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const storage = getStorage();
      const [askRaw, consentRaw, onboardingRaw, ackRaw] = await Promise.all([
        storage.getItem(ASK_ENABLED_KEY),
        storage.getItem(ASK_CONSENT_VERSION_KEY),
        storage.getItem(ONBOARDING_COMPLETE_KEY),
        storage.getItem(SAFETY_ACK_VERSION_KEY),
      ]);
      const resolved = resolveAskEnabled(askRaw, consentRaw);
      // If legacy storage said ON without consent, rewrite to OFF so relaunch stays safe.
      if (askRaw === "true" && !resolved.askEnabled) {
        await storage.setItem(ASK_ENABLED_KEY, "false");
      }
      const onboardingComplete = onboardingRaw === "true";
      const parsedAck = ackRaw !== null ? Number(ackRaw) : NaN;
      const safetyAckVersion = Number.isFinite(parsedAck) ? parsedAck : null;
      set({
        askEnabled: resolved.askEnabled,
        askConsentVersion: resolved.askConsentVersion,
        onboardingComplete,
        safetyAckVersion,
        hydrated: true,
      });
    } catch (error) {
      console.error("[settings] Failed to hydrate", error);
      set({
        askEnabled: false,
        askConsentVersion: null,
        onboardingComplete: false,
        safetyAckVersion: null,
        hydrated: true,
      });
    }
  },

  setAskEnabled: async (enabled: boolean) => {
    if (enabled) {
      // Enabling requires acceptAskConsent — never bypass the JIT sheet.
      const { askConsentVersion } = get();
      if (askConsentVersion !== CURRENT_ASK_CONSENT_VERSION) {
        console.warn("[settings] Refused to enable Ask without current consent");
        return;
      }
    }
    set({ askEnabled: enabled });
    try {
      await getStorage().setItem(ASK_ENABLED_KEY, enabled ? "true" : "false");
    } catch (error) {
      console.error("[settings] Failed to persist askEnabled", error);
    }
  },

  acceptAskConsent: async () => {
    set({
      askEnabled: true,
      askConsentVersion: CURRENT_ASK_CONSENT_VERSION,
    });
    try {
      const storage = getStorage();
      await Promise.all([
        storage.setItem(ASK_ENABLED_KEY, "true"),
        storage.setItem(ASK_CONSENT_VERSION_KEY, String(CURRENT_ASK_CONSENT_VERSION)),
      ]);
    } catch (error) {
      console.error("[settings] Failed to persist Ask consent", error);
    }
  },

  completeOnboarding: async (ackVersion: number) => {
    set({ onboardingComplete: true, safetyAckVersion: ackVersion });
    try {
      const storage = getStorage();
      await Promise.all([
        storage.setItem(ONBOARDING_COMPLETE_KEY, "true"),
        storage.setItem(SAFETY_ACK_VERSION_KEY, String(ackVersion)),
      ]);
    } catch (error) {
      console.error("[settings] Failed to persist onboarding", error);
    }
  },
}));
