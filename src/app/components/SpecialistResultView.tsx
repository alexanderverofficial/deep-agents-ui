"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import type { SpecialistResult, ComponentOption } from "@/app/types/types";
import { cn } from "@/lib/utils";

function specValue(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  return JSON.stringify(v);
}

function summarizeSpecs(specs: Record<string, unknown>): string {
  const entries = Object.entries(specs).slice(0, 4);
  return entries.map(([k, v]) => `${k}: ${specValue(v)}`).join(" · ");
}

/** Readable card for a parsed SpecialistResult — used inline in chat AND in the
 * "Specjaliści" tab. Far more legible than the raw JSON payload. */
export const SpecialistResultView = React.memo<{ result: SpecialistResult }>(
  ({ result }) => (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-tertiary">
        <span
          className={cn(
            "font-medium",
            result.total_matched === 0 ? "text-warning" : "text-primary"
          )}
        >
          {result.total_matched} dopasowań
        </span>
        {result.recommended_sku ? (
          <>
            {" · rekomendacja: "}
            <span className="font-mono text-primary">{result.recommended_sku}</span>
          </>
        ) : null}
      </div>
      {result.options.length > 0 ? (
        <table className="w-full table-fixed border-collapse text-xs">
          <thead>
            <tr className="text-left text-tertiary">
              <th className="w-[38%] py-1 pr-2 font-medium">SKU</th>
              <th className="w-[62%] py-1 font-medium">Nazwa / specyfikacja</th>
            </tr>
          </thead>
          <tbody>
            {result.options.map((opt: ComponentOption) => {
              const isRecommended = opt.sku === result.recommended_sku;
              return (
                <tr
                  key={opt.sku}
                  className={cn(
                    "border-t border-border align-top",
                    isRecommended && "bg-success/10"
                  )}
                >
                  <td className="break-words py-1 pr-2 font-mono">
                    {opt.sku}
                    {isRecommended && (
                      <span className="ml-1 rounded bg-success/20 px-1 text-[10px] text-success">
                        rekom.
                      </span>
                    )}
                  </td>
                  <td className="break-words py-1">
                    <div className="font-medium text-primary">{opt.name}</div>
                    <div className="text-tertiary">{summarizeSpecs(opt.specs)}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="flex items-start gap-2 rounded-md border border-warning bg-warning/10 p-2 text-xs text-warning">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            Brak dopasowań dla podanych kryteriów — spróbuj poluzować
            parametry wyszukiwania.
          </span>
        </div>
      )}
      {result.pagination_hint && (
        <p className="text-[10px] text-tertiary">{result.pagination_hint}</p>
      )}
    </div>
  )
);
SpecialistResultView.displayName = "SpecialistResultView";

/** Collapsible, pretty-printed fallback for payloads that are not a parsed
 * SpecialistResult. Single-line JSON strings are re-indented; long payloads start
 * collapsed so they never flood the chat. */
export const PrettyPayload = React.memo<{ value: unknown }>(({ value }) => {
  const [expanded, setExpanded] = useState<boolean | null>(null);
  const pretty = useMemo(() => {
    if (value == null) return "";
    if (typeof value === "string") {
      const t = value.trim();
      if (t.startsWith("{") || t.startsWith("[")) {
        try {
          return JSON.stringify(JSON.parse(t), null, 2);
        } catch {
          /* not JSON */
        }
      }
      return value;
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }, [value]);
  const isOpen = expanded ?? pretty.length <= 400;
  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!isOpen)}
        className="flex w-full items-center justify-between rounded-sm bg-muted/30 p-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/50"
      >
        <span>
          Szczegóły
          <span className="ml-2 font-normal normal-case tracking-normal text-tertiary">
            ({pretty.length} znaków)
          </span>
        </span>
        {isOpen ? (
          <ChevronUp size={12} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={12} className="text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <pre className="m-0 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-sm border border-border bg-muted/40 p-2 font-mono text-[11px] leading-5 text-foreground">
          {pretty}
        </pre>
      )}
    </div>
  );
});
PrettyPayload.displayName = "PrettyPayload";
