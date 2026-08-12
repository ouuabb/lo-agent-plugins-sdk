# Manifest Specification — lo-agent 插件 Manifest 规范

> 状态：v0.1 · 正式规范（独立文档，不依赖实现）
> 上游基准：012 §1（插件运行时架构草案）·013 §6.3（Manifest 独立规范判定）
> 对应实现：`@lo/agent-plugins-sdk` 的 `manifestSchema` / `validateManifest` / `loadPlugin`
> 契约声明：本文件是插件 ↔ 宿主（lo-agent）的稳定契约；与实现冲突时以真实代码为准并回报。

---

## 0. 概述

`plugin.json`（**manifest**）是每个 lo-agent 客户端插件的入口契约文件。宿主在安装 /
加载 / 激活插件时读取并校验它。

- manifest 是**纯数据**：不包含 handler、render、api 等运行时函数（运行时能力经
  `ctx.extensions` 注册，见 §4.4）。
- 插件必须提供 `plugin.json`，位于插件目录根下；`main` 指向的入口 require
  `@lo/agent-plugins-sdk`。
- 校验入口：`validateManifest(manifest)`（SDK 导出）；机器可读 schema：
  `manifestSchema`（SDK 导出）。

## 1. 必填字段

| 字段 | 类型 | 规则 |
|---|---|---|
| `id` | string | 插件唯一 ID。kebab-case：`^[a-z][a-z0-9-]*$`（小写字母/数字/中划线） |
| `name` | string | 插件显示名 |
| `version` | string | 语义化版本：`^\d+\.\d+\.\d+$` |
| `main` | string | 插件入口文件（相对插件目录，如 `index.cjs` / `src/index.cjs`） |

缺任一必填字段即校验不通过。

## 2. 可选元信息

| 字段 | 类型 | 说明 |
|---|---|---|
| `description` | string | 插件说明 |
| `author` | string | 作者 |
| `agentVersion` | string | 兼容的 lo-agent 版本约束 |
| `engines` | object | 环境约束 |
| `engines.agent` | string | lo-agent 版本约束（如 `>=0.1.0`） |
| `engines.core` | string | lo Core 版本约束（如 `>=0.1.0`） |

## 3. 依赖（dependsOn）

```json
"dependsOn": ["demo-hello"]
```

| 规则 | 说明 |
|---|---|
| 类型 | string 数组，元素为其他插件的 `id`（kebab-case） |
| 语义 | 依赖提供者必须在消费者之前激活（宿主按依赖拓扑排序） |
| 禁止 | 依赖自身（校验报错）；元素非 kebab-case（校验报错） |
| 忽略 | 依赖不存在的插件（排序层忽略，不报错） |

消费者对 `ctx.extensions.getService(id)` 返回值仍需判空：提供者可能未激活 / 被停用。

## 4. contributes —— 扩展点声明

`contributes` 是**纯数据声明**，供宿主发现/展示；实际 handler / render / api 在激活期
经 `ctx.extensions` 动态注册（`registerCommands` / `registerView` / `registerPanel` /
`registerEditor` / `registerService`）。

允许类型（`manifestSchema.contributesTypes`）：

| 类型 | 声明条目 | 运行时注册 | 说明 |
|---|---|---|---|
| `commands` | `{ id, title? }` | `ctx.extensions.registerCommands([...])` | 命令面板 / 菜单 |
| `views` | `{ id, title?, type? }` | `ctx.extensions.registerView([...])` | 视图面板（type: panel/sidebar/editor） |
| `panels` | `{ id, title? }` | `ctx.extensions.registerPanel(...)` | 侧边栏/底部面板 |
| `editors` | `{ id, title?, resourceType? }` | `ctx.extensions.registerEditor(...)` | 自定义编辑器 |
| `services` | `{ id, title? }` | `ctx.extensions.registerService([...])` | 插件间服务（消费方经 `getService`） |

包含未知类型（如 `"foo": []`）即校验报错。

### 4.1 服务消费契约

- 提供者：`ctx.extensions.registerService([{ id, title?, version?, api }])`；
  `api` 为普通对象，其方法被其他插件当接口调用。
