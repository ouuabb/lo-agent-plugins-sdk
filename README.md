# @lo/agent-plugins-sdk — lo-agent 插件开发工具包

> 跑在 lo-agent 内、通过 `@lo/client` 访问 lo Core 的插件契约层。
> 纯 CommonJS、无强制运行时依赖(`@lo/client` 为可选 peerDependency,由宿主注入)。

## 特性

- `AgentPlugin` 基类:定义插件契约(manifest + activate/deactivate 生命周期)
- `AgentPluginContext`:插件运行时上下文,提供 `lo` 能力门面(包装 `@lo/client`)、
  `events` 事件总线、`logger` 日志、`config` 配置
- `validateManifest` / `createPlugin`:manifest 校验与插件类实例化辅助
- 独立于 lo Core 的嵌入式插件系统,插件 crash 不影响核心进程
- 附带 TypeScript 类型声明(`types/index.d.ts`)

## 安装

```bash
npm install @lo/agent-plugins-sdk
```

> 插件运行时还需要 `@lo/client`(由 lo-agent 宿主提供,或插件自行声明依赖)。

## 快速开始

```js
const { AgentPlugin } = require('@lo/agent-plugins-sdk');

class MyPlugin extends AgentPlugin {
  manifest() {
    return {
      id: 'my-plugin',
      name: '我的插件',
      version: '0.1.0',
      main: 'index.cjs',
    };
  }

  activate(ctx) {
    // 订阅本地事件
    ctx.events.on('resource.created', (r) => {
      ctx.logger.info('新资源', r.rid);
    });

    // 通过 lo 能力门面访问仓库(需宿主注入 @lo/client)
    ctx.lo.notes.list({ limit: 10 }).then((list) => {
      ctx.logger.info('最近笔记', list.length);
    });
  }

  async deactivate() {
    // 清理 activate 阶段申请的资源
  }
}

module.exports = MyPlugin;
```

## 插件生命周期

```
installed → loaded → activated → enabled → disabled → deactivated → disposed
```

由 SDK 的 `LIFECYCLE_STATES` / `LIFECYCLE_TRANSITIONS` / `canTransition` 定义，
宿主驱动;插件通常实现 `manifest()` + `activate(ctx)`，可选 `deactivate()`。

## API 一览

```
@lo/agent-plugins-sdk
├── AgentPlugin              # 插件基类
├── AgentPluginContext       # 运行时上下文(lo/extensions/events/logger/config)
├── AgentEventEmitter        # 事件总线
├── createLoFacade / LO_CAPABILITIES  # ctx.lo 接口契约(SDK 不实现,Host 注入)
├── createExtensionsFacade / EXTENSIONS_METHODS  # ctx.extensions 注册契约(SDK 不实现,Host 注入)
├── validateManifest / manifestSchema  # manifest 校验 + 独立规范描述（见 docs/manifest-spec.md）
├── createPlugin             # 插件类校验 + 实例化
├── LIFECYCLE_STATES / LIFECYCLE_TRANSITIONS / canTransition  # 生命周期契约
├── CAPABILITY_TYPES / PERMISSION_LO / DEFAULT_PERMISSIONS / resolvePermissions  # 能力/权限类型
├── createExtensionPoint / EXTENSION_TYPES  # 扩展点声明(纯数据,无 handler)
├── parseContributes         # 解析 manifest.contributes → 扩展点列表
├── Logger / ConsoleLogger / SilentLogger / fromHost
└── SDK_VERSION
```

## ctx.lo 契约面

SDK 只定义接口契约（operations / relations / events / resources / health），
不实现业务调用；实现由 lo-agent Host Adapter 注入。

## ctx.extensions 契约面

插件经 `ctx.extensions` 向宿主注册运行时能力（命令执行等）：

```js
await plugin.activate(ctx) {
  ctx.extensions.registerCommands([
    { id: 'demo.hello', title: 'Hello', handler: async (args, cmdCtx) => ({ message: 'hi' }) },
  ]);
}
```

