"use client";

import React from "react";
import { CheckCircle2, Loader2, AlertCircle, Circle } from "lucide-react";
import type { SubAgent } from "@/app/types/types";
import {
  SpecialistResultView,
  PrettyPayload,
} from "@/app/components/SpecialistResultView";
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
        <SpecialistResultView result={result} />
      ) : subAgent.status === "completed" ? (
        subAgent.rawOutput ? (
          <PrettyPayload value={subAgent.rawOutput} />
        ) : (
          <p className="text-xs text-tertiary">(brak wyniku)</p>
        )
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