- 消费者：`ctx.extensions.getService(id)` 返回 `api`（服务不存在 / 提供者未激活返回
  `null`）；`ctx.extensions.listServices()` 返回元信息（**不含 `api`**）。
- 提供者停用 / 禁用时服务从注册表清理，消费者随后 `getService` 得 `null`。

## 5. permissions —— 权限声明（最小权限）

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `permissions.lo` | string 数组 | 只读能力集 | 允许的 Core 能力白名单（`ctx.lo` 按此过滤，未授权调用抛错） |
| `permissions.storage` | boolean | `false` | 是否可访问插件私有存储目录 |
| `permissions.network` | boolean | `false` | 是否可发起网络请求 |
| `permissions.shell` | boolean | `false` | 是否可执行外部命令 |

`permissions.lo` 允许值（`manifestSchema.permissionsLoValues`）：

```
operations.read   operations.write
relations.read    relations.write
events.read
resources.read    resources.write
health.read
```

规则：

- 未声明 permissions → 默认只读（四个 `.read` + `events.read` + `health.read`），
  无存储 / 网络 / shell。
- 写操作（`operations.write` / `relations.write` / `resources.write` 等）必须显式声明。
- 未知能力名（如 `"foo.write"`）即校验报错。
- 权限在激活期由宿主经 `resolvePermissions(manifest.permissions)` 解析并注入 `ctx.lo`。

## 6. config —— 配置 schema

```json
"config": {
  "greeting": {
    "type": "string",
    "default": "Hello from demo plugin",
    "description": "插件问候语"
  }
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `config` | object | 插件配置 schema |
| `config.<key>` | object | 单条配置 |
| `config.<key>.type` | `string`/`number`/`boolean` | 值类型 |
| `config.<key>.default` | 任意 | 默认值 |
| `config.<key>.description` | string | 说明 |

- 激活期注入 `ctx.config`（manifest 默认值 + `plugin-config.json` 用户配置合并）。

## 7. 完整示例

### 7.1 提供者插件（demo-hello）

```json
{
  "id": "demo-hello",
  "name": "Demo Hello",
  "version": "0.1.0",
  "description": "最小 Demo 插件：加载后调用 Host 能力获取仓库状态，并声明扩展点",
  "author": "lo",
  "main": "index.cjs",
  "permissions": {
    "lo": ["health.read", "operations.write"],
    "storage": false,
    "network": false,
    "shell": false
  },
  "config": {
    "greeting": {
      "type": "string",
      "default": "Hello from demo plugin",
      "description": "插件问候语"
    }
  },
  "contributes": {
    "commands": [{ "id": "demo-hello.hello", "title": "Demo: Hello" }],
    "views": [{ "id": "demo-hello.status", "title": "Demo: 状态", "type": "panel" }],
    "panels": [{ "id": "demo-hello.side", "title": "Demo: 侧栏" }],
    "services": [{ "id": "demo-hello.status-service", "title": "Demo: 状态服务" }]
  }
}
```

### 7.2 消费者插件（demo-consumer）

```json
{
  "id": "demo-consumer",
  "name": "Demo Consumer",
  "version": "0.1.0",
  "description": "服务消费方验证：经 ctx.extensions.getService 消费 demo-hello 的状态服务",
  "author": "lo",
  "main": "index.cjs",
  "dependsOn": ["demo-hello"],
  "permissions": {
    "lo": [],
    "storage": false,
    "network": false,
    "shell": false
  },
  "contributes": {
    "commands": [{ "id": "demo-consumer.consume", "title": "Demo: 消费状态服务" }]
  }
}
```

## 8. 校验与工具入口

| 入口 | 属于 | 说明 |
|---|---|---|
| `validateManifest(manifest)` | SDK | 完整校验（必填字段 + 各字段规则），返回 `{ ok, manifest?, errors? }` |
| `manifestSchema` | SDK | manifest 规范的机器可读描述（字段/类型/允许值，与校验器同源） |
| `createPlugin(ModuleClass)` | SDK | 实例化并校验插件类 |

SDK 版本兼容：`engineVersion` / `@lo/client` peer 依赖由宿主注入，manifest 本身口径见
本文件。