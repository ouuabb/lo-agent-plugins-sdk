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
├── AgentPluginContext       # 运行时上下文(lo/events/logger/config)
├── AgentEventEmitter        # 事件总线
├── createLoFacade / LO_CAPABILITIES  # ctx.lo 接口契约(SDK 不实现,Host 注入)
├── validateManifest         # manifest schema 校验(engines/contributes/permissions/config)
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
