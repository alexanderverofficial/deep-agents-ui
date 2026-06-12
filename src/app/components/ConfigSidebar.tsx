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
  const s = (entry.specs || {}) as Record<string, unknown>;
  let lines = [s.screen, s.cpu, s.ram, s.ip && `IP: ${s.ip}`, s.temp,
               s.capacity, s.type, s.power].filter(Boolean) as string[];
  if (lines.length === 0) {
    // generic fallback for box/rack entries (capacity_gb, ddr_gen, socket, wattage_w, ...)
    lines = Object.entries(s)
      .filter(([, v]) => v != null && typeof v !== "object")
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${v}`);
  }
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
               className="mt-1 inline-flex items-center gap-1 text-xs text-brand-primary hover:underline">
              <FileText className="h-3 w-3" /> Karta katalogowa
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
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-tertiary">
          {label}
          {Number(entry.quantity) > 1 && (
            <span className="rounded bg-info/15 px-1 font-mono text-[10px] font-bold text-brand-primary">
              ×{Number(entry.quantity)}
            </span>
          )}
        </span>
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

/** Single-entry slots across ALL config shapes (panel/box/rack), in render order.
 *  panel: base_unit, ram_entries[], storage_entries[], psu, os
 *  box:   base_unit, cpu, ram, storage_entries[], os
 *  rack:  cpu, motherboard, ram, cooler, chassis, psu, storage_entries[], gpu, os */
const SINGLE_SLOTS: Array<[key: string, label: string, editMsg: string]> = [
  ["motherboard", "Płyta główna", "Chcę zmienić płytę główną. Pokaż kompatybilne opcje."],
  ["cpu", "CPU", "Chcę zmienić procesor. Pokaż kompatybilne opcje."],
  ["ram", "RAM", "Chcę zmienić konfigurację RAM. Pokaż kompatybilne opcje."],
  ["cooler", "Chłodzenie", "Chcę zmienić chłodzenie CPU. Pokaż kompatybilne opcje."],
  ["chassis", "Obudowa", "Chcę zmienić obudowę. Pokaż kompatybilne opcje."],
  ["gpu", "GPU", "Chcę zmienić kartę graficzną. Pokaż kompatybilne opcje."],
  ["psu", "PSU", "Chcę zmienić zasilacz (PSU). Pokaż kompatybilne opcje."],
  ["os", "System (OS)", "Chcę zmienić system operacyjny. Pokaż dostępne opcje."],
];

export function ConfigSidebar() {
  const { configuration, sendMessage } = useChatContext();
  const cfg = configuration as Record<string, any> | null;
  const ask = (msg: string) => sendMessage(msg);

  const hasAny =
    !!cfg &&
    ((cfg.variants?.length ?? 0) > 0 ||
      !!cfg.base_unit ||
      SINGLE_SLOTS.some(([k]) => !!cfg[k]) ||
      (cfg.ram_entries?.length ?? 0) > 0 ||
      (cfg.storage_entries?.length ?? 0) > 0);

  if (!hasAny) {
    return (
      <div className="flex h-full items-center justify-center px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          Brak konfiguracji. Zacznij rozmowę, aby dobrać komputer.
        </p>
      </div>
    );
  }

  const renderEntries = (c: Record<string, any>, keyPrefix = "") => (
    <>
      {c.base_unit && (
        <BaseCard entry={c.base_unit}
          onEdit={() => ask("Chcę zmienić jednostkę bazową. Pokaż dostępne opcje.")} />
      )}
      {SINGLE_SLOTS.map(([key, label, editMsg]) =>
        c[key] ? (
          <MiniCard key={`${keyPrefix}${key}`} label={label} entry={c[key]}
            onEdit={() => ask(editMsg)} />
        ) : null
      )}
      {(c.ram_entries ?? []).map((e: ConfigEntry, i: number) => (
        <MiniCard key={`${keyPrefix}ram-${i}`} label="RAM" entry={e}
          onEdit={() => ask("Chcę zmienić konfigurację RAM. Pokaż kompatybilne opcje.")} />
      ))}
      {(c.storage_entries ?? []).map((e: ConfigEntry, i: number) => (
        <MiniCard key={`${keyPrefix}st-${i}`} label="Dysk" entry={e}
          onEdit={() => ask("Chcę zmienić dysk/storage. Pokaż kompatybilne opcje.")} />
      ))}
    </>
  );

  const variants: Array<Record<string, any>> = Array.isArray(cfg!.variants)
    ? cfg!.variants
    : [];

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-3">
        {variants.length > 0 ? (
          // multiple proposed configurations — one collapsible section per option
          variants.map((variant, i) => (
            <details key={`variant-${i}`} open={i === 0}
              className="overflow-hidden rounded-lg border border-border bg-card">
              <summary className="cursor-pointer select-none border-l-2 border-l-brand bg-muted/50 px-3 py-2 text-xs font-semibold transition-colors hover:bg-muted">
                {variant.label || `Opcja ${i + 1}`}
              </summary>
              <div className="space-y-2 p-2">{renderEntries(variant, `v${i}-`)}</div>
            </details>
          ))
        ) : (
          renderEntries(cfg!)
        )}
      </div>
    </ScrollArea>
  );
}
