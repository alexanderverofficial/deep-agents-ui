import type { SpecialistResult, ComponentOption } from "@/app/types/types";

function isComponentOption(v: unknown): v is ComponentOption {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.sku === "string" &&
    typeof o.name === "string" &&
    typeof o.compatible === "boolean" &&
    typeof o.specs === "object" &&
    o.specs !== null
  );
}

function isSpecialistResult(v: unknown): v is SpecialistResult {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.component === "string" &&
    Array.isArray(o.options) &&
    o.options.every(isComponentOption) &&
    typeof o.total_matched === "number"
  );
}

/**
 * Attempts to extract a SpecialistResult from a task tool-call result.
 * Accepts: a JSON string, an object, or a {result|structured_response|content} wrapper.
 * Returns null when the payload is not a SpecialistResult (e.g. plain-text summary).
 */
export function parseSpecialistResult(raw: unknown): SpecialistResult | null {
  if (raw == null) return null;

  let candidate: unknown = raw;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
    try {
      candidate = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  if (isSpecialistResult(candidate)) return candidate;

  if (candidate && typeof candidate === "object") {
    const o = candidate as Record<string, unknown>;
    for (const key of ["structured_response", "result", "content"] as const) {
      const inner = o[key];
      if (inner == null) continue;
      const parsed =
        typeof inner === "string" ? parseSpecialistResult(inner) : null;
      if (parsed) return parsed;
      if (isSpecialistResult(inner)) return inner;
    }
  }

  return null;
}
