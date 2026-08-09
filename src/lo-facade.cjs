/**
 * lo-facade.cjs —— ctx.lo 接口契约
 *
 * 只定义插件侧可见的 lo 能力面**契约**（命名空间 + 方法签名），
 * 不包含任何实现，不 require @lo/client。
 *
 * 边界：
 *   - SDK 不替代 @lo/client（不封装 HTTP/协议）
 *   - SDK 不定义二次协议（不新增 operations/events/relations 之外的方法）
 *   - ctx.lo 的实现由 Host Adapter 注入（lo-agent 内映射到 @lo/client）
 *
 * 依赖方向：
 *   Plugin → ctx.lo（契约）→ Host Adapter（实现）→ @lo/client → lo Core
 */

/**
 * 契约命名的能力面（描述性，供 Host 对齐）
 * 这些命名空间与 @lo/client 的能力面一致；SDK 不实现它们。
 */
const LO_CAPABILITIES = {
  operations: ['execute', 'list', 'get', 'undo'],
  relations: ['list', 'get', 'create', 'update', 'remove'],
  events: ['subscribe', 'history'],
  resources: ['list', 'get', 'search'],
  health: ['stats'],
};

/**
 * 构造 ctx.lo —— 接收 Host 注入的实现（Host Adapter）
 *
 * @param {object} [impl] — Host 注入的 lo 能力实现（每个命名空间是方法集合）
 * @param {{ pluginId?: string }} [meta] — 供错误提示
 * @returns {object} ctx.lo 门面
 *
 * 说明：
 *   - 若 impl 未注入，返回 noop 门面（调用抛错提示）
 *   - 若 impl 注入，按契约白名单透传，不透传未声明能力
 */
function createLoFacade(impl = null, meta = {}) {
  const notInjected = (ns, name) => () => {
    throw new Error(
      `[lo-facade] ${meta.pluginId || 'plugin'} 调用 ctx.lo.${ns}.${name} 失败：` +
        'lo 能力实现未注入，请确认插件运行在 lo-agent 中（Host Adapter 提供实现）',
    );
  };

  const facade = {};
  for (const [ns, methods] of Object.entries(LO_CAPABILITIES)) {
    facade[ns] = {};
    const nsImpl = impl && impl[ns];
    for (const name of methods) {
      facade[ns][name] =
        nsImpl && typeof nsImpl[name] === 'function'
          ? nsImpl[name]
          : notInjected(ns, name);
    }
  }
  return facade;
}

module.exports = { createLoFacade, LO_CAPABILITIES };
