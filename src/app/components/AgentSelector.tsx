"use client";

import { Bot, MonitorCog, Box, Server, type LucideIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
    hint: "Sam wykrywa kategorię i deleguje",
    icon: Bot,
  },
  {
    id: "panel-pc-agent",
    label: "Panel PC",
    hint: "Komputery panelowe z ekranem / HMI",
    icon: MonitorCog,
  },
  {
    id: "box-pc-agent",
    label: "Box PC",
    hint: "Bezwentylatorowe / embedded, bez ekranu",
    icon: Box,
  },
  {
    id: "rack-pc-agent",
    label: "Serwer / Rack",
    hint: "Budowa z komponentów (mobo/CPU/…)",
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
      <SelectTrigger
        className="h-9 w-[200px] gap-2 bg-card"
        aria-label="Wybierz agenta"
        title="Wybierz agenta — każda karta przeglądarki może mieć własnego"
      >
        <span className="flex items-center gap-2 truncate">
          <ActiveIcon className="h-4 w-4 shrink-0 text-brand-primary" />
          <SelectValue placeholder="Wybierz agenta" />
        </span>
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((a) => {
          const Icon = a.icon;
          return (
            <SelectItem key={a.id} value={a.id}>
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-brand-primary" />
                <span className="flex flex-col">
                  <span className="font-medium leading-tight">{a.label}</span>
                  {a.hint && (
                    <span className="text-[11px] leading-tight text-muted-foreground">
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
