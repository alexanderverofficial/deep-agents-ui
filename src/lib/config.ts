export interface StandaloneConfig {
  deploymentUrl: string;
  assistantId: string;
  langsmithApiKey?: string;
  configuratorUrl?: string;
}

const CONFIG_KEY = "deep-agent-config";
const DEFAULT_ASSISTANT_ID = "panel-pc-deep-agent";

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
  return `${protocol}//${host}:8100`;   // prod :8100; lokalnie nadpisz na :18100 przez ConfigDialog
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
