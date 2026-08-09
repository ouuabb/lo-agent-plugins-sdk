/**
 * @lo/agent-plugins-sdk —— TypeScript 类型声明
 *
 * 纯类型声明(SDK 源码为 CommonJS);帮助 TS 消费者获得类型提示。
 */

// ── manifest ──

export interface ManifestConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean';
    default?: unknown;
    description?: string;
  };
}

export interface AgentManifest {
  id: string;
  name: string;
  version: string;
  main: string;
  description?: string;
  author?: string;
  agentVersion?: string;
  config?: ManifestConfigSchema;
}

export interface ManifestCheck {
  ok: boolean;
  manifest?: AgentManifest;
  errors?: string[];
}

// ── 日志 ──

export interface LoggerLike {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  child(fields?: Record<string, unknown>): LoggerLike;
}

export class Logger implements LoggerLike {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  child(fields?: Record<string, unknown>): LoggerLike;
}
export class ConsoleLogger extends Logger {
  constructor(prefix?: string);
}
export class SilentLogger extends Logger {}
export function fromHost(hostLogger: LoggerLike | null | undefined): LoggerLike;

// ── 事件 ──

export class AgentEventEmitter {
  on(eventName: string, handler: (...args: unknown[]) => void): () => void;
  off(eventName: string, handler: (...args: unknown[]) => void): void;
  once(eventName: string, handler: (...args: unknown[]) => void): () => void;
  emit(eventName: string, ...args: unknown[]): void;
  emitAsync(eventName: string, ...args: unknown[]): Promise<void>;
  readonly eventNames: string[];
  clear(): void;
}

// ── lo 能力门面 ──

export interface LoFacade {
  notes: unknown;
  search: unknown;
  schemas: unknown;
  views: unknown;
  workflows: unknown;
  automations: unknown;
  evolution: unknown;
  sync: unknown;
  admin: unknown;
  health: unknown;
}

// ── 上下文 ──

export interface PluginSettings {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

export interface AgentPluginContextLike {
  readonly pluginId: string | null;
  readonly logger: LoggerLike;
  readonly events: AgentEventEmitter;
  readonly lo: LoFacade;
  readonly settings: PluginSettings | null;
  config(key?: string, defaultValue?: unknown): unknown;
}

export class AgentPluginContext implements AgentPluginContextLike {
  constructor(injections?: Record<string, unknown>);
  readonly pluginId: string | null;
  readonly logger: LoggerLike;
  readonly events: AgentEventEmitter;
  readonly lo: LoFacade;
  readonly settings: PluginSettings | null;
  config(key?: string, defaultValue?: unknown): unknown;
}

export function createLoFacade(client: Record<string, unknown>): LoFacade;

// ── 基类 ──

export class AgentPlugin {
  constructor();
  manifest(): AgentManifest;
  activate(context: AgentPluginContextLike): void | Promise<void>;
  enable(): Promise<void>;
  disable(): Promise<void>;
  deactivate(): Promise<void>;
  dispose(): Promise<void>;
  $setContext(context: AgentPluginContextLike): void;
  readonly $manifest: AgentManifest;
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly context: AgentPluginContextLike | null;
  state: string;
  readonly isEnabled: boolean;
  readonly isDisposed: boolean;
}

// ── 加载 ──

export function createPlugin(PluginClass: unknown): AgentPlugin;
export function validateManifest(manifest: unknown): ManifestCheck;

export const SDK_VERSION: string;
export const REQUIRED_FIELDS: string[];
export const ID_PATTERN: RegExp;
export const SEMVER_PATTERN: RegExp;
