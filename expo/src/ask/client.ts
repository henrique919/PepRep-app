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
    return { kind: "answer", text: trimmed };
  } catch (error) {
    if (isCreditError(error)) return { kind: "exhausted" };
    if (isOfflineError(error)) return { kind: "offline" };
    // Calm degradation — never crash the leaf.
    console.error("[ask] generateText failed", error);
    return { kind: "exhausted" };
  }
}
