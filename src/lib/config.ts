export interface StandaloneConfig {
  deploymentUrl: string;
  assistantId: string;
  langsmithApiKey?: string;
  configuratorUrl?: string;
}

// v3: bump porzuca stary cache z assistantId="panel-pc-deep-agent" — domyślnym agentem
// jest teraz "main-configurator" (orchestrator routujący do panel/box/rack). Zwracający
// użytkownicy z v2 cache muszą dostać nowy default, stąd bump klucza.
// (v2 wcześniej porzuciło cache z configuratorUrl=:8100, kolizja z email-monitor.)
const CONFIG_KEY = "deep-agent-config-v3";
const DEFAULT_ASSISTANT_ID = "main-configurator";

function defaultDeploymentUrl(): string {
  if (typeof window === "undefined") return "";
  const protocol = window.location.protocol || "http:";
  const host = window.location.hostname;
  if (!host) return "";
  return `${protocol}//${host}:8123`;
}

function defaultConfiguratorUrl(): string {
  if (typeof window === "undefined") return "";
  const protocol = window.location.protocol || "http:";
  const host = window.location.hostname;
  if (!host) return "";
  // Port konfigurowalny: prod :8100 (configurator), lokalnie :18100 (override, bo
  // :8100 zajmuje email-monitor). Ustaw NEXT_PUBLIC_CONFIGURATOR_PORT w .env.local.
  const port = process.env.NEXT_PUBLIC_CONFIGURATOR_PORT || "8100";
  return `${protocol}//${host}:${port}`;
}

export function getDefaultConfig(): StandaloneConfig {
  return {
    deploymentUrl: defaultDeploymentUrl(),
    assistantId: DEFAULT_ASSISTANT_ID,
    configuratorUrl: defaultConfiguratorUrl(),
  };
}

export function getConfig(): StandaloneConfig | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(CONFIG_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveConfig(config: StandaloneConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}
