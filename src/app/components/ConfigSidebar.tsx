"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useChatContext } from "@/providers/ChatProvider";
import { cn } from "@/lib/utils";
import type { ConfigComponentEntry } from "@/app/types/types";

function EntryList({ entries }: { entries: ConfigComponentEntry[] }) {
  if (entries.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <ul className="space-y-0.5">
      {entries.map((entry, i) => (
        <li key={i} className="font-mono text-xs">
          {entry.sku}
          {entry.quantity != null ? ` ×${entry.quantity}` : ""}
        </li>
      ))}
    </ul>
  );
}

interface ConfigRowProps {
  label: string;
  onEdit: () => void;
  children: React.ReactNode;
}

function ConfigRow({ label, onEdit, children }: ConfigRowProps) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border border-border px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 py-0 text-[10px] text-muted-foreground hover:text-foreground"
          onClick={onEdit}
        >
          edytuj
        </Button>
      </div>
      <div className={cn("text-xs text-foreground")}>{children}</div>
    </div>
  );
}

export function ConfigSidebar() {
  const { configuration, sendMessage } = useChatContext();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 pb-1.5 pt-2">
        <span className="text-xs font-semibold tracking-wide text-zinc-600">
          KONFIGURACJA PANEL PC
        </span>
      </div>

      {!configuration || !configuration.base_unit_sku ? (
        <div className="flex flex-1 items-center justify-center px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Brak konfiguracji. Zacznij rozmowę, aby dobrać Panel PC.
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1 px-3 pb-2">
          <div className="space-y-2">
            <ConfigRow
              label="Jednostka bazowa"
              onEdit={() =>
                sendMessage(
                  "Chcę zmienić jednostkę bazową Panel PC. Pokaż dostępne opcje."
                )
              }
            >
              <span className="font-mono text-xs">{configuration.base_unit_sku}</span>
            </ConfigRow>

            <ConfigRow
              label="RAM"
              onEdit={() =>
                sendMessage(
                  "Chcę zmienić konfigurację RAM. Pokaż kompatybilne opcje."
                )
              }
            >
              <EntryList entries={configuration.ram_entries} />
            </ConfigRow>

            <ConfigRow
              label="Storage"
              onEdit={() =>
                sendMessage(
                  "Chcę zmienić dysk/storage. Pokaż kompatybilne opcje."
                )
              }
            >
              <EntryList entries={configuration.storage_entries} />
            </ConfigRow>

            <ConfigRow
              label="PSU"
              onEdit={() =>
                sendMessage(
                  "Chcę zmienić zasilacz (PSU). Pokaż kompatybilne opcje."
                )
              }
            >
              {configuration.psu_sku ? (
                <span className="font-mono text-xs">{configuration.psu_sku}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </ConfigRow>

            <ConfigRow
              label="System (OS)"
              onEdit={() =>
                sendMessage(
                  "Chcę zmienić system operacyjny. Pokaż dostępne opcje."
                )
              }
            >
              {configuration.os_sku ? (
                <span className="font-mono text-xs">{configuration.os_sku}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </ConfigRow>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
