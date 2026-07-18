/**
 * Sole entry for Ask → cloud text generation.
 *
 * v1 (OD-1): Ask is disabled. This module never imports a cloud LLM SDK, so the
 * shipped binary has no AI network client. After T3.1 human sign-off, restore the
 * toolkit dependency and return its generateText from here (keep this file as the
 * only import site).
 */

import { isAskV1Enabled } from "./feature";
import type { RorkGenerateTextFn } from "./rorkTransport";

async function stubGenerateText(): Promise<string> {
  throw new Error("Ask is disabled in this build");
}

/**
 * Resolve the generateText implementation for the current build gate.
 * Never statically import a cloud SDK from app screens.
 */
export async function resolveGenerateText(): Promise<RorkGenerateTextFn> {
  if (!isAskV1Enabled()) {
    return stubGenerateText;
  }
  // Re-enable path (post T3.1): dynamically import the toolkit package and return
  // its generateText. Until then, refuse so a mistaken flag flip cannot silently no-op.
  throw new Error(
    "Ask is enabled but no generateText transport is configured for this build",
  );
}
