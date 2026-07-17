/**
 * Ask client — leaf network surface. Failures never throw into the rest of the app.
 */

import { buildAskOutboundPayload } from "./payload";
import { evaluateAskPolicy } from "./policy";
import { checkAskRateLimit, recordAskCall } from "./rateLimit";

export type AskOutcome =
  | { kind: "answer"; text: string }
  | { kind: "refuse"; text: string }
  | { kind: "offline" }
  | { kind: "exhausted" }
  | { kind: "disabled" }
  | { kind: "rate_limited" };

export type GenerateTextFn = (params: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
}) => Promise<string>;

export interface AskContext {
  askEnabled: boolean;
  online: boolean;
  generateText: GenerateTextFn;
  nowMs?: number;
}

function isCreditError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return (
    lower.includes("credit") ||
    lower.includes("quota") ||
    lower.includes("402") ||
    lower.includes("exhausted") ||
    lower.includes("payment") ||
    lower.includes("insufficient")
  );
}

function isOfflineError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return (
    lower.includes("network") ||
    lower.includes("offline") ||
    lower.includes("failed to fetch") ||
    lower.includes("network request failed") ||
    lower.includes("internet") ||
    lower.includes("econnrefused") ||
    lower.includes("enotfound")
  );
}

const MAX_ANSWER_WORDS = 120;

/** Prefer a complete sentence ending over a mid-sentence cut. */
export function clipAskAnswer(text: string, maxWords = MAX_ANSWER_WORDS): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) return trimmed;
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return trimmed;

  const limited = words.slice(0, maxWords).join(" ");
  const sentenceEnd = Math.max(
    limited.lastIndexOf(". "),
    limited.lastIndexOf("? "),
    limited.lastIndexOf("! "),
  );
  if (sentenceEnd >= Math.floor(limited.length * 0.45)) {
    return limited.slice(0, sentenceEnd + 1).trim();
  }
  return `${limited.replace(/[,:;–—-]\s*$/, "").trim()}.`;
}

/**
 * Ask a reference question. Stateless regarding user records.
 * Policy refusals never hit the network.
 */
export async function askQuestion(question: string, ctx: AskContext): Promise<AskOutcome> {
  if (!ctx.askEnabled) return { kind: "disabled" };
  if (!ctx.online) return { kind: "offline" };

  const policy = evaluateAskPolicy(question);
  if (policy.action === "refuse") {
    return { kind: "refuse", text: policy.message };
  }

  const rate = await checkAskRateLimit(ctx.nowMs);
  if (!rate.allowed) return { kind: "rate_limited" };

  const payload = buildAskOutboundPayload(question);

  try {
    const text = await ctx.generateText({ messages: payload.messages });
    await recordAskCall(ctx.nowMs);
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return {
        kind: "refuse",
        text: "I don't have that in PepRep's reference set. Try Reference or the calculator for measurement math.",
      };
    }
    return { kind: "answer", text: clipAskAnswer(trimmed) };
  } catch (error) {
    if (isCreditError(error)) return { kind: "exhausted" };
    if (isOfflineError(error)) return { kind: "offline" };
    // Calm degradation — never crash the leaf.
    console.error("[ask] generateText failed", error);
    return { kind: "exhausted" };
  }
}
