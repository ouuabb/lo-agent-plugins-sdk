/**
 * AgentPluginContext —— 插件运行时上下文
 *
 * 插件通过 ctx 与宿主(lo-agent)交互。SDK 只定义**稳定接口**,
 * 真实能力由 lo-agent 在激活插件时注入。
 *
 * 设计原则:
 *   1. 所有能力都有 noop 默认实现,单元测试/未注入时不崩溃
 *   2. 永不暴露 @lo/client 原始实例的任意访问;统一经 lo 命名空间门面
 *   3. 宿主注入的是 { client: LoClient, logger, config, events, settings }
 */
class AgentPluginContext {
  /**
   * @param {object} [injections]
   * @param {string} [injections.pluginId] — 当前插件 ID
   * @param {object} [injections.client]   — @lo/client 的 LoClient 实例(宿主注入)
   * @param {object} [injections.logger]   — Logger 实例
   * @param {object} [injections.config]   — 插件配置
   * @param {object} [injections.events]   — 事件总线(AgentEventEmitter)
   * @param {object} [injections.settings] — 插件持久化设置读写
   */
  constructor(injections = {}) {
    this._pluginId = injections.pluginId || null;
    this._logger = injections.logger || null;
    this._config = injections.config || {};
    this._events = injections.events || null;
    this._settings = injections.settings || null;
    this._client = injections.client || null;
  }

  /** 当前插件 ID */
  get pluginId() {
    return this._pluginId;
  }

  /** 日志接口 */
  get logger() {
    return this._logger || createNoopLogger();
  }

  /** 事件总线 */
  get events() {
    return this._events || createNoopEvents();
  }

  /**
   * 读取插件配置
   * @param {string} [key] — 不传返回全部
   * @param {*} [defaultValue]
   */
  config(key, defaultValue) {
    const cfg = this._config || {};
    if (key === undefined) return cfg;
    return cfg[key] !== undefined ? cfg[key] : defaultValue;
  }

  /** 持久化设置读写(宿主注入时可用) */
  get settings() {
    return this._settings || null;
  }

  /**
   * lo 能力门面 —— 包装宿主注入的 @lo/client。
   * 未注入时返回 noop(调用抛错,提示需在 lo-agent 中运行)。
   */
  get lo() {
    if (!this._client) return createNoopLo();
    return createLoFacade(this._client);
  }
}

/* ── noop 注入(未初始化场景) ── */

function createNoopLogger() {
  return {
    debug() {},
    info() {},
    warn() {},
    error() {},
    child() {
      return createNoopLogger();
    },
  };
}

function createNoopEvents() {
  return {
    on() {
      return () => {};
    },
    off() {},
    once() {
      return () => {};
    },
    emit() {},
    emitAsync() {},
  };
}

function createNoopLo() {
  const notInjected = () => {
    throw new Error(
      '[AgentPluginContext] lo 能力未注入，请确认插件运行在 lo-agent 中且宿主已提供 @lo/client',
    );
  };
  return {
    notes: {
      list: notInjected,
      get: notInjected,
      create: notInjected,
      update: notInjected,
      remove: notInjected,
    },
    search: { search: notInjected },
    schemas: {
      list: notInjected,
      get: notInjected,
      create: notInjected,
      update: notInjected,
      remove: notInjected,
    },
    admin: { stats: notInjected },
    onEvent: notInjected,
  };
}

/**
 * 构造 lo 能力门面 —— 只透传 @lo/client 的稳定命名空间,不透传内部对象。
 * @param {object} client — LoClient 实例
 */
function createLoFacade(client) {
  return {
    notes: client.notes,
    search: client.search,
    schemas: client.schemas,
    views: client.views,
    workflows: client.workflows,
    automations: client.automations,
    evolution: client.evolution,
    sync: client.sync,
    admin: client.admin,
    health: client.health,
  };
}

module.exports = { AgentPluginContext, createLoFacade };
