/**
 * AgentPluginContext —— 插件运行时上下文
 *
 * 插件通过 ctx 与宿主(lo-agent)交互。SDK 定义**稳定契约**，
 * 真实能力由 lo-agent Host 在激活插件时注入。
 *
 * 设计原则:
 *   1. 所有能力都有 noop 默认实现,单元测试/未注入时不崩溃
 *   2. ctx.lo 是**接口契约**——SDK 不实现,由 Host Adapter 注入实现
 *   3. 不透传 @lo/client 原始实例;统一经 ctx.lo 门面
 */
const { createLoFacade } = require('./lo-facade.cjs');

class AgentPluginContext {
  /**
   * @param {object} [injections]
   * @param {string} [injections.pluginId]   — 当前插件 ID
   * @param {object} [injections.loImpl]     — Host Adapter 注入的 lo 能力实现
   * @param {object} [injections.logger]     — Logger 实例
   * @param {object} [injections.configValues] — 插件配置值对象
   * @param {object} [injections.events]     — 事件总线(AgentEventEmitter)
   * @param {object} [injections.settings]   — 插件持久化设置读写
   */
  constructor(injections = {}) {
    this._pluginId = injections.pluginId || null;
    this._loImpl = injections.loImpl || null;
    this._logger = injections.logger || null;
    this._configValues = injections.configValues || {};
    this._events = injections.events || null;
    this._settings = injections.settings || null;
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
    const cfg = this._configValues || {};
    if (key === undefined) return cfg;
    return cfg[key] !== undefined ? cfg[key] : defaultValue;
  }

  /** 持久化设置读写(宿主注入时可用) */
  get settings() {
    return this._settings || null;
  }

  /**
   * lo 能力门面 —— 插件侧接口契约。
   * SDK 只定义契约,不实现;实现由 Host Adapter 注入。
   */
  get lo() {
    return createLoFacade(this._loImpl, { pluginId: this._pluginId });
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

module.exports = { AgentPluginContext };
