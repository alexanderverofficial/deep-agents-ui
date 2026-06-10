"use client";

import React from "react";
import { CheckCircle2, Loader2, AlertCircle, Circle } from "lucide-react";
import type { SubAgent, SpecialistResult, ComponentOption } from "@/app/types/types";
import { cn } from "@/lib/utils";

interface SubAgentPanelProps {
  subAgents: SubAgent[];
}

const STATUS_META: Record<
  SubAgent["status"],
  { label: string; icon: React.ReactNode; className: string }
> = {
  pending: {
    label: "Oczekuje",
    icon: <Circle size={14} />,
    className: "text-tertiary/70",
  },
  active: {
    label: "Pracuje…",
    icon: <Loader2 size={14} className="animate-spin" />,
    className: "text-warning/90",
  },
  completed: {
    label: "Gotowe",
    icon: <CheckCircle2 size={14} />,
    className: "text-success/90",
  },
  error: {
    label: "Błąd",
    icon: <AlertCircle size={14} />,
    className: "text-destructive",
  },
};

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

const OptionsTable = React.memo<{ result: SpecialistResult }>(({ result }) => (
  <table className="w-full table-fixed border-collapse text-xs">
    <thead>
      <tr className="text-left text-tertiary">
        <th className="w-[34%] py-1 pr-2 font-medium">SKU</th>
        <th className="w-[44%] py-1 pr-2 font-medium">Nazwa / specyfikacja</th>
        <th className="w-[22%] py-1 font-medium">Zgodny</th>
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
            <td className="break-words py-1 pr-2">
              <div className="font-medium text-primary">{opt.name}</div>
              <div className="text-tertiary">{summarizeSpecs(opt.specs)}</div>
            </td>
            <td className="py-1">
              {opt.compatible ? (
                <span className="text-success">tak</span>
              ) : (
                <span className="text-destructive">nie</span>
              )}
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
));
OptionsTable.displayName = "OptionsTable";

const SubAgentCard = React.memo<{ subAgent: SubAgent }>(({ subAgent }) => {
  const meta = STATUS_META[subAgent.status];
  const result = subAgent.output;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold tracking-tight text-primary">
          {subAgent.subAgentName}
        </span>
        <span className={cn("flex items-center gap-1 text-xs", meta.className)}>
          {meta.icon}
          {meta.label}
        </span>
      </div>

      {result ? (
        <>
          <div className="text-xs text-tertiary">
            <span className="font-medium text-primary">{result.component}</span>
            {result.category_detected ? ` · ${result.category_detected}` : ""}
            {` · ${result.total_matched} dopasowań`}
          </div>
          {result.options.length > 0 ? (
            <OptionsTable result={result} />
          ) : (
            <p className="text-xs text-tertiary">Brak opcji.</p>
          )}
          {result.pagination_hint && (
            <p className="text-[10px] text-tertiary">{result.pagination_hint}</p>
          )}
        </>
      ) : subAgent.status === "completed" ? (
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-surface p-2 text-[11px] text-primary">
          {subAgent.rawOutput ?? "(brak wyniku)"}
        </pre>
      ) : (
        <p className="text-xs text-tertiary">Specjalista jeszcze pracuje…</p>
      )}
    </div>
  );
});
SubAgentCard.displayName = "SubAgentCard";

export const SubAgentPanel = React.memo<SubAgentPanelProps>(({ subAgents }) => {
  if (subAgents.length === 0) {
    return (
      <p className="px-[18px] py-3 text-sm text-muted-foreground">
        Brak wywołań specjalistów
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 px-[18px] py-3 lg:grid-cols-2">
      {subAgents.map((subAgent) => (
        <SubAgentCard key={subAgent.id} subAgent={subAgent} />
      ))}
    </div>
  );
});
SubAgentPanel.displayName = "SubAgentPanel";
