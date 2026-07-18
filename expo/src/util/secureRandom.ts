/**
 * CSPRNG bytes for Expo / browser / Jest.
 * Hermes has no `globalThis.crypto` — use expo-crypto there.
 * Lazy-require expo-crypto so Jest never parses its ESM build.
 * Avoid static `require("crypto")` so Metro does not bundle Node's crypto.
 */

export function getSecureRandomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  const webCrypto = globalThis.crypto;
  if (webCrypto !== undefined && typeof webCrypto.getRandomValues === "function") {
    webCrypto.getRandomValues(out);
    return out;
  }

  // Node / Jest without global Web Crypto.
  if (typeof process !== "undefined" && process.versions?.node != null) {
    // eslint-disable-next-line no-eval, @typescript-eslint/no-unsafe-call -- Node-only; hide from Metro
    const nodeRequire = (0, eval)("require") as NodeRequire;
    const nodeCrypto = nodeRequire("crypto") as typeof import("crypto");
    return new Uint8Array(nodeCrypto.randomBytes(length));
  }

  // React Native / Expo Go (Hermes) — lazy require keeps Jest off this path.
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- RN-only
  const { getRandomBytes } = require("expo-crypto") as typeof import("expo-crypto");
  return getRandomBytes(length);
}
