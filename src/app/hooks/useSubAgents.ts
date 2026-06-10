"use client";

import { useMemo } from "react";
import type { Message } from "@langchain/langgraph-sdk";
import type { SubAgent } from "@/app/types/types";
import { extractStringFromMessageContent } from "@/app/utils/utils";
import { parseSpecialistResult } from "@/app/utils/specialistResult";

type RawToolCall = {
  id?: string;
  name?: string;
  type?: string;
  args?: unknown;
  input?: unknown;
  function?: { name?: string; arguments?: unknown };
};

function collectToolCalls(message: Message): RawToolCall[] {
  const m = message as Message & {
    additional_kwargs?: { tool_calls?: RawToolCall[] };
    tool_calls?: RawToolCall[];
    content?: unknown;
  };
  if (Array.isArray(m.additional_kwargs?.tool_calls)) {
    return m.additional_kwargs!.tool_calls!;
  }
  if (Array.isArray(m.tool_calls)) {
    return m.tool_calls.filter((tc) => tc.name !== "");
  }
  if (Array.isArray(m.content)) {
    return (m.content as RawToolCall[]).filter(
      (b) => (b as { type?: string }).type === "tool_use"
    );
  }
  return [];
}

/**
 * Aggregates every `task` tool-call across the conversation into SubAgent records,
 * correlating each with its tool-result message by tool_call_id and parsing the
 * output into a SpecialistResult when possible.
 */
export function useSubAgents(messages: Message[]): SubAgent[] {
  return useMemo(() => {
    const byId = new Map<string, SubAgent>();
    const order: string[] = [];

    for (const message of messages) {
      if (message.type === "ai") {
        for (const tc of collectToolCalls(message)) {
          const name = tc.function?.name || tc.name || tc.type || "unknown";
          if (name !== "task") continue;
          const args = (tc.function?.arguments ||
            tc.args ||
            tc.input ||
            {}) as Record<string, unknown>;
          const subagentType = args["subagent_type"];
          if (
            !subagentType ||
            subagentType === "" ||
            subagentType === null
          ) {
            continue;
          }
          const id = tc.id || `task-${order.length}`;
          if (!byId.has(id)) order.push(id);
          byId.set(id, {
            id,
            name,
            subAgentName: String(subagentType),
            input: args,
            rawOutput: undefined,
            output: null,
            status: "active",
          });
        }
      } else if (message.type === "tool") {
        const m = message as Message & { tool_call_id?: string };
        const id = m.tool_call_id;
        if (!id) continue;
        const existing = byId.get(id);
        if (!existing) continue;
        const raw = extractStringFromMessageContent(message);
        byId.set(id, {
          ...existing,
          rawOutput: raw,
          output: parseSpecialistResult(raw),
          status: "completed",
        });
      }
    }

    return order.map((id) => byId.get(id)!);
  }, [messages]);
}
