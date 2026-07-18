/**
 * Bridge Ask messages to a generateText function (cloud transport optional).
 *
 * When a cloud SDK is restored post T3.1, keep sending a real system role on the
 * wire so the guardrail is not folded into the injection-prone user turn.
 */

import type { AskMessage } from "./payload";

/** Wire shape for generateText message lists (user|assistant at the type level). */
export type RorkGenerateTextMessage = {
  role: "user" | "assistant";
  content: string;
};

export type RorkGenerateTextFn = (params: {
  messages: RorkGenerateTextMessage[];
}) => Promise<string>;

/**
 * Prefer system + user as separate roles. Cast through unknown because the
 * published SDK types omit `system` even though the HTTP body forwards it.
 */
export function toRorkGenerateTextParams(messages: AskMessage[]): {
  messages: RorkGenerateTextMessage[];
} {
  const system = messages.find((message) => message.role === "system")?.content ?? "";
  const user = messages.find((message) => message.role === "user")?.content ?? "";
  const wire: AskMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
  return {
    messages: wire as unknown as RorkGenerateTextMessage[],
  };
}

export async function callRorkGenerateText(
  generateText: RorkGenerateTextFn,
  messages: AskMessage[],
): Promise<string> {
  return generateText(toRorkGenerateTextParams(messages));
}
