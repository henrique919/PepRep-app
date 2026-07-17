/**
 * Client-side Ask rate limit — local only, never blocks the rest of the app.
 */

import { getStorage, STORAGE_PREFIX } from "../db/adapter";

const RATE_KEY = `${STORAGE_PREFIX}askRateTimestamps`;
/** Max Ask calls in a rolling window. */
export const ASK_RATE_LIMIT = 12;
/** Rolling window length (ms). */
export const ASK_RATE_WINDOW_MS = 60 * 60 * 1000;

async function readTimestamps(): Promise<number[]> {
  try {
    const raw = await getStorage().getItem(RATE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is number => typeof item === "number");
  } catch {
    return [];
  }
}

async function writeTimestamps(timestamps: number[]): Promise<void> {
  await getStorage().setItem(RATE_KEY, JSON.stringify(timestamps));
}

export async function checkAskRateLimit(
  nowMs: number = Date.now(),
): Promise<{ allowed: boolean; remaining: number }> {
  const cutoff = nowMs - ASK_RATE_WINDOW_MS;
  const recent = (await readTimestamps()).filter((ts) => ts >= cutoff);
  const remaining = Math.max(0, ASK_RATE_LIMIT - recent.length);
  return { allowed: recent.length < ASK_RATE_LIMIT, remaining };
}

export async function recordAskCall(nowMs: number = Date.now()): Promise<void> {
  const cutoff = nowMs - ASK_RATE_WINDOW_MS;
  const recent = (await readTimestamps()).filter((ts) => ts >= cutoff);
  recent.push(nowMs);
  await writeTimestamps(recent);
}
