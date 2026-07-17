/**
 * App preferences — Ask toggle only for now.
 * Ask is a leaf: when off, no network is attempted.
 */

import { create } from "zustand";

import { getStorage, STORAGE_PREFIX } from "@/src/db/adapter";

const ASK_ENABLED_KEY = `${STORAGE_PREFIX}askEnabled`;

interface SettingsState {
  askEnabled: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setAskEnabled: (enabled: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  askEnabled: true,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await getStorage().getItem(ASK_ENABLED_KEY);
      // Default ON so Ask is available; user can disable in Privacy.
      const askEnabled = raw === null ? true : raw === "true";
      set({ askEnabled, hydrated: true });
    } catch (error) {
      console.error("[settings] Failed to hydrate", error);
      set({ askEnabled: true, hydrated: true });
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
}));
