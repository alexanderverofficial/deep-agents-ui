"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useChatContext } from "@/providers/ChatProvider";
import { getConfig, getDefaultConfig } from "@/lib/config";
import type { ConfigEntry } from "@/app/types/types";
import { FileText, ImageOff } from "lucide-react";

function configuratorBase(): string {
  return getConfig()?.configuratorUrl || getDefaultConfig().configuratorUrl || "";
}

function EntryImage({ entry, large }: { entry: ConfigEntry; large?: boolean }) {
  const size = large ? "h-28 w-28" : "h-12 w-12";
  if (!entry.image_url) {
    return (
      <div className={`${size} flex shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground`}>
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }
  return (
    <img
      src={`${configuratorBase()}${entry.image_url}`}
      alt={entry.name}
      className={`${size} shrink-0 rounded-md border border-border bg-white object-contain`}
      onError={(e) => {
        const el = e.currentTarget;
        el.onerror = null;
        el.src =
          "data:image/svg+xml;utf8," +
          encodeURIComponent(
            "<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='100%' height='100%' fill='%23eee'/><text x='50%' y='50%' font-size='10' text-anchor='middle' fill='%23999' dy='.3em'>brak</text></svg>"
          );
      }}
    />
  );
}

function SpecLines({ entry }: { entry: ConfigEntry }) {
  const s = entry.specs || {};
  const lines = [s.screen, s.cpu, s.ram, s.ip && `IP: ${s.ip}`, s.temp,
                 s.capacity, s.type, s.power].filter(Boolean) as string[];
  if (lines.length === 0) return null;
  return (
    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
      {lines.map((l, i) => <li key={i}>{l}</li>)}
    </ul>
  );
}

function BaseCard({ entry, onEdit }: { entry: ConfigEntry; onEdit: () => void }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex gap-3">
        <EntryImage entry={entry} large />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{entry.name}</div>
          <div className="font-mono text-xs text-muted-foreground">{entry.sku}</div>
          <SpecLines entry={entry} />
          {entry.datasheet_url && (
            <a href={`${configuratorBase()}${entry.datasheet_url}`} target="_blank" rel="noreferrer"
               className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <FileText className="h-3 w-3" /> Datasheet
            </a>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" className="mt-2 h-6 px-2 text-[11px]" onClick={onEdit}>
        edytuj
      </Button>
    </div>
  );
}

function MiniCard({ label, entry, onEdit }:
  { label: string; entry: ConfigEntry; onEdit: () => void }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
        <Button variant="ghost" size="sm" className="h-5 px-1.5 py-0 text-[10px]" onClick={onEdit}>edytuj</Button>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <EntryImage entry={entry} />
        <div className="min-w-0">
          <div className="truncate font-mono text-xs">{entry.sku}</div>
          <SpecLines entry={entry} />
        </div>
      </div>
    </div>
  );
}

export function ConfigSidebar() {
  const { configuration, sendMessage } = useChatContext();
  const cfg = configuration;
  const ask = (msg: string) => sendMessage(msg);

  if (!cfg || !cfg.base_unit) {
    return (
      <div className="flex h-full items-center justify-center px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          Brak konfiguracji. Zacznij rozmowę, aby dobrać Panel PC.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-3">
        <BaseCard entry={cfg.base_unit}
          onEdit={() => ask("Chcę zmienić jednostkę bazową Panel PC. Pokaż dostępne opcje.")} />
        {(cfg.ram_entries ?? []).map((e, i) => (
          <MiniCard key={`ram-${i}`} label="RAM" entry={e}
            onEdit={() => ask("Chcę zmienić konfigurację RAM. Pokaż kompatybilne opcje.")} />
        ))}
        {(cfg.storage_entries ?? []).map((e, i) => (
          <MiniCard key={`st-${i}`} label="Storage" entry={e}
            onEdit={() => ask("Chcę zmienić dysk/storage. Pokaż kompatybilne opcje.")} />
        ))}
        {cfg.psu && (
          <MiniCard label="PSU" entry={cfg.psu}
            onEdit={() => ask("Chcę zmienić zasilacz (PSU). Pokaż kompatybilne opcje.")} />
        )}
        {cfg.os && (
          <MiniCard label="System (OS)" entry={cfg.os}
            onEdit={() => ask("Chcę zmienić system operacyjny. Pokaż dostępne opcje.")} />
        )}
      </div>
    </ScrollArea>
  );
}