SDK 只定义方法白名单（registerCommands / registerView / registerPanel /
registerEditor / registerService / getService / listServices），不持有 handler；
实现由 lo-agent Host ExtensionRegistry 注入。宿主经 `PluginManager.executeCommand(id, args)` 调用命令。
插件经 `ctx.extensions.registerService([...])` 注册服务（含 api），其他插件经
`ctx.extensions.getService(id)` / `listServices()` 消费。

## 插件依赖与激活顺序

插件可在 manifest 声明 `dependsOn`（依赖插件 ID 数组），约定**提供者先于消费者**激活：

```json
{
  "id": "demo-consumer",
  "name": "Demo Consumer",
  "version": "0.1.0",
  "main": "index.cjs",
  "dependsOn": ["demo-hello"]
}
```

- `dependsOn` 依赖不存在的插件会被忽略；依赖自身 / 非法 ID 在 manifest 校验时报错。
- 宿主按依赖拓扑排序激活（提供者在前）；循环依赖无法定序时稳定兜底（按加载顺序）。
- 消费者对 `getService` 返回值仍需判空（提供者可能未激活/被停用）。

## 权限模型

插件经 `manifest.permissions` 声明可访问的 lo 能力；`ctx.lo` 门面按白名单过滤，
未授权的 `ctx.lo` 方法调用会抛错（最小权限原则，对齐 012 §8）。

```json
{
  "permissions": {
    "lo": ["health.read", "operations.write"],
    "storage": false,
    "network": false,
    "shell": false
  }
}
```

- **默认权限（未声明）**：只读 + 无存储/网络/shell。
  即 `operations.read / relations.read / events.read / resources.read / health.read` 放行，
  写操作（`operations.write` / `relations.write` 等）需显式声明。
- 能力 → 权限映射见 `LO_PERMISSION_MAP`（SDK 导出）。
- Host 在激活插件时经 `resolvePermissions(manifest.permissions)` 解析并注入
  `ctx.lo`，未授权方法透传不达 `@lo/client`。

## 渲染端 UI（mountEl）

插件可声明 `manifest.ui`（渲染端入口，单文件自包含 ESM）提供交互式 UI：宿主在渲染进程
isolated world 加载它，调用 `render(mountEl, ctx)` 挂载真实 DOM（替代 HTML 快照模式）。

- `ctx` 为插件作用域能力入口（`{ pluginId, lo, config, executeCommand, notify }`）；
  `ctx.lo` 与主进程插件契约一致，能力经 `agent-plugins:ctx` 代理到主进程
  `PluginContext.lo` facade（权限不变）。
- 安全：ui 运行在 isolated world，不可访问 `window.loAgent.loCore` / App 内部对象；
  仅保证 JS 上下文隔离，不保证 DOM 内容隔离。
- 契约细节见 [`docs/manifest-spec.md`](docs/manifest-spec.md) §9。

## Manifest 规范

`plugin.json`（manifest）是插件 ↔ 宿主的稳定契约。完整规范见
**[`docs/manifest-spec.md`](docs/manifest-spec.md)**（必填字段、dependsOn、contributes、
permissions、config、完整示例）。机器可读描述由 SDK 导出：

```js
const { manifestSchema } = require('@lo/agent-plugins-sdk');
// { $id, required, properties, contributesTypes, permissionsLoValues, ... }
```

校验入口 `validateManifest(manifest)` 与 `manifestSchema` 同源（常量复用，避免漂移）。

## 开发

```bash
npm install
npm test       # Jest + 覆盖率
npm run lint   # ESLint
npm run format # Prettier
```

## 与相关 SDK 的关系

- **`@lo/client`**:lo Core 的 HTTP 客户端,是插件的通讯底座（Host Adapter 内部使用，SDK 不触碰）
- **`@lo/plugins-sdk`**:lo Core 的嵌入式插件契约(跑在核心进程内),与本 SDK 互补不冲突

## License

MIT
