/**
 * validateManifest —— 插件 manifest 校验
 *
 * manifest 是插件的声明式元数据,由 lo-agent 插件运行时加载时解析。
 *
 * 必填字段:
 *   id          —— 唯一 ID(kebab-case)
 *   name        —— 显示名
 *   version     —— 语义化版本
 *   main        —— 插件入口文件(相对插件目录)
 *
 * 可选字段:
 *   description, author, agentVersion(需要的最低 lo-agent 版本),
 *   ui(声明式 UI 入口), capabilities(能力声明), config(配置 schema)
 */
const REQUIRED_FIELDS = ['id', 'name', 'version', 'main'];

const ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

/**
 * 校验 manifest 对象
 * @param {object} manifest
 * @returns {{ ok: true, manifest: object } | { ok: false, errors: string[] }}
 */
function validateManifest(manifest) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return { ok: false, errors: ['manifest 必须是普通对象'] };
  }

  for (const field of REQUIRED_FIELDS) {
    if (typeof manifest[field] !== 'string' || !manifest[field].trim()) {
      errors.push(`manifest 缺少必填字符串字段 "${field}"`);
    }
  }

  if (manifest.id && !ID_PATTERN.test(manifest.id)) {
    errors.push(`manifest.id 非法: "${manifest.id}"(须为小写字母/数字/中划线,kebab-case)`);
  }

  if (manifest.version && !SEMVER_PATTERN.test(manifest.version)) {
    errors.push(`manifest.version 非法: "${manifest.version}"(须为 x.y.z 语义化版本)`);
  }

  if (manifest.agentVersion && typeof manifest.agentVersion !== 'string') {
    errors.push('manifest.agentVersion 必须是字符串(如 ">=0.1.0")');
  }

  if (
    manifest.config &&
    (typeof manifest.config !== 'object' ||
      Array.isArray(manifest.config) ||
      manifest.config === null)
  ) {
    errors.push('manifest.config 必须是对象({ key: { type, default, description } })');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, manifest };
}

module.exports = { validateManifest, REQUIRED_FIELDS, ID_PATTERN, SEMVER_PATTERN };
