# AGENTS.md — lo-agent-plugins-sdk

本文件供 AI 编码助手(opencode 等)理解本项目规范。

## 项目是什么

`@lo/agent-plugins-sdk` 是 **lo-agent 插件开发工具包**。与 lo Core 的嵌入式
插件系统(`@lo/plugins-sdk`,跑在核心进程内)不同,本 SDK 的插件**直接运行在
lo-agent 桌面端**,通过 `@lo/client`(lo Core 的 HTTP 客户端)访问仓库能力。

## 技术栈与约束

- **纯 CommonJS**(`.cjs`),无 ES modules、无 TypeScript 源码(仅有 `types/index.d.ts` 声明)。
- **无强制运行时依赖**:`@lo/client` 是可选 `peerDependencies`,由宿主(lo-agent)注入;
  未注入时 `ctx.lo` 返回 noop(调用抛错提示)。
- devDependencies: jest / eslint / prettier / husky / commitlint / babel。
- Node >= 20。代码风格:双空格缩进、单引号、分号、100 列上限。

## 常用命令

```bash
npm test       # Jest(jest.config.js,覆盖率默认开启)
npm run lint   # ESLint: src/**/*.cjs 与 test/**/*.cjs
npm run format # Prettier 全部格式化
npm run docs:build # 文档占位校验(scripts/docs-check.cjs)
```

## 架构

```
src/
  index.cjs                 # 统一出口
  AgentPlugin.cjs           # 插件基类(manifest/activate/生命周期)
  AgentPluginContext.cjs    # 运行时上下文(lo 能力门面/events/logger/config)
  AgentEventEmitter.cjs     # 事件总线(on/off/once/emit/emitAsync)
  Logger.cjs                # 日志接口 + console/silent/fromHost 实现
  validateManifest.cjs      # manifest 校验
  loadPlugin.cjs            # createPlugin 插件类校验 + 实例化
test/
  AgentPlugin.test.cjs
  AgentPluginContext.test.cjs
  AgentEventEmitter.test.cjs
  validateManifest.test.cjs
  loadPlugin.test.cjs
  Logger.test.cjs
types/
  index.d.ts  # 类型声明(package.json types 字段指向)
docs/
  index.md    # 概览文档
scripts/
  docs-check.cjs  # docs:build 占位校验
```

## 关键约定

- 插件代码只应从 `@lo/agent-plugins-sdk` require,永不 require lo-agent 内部文件。
- 所有能力接口都要有 noop 默认实现,单元测试/未注入时不崩溃(参考 lo-plugins-sdk)。
- `ctx.lo` 只暴露 `@lo/client` 的稳定命名空间(notes/search/schemas/views/...),
  **不透传** client 内部对象(request/_opts 等)。
- 事件命名沿用 lo 点号约定:`resource.created` 等;插件自定义事件用 `<pluginId>.<event>`。
- 新 API 需补 `types/index.d.ts` 类型声明与对应测试用例。
- 提交信息遵循 Conventional Commits(type 英文小写 + subject 中文),
  husky pre-commit 自动跑测试、commit-msg 校验。

## 变更前必读

- 修改公开契约(基类方法/上下文门面/事件约定)会直接影响宿主(lo-agent)与已发布插件,
  需谨慎并同步更新 README/AGENTS/types。
- 新增能力:在对应模块实现 + 导出到 `src/index.cjs` + 补类型 + 补测试。
