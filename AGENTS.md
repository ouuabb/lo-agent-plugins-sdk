# AGENTS.md — lo-agent-plugins-sdk

本文件供 AI 编码助手(opencode 等)理解本项目规范。
lo 生态总纲是**独立文档**（不依赖任何本地目录布局），定义跨仓库边界与契约铁律；
如与本文档同处一个工作区，先读生态总纲再进入本仓库。

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
  AgentPluginContext.cjs    # 运行时上下文(结构 + 注入点)
  lo-facade.cjs             # ctx.lo 接口契约(不实现,Host Adapter 注入实现)
  extensions-facade.cjs     # ctx.extensions 接口契约(注册命令等运行时能力,Host 注入实现)
  manifest.cjs              # manifest schema 定义 + 校验
  lifecycle.cjs             # 生命周期状态枚举 + 转移表
  types.cjs                 # capability / permission 类型定义
  AgentEventEmitter.cjs     # 事件总线(on/off/once/emit/emitAsync)
  Logger.cjs                # 日志接口 + console/silent/fromHost 实现
  validateManifest.cjs      # re-export manifest 校验(向后兼容)
  loadPlugin.cjs            # createPlugin 插件类校验 + 实例化
test/
  AgentPlugin.test.cjs
  AgentPluginContext.test.cjs
  AgentEventEmitter.test.cjs
  validateManifest.test.cjs
  loadPlugin.test.cjs
  Logger.test.cjs
  lifecycle.test.cjs
  types.test.cjs
types/
  index.d.ts  # 类型声明(package.json types 字段指向)
docs/
  index.md    # 概览文档
scripts/
  docs-check.cjs  # docs:build 占位校验
```

## 依赖方向

```
Plugin → ctx.lo(契约) → Host Adapter(实现) → @lo/client → lo Core
Plugin → ctx.extensions(契约) → Host ExtensionRegistry(实现) → 命令执行 Runtime
```

- **SDK 不依赖 lo-agent**(无反向依赖)。
- **SDK 不替代 @lo/client**(不 require、不封装 HTTP/协议)。
- **SDK 不定义二次协议**(不新增 operations/events/relations 之外的方法)。
- `ctx.lo` 只是插件侧接口契约,实现由 Host 注入。
- `ctx.extensions` 只是能力注册契约,SDK 不持有 handler,实现由 Host 注入。

## 关键约定

- 插件代码只应从 `@lo/agent-plugins-sdk` require,永不 require lo-agent 内部文件。
- 所有能力接口都要有 noop 默认实现,单元测试/未注入时不崩溃(参考 lo-plugins-sdk)。
- `ctx.lo` 是**接口契约**:SDK 只定义命名空间与方法签名(operations/relations/events/
  resources/health),实现由 Host Adapter 注入;SDK 不实现业务调用。
- `ctx.extensions` 是**能力注册契约**:SDK 只定义方法白名单(registerCommands/
  registerView/...),SDK 不持有 handler,实现由 Host ExtensionRegistry 注入。
- 事件命名沿用 lo 点号约定:`resource.created` 等;插件自定义事件用 `<pluginId>.<event>`。
- 生命周期状态/转移表、manifest schema、capability/permission 类型由 SDK 定义,
  Host 按契约驱动。
- 新 API 需补 `types/index.d.ts` 类型声明与对应测试用例。
- 提交信息遵循 Conventional Commits(type 英文小写 + subject 中文),
  husky pre-commit 自动跑测试、commit-msg 校验。

## 变更前必读

- 修改公开契约(基类方法/上下文门面/事件约定)会直接影响宿主(lo-agent)与已发布插件,
  需谨慎并同步更新 README/AGENTS/types。
- 新增能力:在对应模块实现 + 导出到 `src/index.cjs` + 补类型 + 补测试。
