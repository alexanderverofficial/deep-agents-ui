"use client";

import { Bot, MonitorCog, Box, Server, type LucideIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

export interface AgentOption {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
}

/** Curated, user-facing agent list. Each `id` is a served graph name
 * (langgraph.json / LANGSERVE_GRAPHS). Order = display order. */
export const KNOWN_AGENTS: AgentOption[] = [
  {
    id: "main-configurator",
    label: "Konfigurator (auto)",
    hint: "Auto-dobór kategorii",
    icon: Bot,
  },
  {
    id: "panel-pc-agent",
    label: "Panel PC",
    hint: "Z ekranem / HMI",
    icon: MonitorCog,
  },
  {
    id: "box-pc-agent",
    label: "Box PC",
    hint: "Bez ekranu / embedded",
    icon: Box,
  },
  {
    id: "rack-pc-agent",
    label: "Serwer / Rack",
    hint: "Budowa z komponentów",
    icon: Server,
  },
];

const BY_ID = new Map(KNOWN_AGENTS.map((a) => [a.id, a]));

export function AgentSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  // Always include the active id, even if it's a custom assistant not in the
  // curated list (e.g. set manually via URL / settings), so it renders.
  const options: AgentOption[] = BY_ID.has(value)
    ? KNOWN_AGENTS
    : [...KNOWN_AGENTS, { id: value, label: value, icon: Bot }];

  const active = BY_ID.get(value);
  const ActiveIcon = active?.icon ?? Bot;

  return (
    <Select value={value} onValueChange={onChange}>
      {/* Controlled trigger: render icon + label + subtitle ourselves to match
          the dropdown rows (a one-line label in a tall box looked empty). The
          direct child is a <div> on purpose — the base trigger's
          `[&>span]:line-clamp-1` would otherwise flatten this two-line block. */}
      <SelectTrigger
        className="h-auto min-h-[2.75rem] w-[240px] bg-card py-1.5"
        aria-label="Wybierz agenta"
        title="Wybierz agenta — każda karta przeglądarki może mieć własnego"
      >
        <div className="flex min-w-0 items-center gap-2.5 text-left">
          <ActiveIcon className="h-5 w-5 shrink-0 text-brand-primary" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium leading-tight">
              {active?.label ?? value}
            </span>
            {active?.hint && (
              <span className="truncate text-[11px] leading-tight text-muted-foreground">
                {active.hint}
              </span>
            )}
          </div>
        </div>
      </SelectTrigger>
      <SelectContent align="end" className="w-[280px]">
        {options.map((a) => {
          const Icon = a.icon;
          return (
            <SelectItem
              key={a.id}
              value={a.id}
              // Drop the reserved left padding + hide the built-in check
              // indicator (first child span) — each row carries its own icon,
              // selection is shown by the brand tint below.
              className="pl-2 pr-3 [&>span:first-child]:hidden data-[state=checked]:text-brand-primary"
            >
              <span className="flex items-center gap-2.5 py-0.5">
                <Icon className="h-4 w-4 shrink-0 text-brand-primary" />
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium leading-tight">{a.label}</span>
                  {a.hint && (
                    <span className="text-[11px] leading-snug text-muted-foreground">
                      {a.hint}
                    </span>
                  )}
                </span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
