"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Circle,
  Bot,
} from "lucide-react";
import type { SubAgent } from "@/app/types/types";

interface SubAgentIndicatorProps {
  subAgent: SubAgent;
  onClick: () => void;
  isExpanded?: boolean;
}


const STATUS_CHIP: Record<
  SubAgent["status"],
  { label: string; icon: React.ReactNode; className: string }
> = {
  pending: {
    label: "oczekuje",
    icon: <Circle size={12} />,
    className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  },
  active: {
    label: "w trakcie",
    icon: <Loader2 size={12} className="animate-spin" />,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  completed: {
    label: "gotowe",
    icon: <CheckCircle2 size={12} />,
    className:
      "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  },
  warning: {
    label: "brak dopasowań",
    icon: <AlertTriangle size={12} />,
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  error: {
    label: "błąd",
    icon: <AlertCircle size={12} />,
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  },
};

export const SubAgentIndicator = React.memo<SubAgentIndicatorProps>(
  ({ subAgent, onClick, isExpanded = true }) => {
    return (
      <div className="w-fit max-w-[70vw] overflow-hidden rounded-lg border-none bg-card shadow-none outline-none">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          className="flex w-full items-center justify-between gap-2 border-none px-4 py-2 text-left shadow-none outline-none transition-colors duration-200"
        >
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bot size={15} className="shrink-0 text-brand-primary" />
              <span className="font-sans text-[15px] font-bold leading-[140%] tracking-[-0.6px] text-foreground">
                {subAgent.subAgentName}
              </span>
              <span
                className={
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium " +
                  STATUS_CHIP[subAgent.status].className
                }
              >
                {STATUS_CHIP[subAgent.status].icon}
                {STATUS_CHIP[subAgent.status].label}
              </span>
            </div>
            {isExpanded ? (
              <ChevronUp
                size={14}
                className="shrink-0 text-muted-foreground"
              />
            ) : (
              <ChevronDown
                size={14}
                className="shrink-0 text-muted-foreground"
              />
            )}
          </div>
        </Button>
      </div>
    );
  }
);

SubAgentIndicator.displayName = "SubAgentIndicator";
