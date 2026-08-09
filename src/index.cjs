/**
 * @lo/agent-plugins-sdk —— lo-agent 插件开发工具包入口
 *
 * 稳定公开 API:
 *   - AgentPlugin         —— 插件基类(所有 lo-agent 插件必须继承)
 *   - AgentPluginContext  —— 插件运行时上下文(能力门面)
 *   - AgentEventEmitter   —— 事件总线
 *   - validateManifest    —— manifest 校验
 *   - createPlugin        —— 插件类校验与实例化辅助
 *   - Logger / ConsoleLogger / SilentLogger / fromHost —— 日志
 *
 * 插件代码只应从 '@lo/agent-plugins-sdk' require。
 * 插件通过 ctx.lo 访问 lo Core 能力,底层是宿主注入的 @lo/client。
 *
 * 用法:
 *   const { AgentPlugin } = require('@lo/agent-plugins-sdk');
 *
 *   class MyPlugin extends AgentPlugin {
 *     manifest() {
 *       return { id: 'my-plugin', name: '我的插件', version: '0.1.0', main: 'index.cjs' };
 *     }
 *     activate(ctx) {
 *       ctx.events.on('resource.created', (r) => ctx.logger.info('新资源', r.rid));
 *     }
 *   }
 *
 *   module.exports = MyPlugin;
 */
const AgentPlugin = require('./AgentPlugin.cjs');
const { AgentPluginContext, createLoFacade } = require('./AgentPluginContext.cjs');
const AgentEventEmitter = require('./AgentEventEmitter.cjs');
const {
  validateManifest,
  REQUIRED_FIELDS,
  ID_PATTERN,
  SEMVER_PATTERN,
} = require('./validateManifest.cjs');
const { createPlugin } = require('./loadPlugin.cjs');
const { Logger, ConsoleLogger, SilentLogger, fromHost } = require('./Logger.cjs');

const SDK_VERSION = require('../package.json').version;

module.exports = {
  // 基类
  AgentPlugin,
  AgentPluginContext,

  // 事件
  AgentEventEmitter,

  // 校验与加载
  validateManifest,
  createPlugin,

  // 内部常量(供宿主/测试)
  REQUIRED_FIELDS,
  ID_PATTERN,
  SEMVER_PATTERN,
  createLoFacade,

  // 日志
  Logger,
  ConsoleLogger,
  SilentLogger,
  fromHost,

  // 元信息
  SDK_VERSION,
};
