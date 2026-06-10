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
  status: "pending" | "active" | "completed" | "error";
}

export interface ComponentOption {
  sku: string;
  name: string;
  specs: Record<string, unknown>;
  note: string;
  compatible: boolean;
}

export interface SpecialistResult {
  component: string;
  category_detected: string | null;
  query_echo: Record<string, unknown>;
  options: ComponentOption[];
  recommended_sku: string | null;
  total_matched: number;
  pagination_hint: string | null;
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
