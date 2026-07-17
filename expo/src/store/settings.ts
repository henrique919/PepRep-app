/**
 * App preferences — Ask toggle, first-run onboarding, versioned safety ack.
 * Ask is a leaf: when off, no network is attempted.
 */

import { create } from "zustand";

import { getStorage, STORAGE_PREFIX } from "@/src/db/adapter";

const ASK_ENABLED_KEY = `${STORAGE_PREFIX}askEnabled`;
const ONBOARDING_COMPLETE_KEY = `${STORAGE_PREFIX}onboardingComplete`;
const SAFETY_ACK_VERSION_KEY = `${STORAGE_PREFIX}safetyAckVersion`;

/** Bump when the safety acknowledgement copy materially changes. */
export const CURRENT_SAFETY_ACK_VERSION = 1;

interface SettingsState {
  askEnabled: boolean;
  onboardingComplete: boolean;
  safetyAckVersion: number | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setAskEnabled: (enabled: boolean) => Promise<void>;
  completeOnboarding: (ackVersion: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  askEnabled: true,
  onboardingComplete: false,
  safetyAckVersion: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const storage = getStorage();
      const [askRaw, onboardingRaw, ackRaw] = await Promise.all([
        storage.getItem(ASK_ENABLED_KEY),
        storage.getItem(ONBOARDING_COMPLETE_KEY),
        storage.getItem(SAFETY_ACK_VERSION_KEY),
      ]);
      // Default ON so Ask is available; user can disable in Privacy.
      const askEnabled = askRaw === null ? true : askRaw === "true";
      const onboardingComplete = onboardingRaw === "true";
      const parsedAck = ackRaw !== null ? Number(ackRaw) : NaN;
      const safetyAckVersion = Number.isFinite(parsedAck) ? parsedAck : null;
      set({ askEnabled, onboardingComplete, safetyAckVersion, hydrated: true });
    } catch (error) {
      console.error("[settings] Failed to hydrate", error);
      set({
        askEnabled: true,
        onboardingComplete: false,
        safetyAckVersion: null,
        hydrated: true,
      });
    }
  },

  setAskEnabled: async (enabled: boolean) => {
    set({ askEnabled: enabled });
    try {
      await getStorage().setItem(ASK_ENABLED_KEY, enabled ? "true" : "false");
    } catch (error) {
      console.error("[settings] Failed to persist askEnabled", error);
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
