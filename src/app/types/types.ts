export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
  status: "pending" | "completed" | "error" | "interrupted";
}

export interface SubAgent {
  id: string;
  name: string;
  subAgentName: string;
  input: Record<string, unknown>;
  /** Raw stringified task ToolMessage content, when present. */
  rawOutput?: string;
  /** Parsed SpecialistResult if the task output was a SpecialistResult JSON; else null. */
  output: SpecialistResult | null;
  /** warning = finished fine but with 0 matches; error = crashed OR returned nothing. */
  status: "pending" | "active" | "completed" | "warning" | "error";
}

export interface ComponentOption {
  sku: string;
  name: string;
  specs: Record<string, unknown>;
  /** Legacy fields (pre-lean schema) — optional for old thread history. */
  note?: string;
  compatible?: boolean;
}

export interface SpecialistResult {
  query_echo: Record<string, unknown>;
  options: ComponentOption[];
  recommended_sku: string | null;
  total_matched: number;
  pagination_hint: string | null;
  /** Legacy fields (pre-lean schema) — optional for old thread history. */
  component?: string;
  category_detected?: string | null;
}

export interface FileItem {
  path: string;
  content: string;
}

export interface TodoItem {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
  updatedAt?: Date;
}

export interface ConfigEntrySpecs {
  screen?: string; cpu?: string; ram?: string; ip?: string; temp?: string;
  capacity?: string; type?: string; power?: string;
}
export interface ConfigEntry {
  sku: string;
  name: string;
  image_url: string | null;
  datasheet_url: string | null;
  specs: ConfigEntrySpecs;
  /** How many identical units (e.g. 2× 16GB RAM sticks). Default 1. */
  quantity?: number;
}
export interface PanelPcConfiguration {
  base_unit: ConfigEntry | null;
  ram_entries: ConfigEntry[];
  storage_entries: ConfigEntry[];
  psu: ConfigEntry | null;
  os: ConfigEntry | null;
  requirements: Record<string, unknown>;
}

export interface Thread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterruptData {
  value: any;
  ns?: string[];
  scope?: string;
}

export interface ActionRequest {
  name: string;
  args: Record<string, unknown>;
  description?: string;
}

export interface ReviewConfig {
  actionName: string;
  allowedDecisions?: string[];
}

export interface ToolApprovalInterruptData {
  action_requests: ActionRequest[];
  review_configs?: ReviewConfig[];
}
