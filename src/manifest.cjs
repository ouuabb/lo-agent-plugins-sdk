/**
 * manifest.cjs —— 插件 Manifest Schema 与校验
 *
 * manifest 是插件 ↔ 宿主(lo-agent)的稳定契约。
 * SDK 定义完整 schema；Host 在加载插件时校验。
 *
 * 结构:
 *   id / name / version / main        —— 必填
 *   description / author              —— 可选元信息
 *   engines: { agent, core }          —— 版本约束
 *   activationEvents: [...]           —— 延迟激活触发点
 *   contributes: { commands, views, panels, editors, services }
 *   permissions: { lo, storage, network, shell }
 *   config: { key: { type, default, description } }
 */
const REQUIRED_FIELDS = ['id', 'name', 'version', 'main'];

const ID_PATTERN = /^[a-z][a-z0-9-]*$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

const CONTRIBUTE_TYPES = ['commands', 'views', 'panels', 'editors', 'services'];
const PERMISSION_LO_CAPABILITIES = [
  'operations.read',
  'operations.write',
  'relations.read',
  'relations.write',
  'events.read',
  'resources.read',
  'resources.write',
  'health.read',
];

/**
 * 校验 manifest
 * @param {object} manifest
 * @returns {{ ok: true, manifest } | { ok: false, errors: string[] }}
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

  if (manifest.engines && typeof manifest.engines !== 'object') {
    errors.push('manifest.engines 必须是对象({ agent?, core? })');
  }

  if (
    manifest.activationEvents !== undefined &&
    !Array.isArray(manifest.activationEvents)
  ) {
    errors.push('manifest.activationEvents 必须是字符串数组');
  }

  if (manifest.contributes !== undefined) {
    if (typeof manifest.contributes !== 'object' || Array.isArray(manifest.contributes)) {
      errors.push('manifest.contributes 必须是对象');
    } else {
      for (const key of Object.keys(manifest.contributes)) {
        if (!CONTRIBUTE_TYPES.includes(key)) {
          errors.push(`manifest.contributes 含未知类型 "${key}"（支持: ${CONTRIBUTE_TYPES.join(', ')}）`);
        }
      }
    }
  }

  if (manifest.permissions !== undefined) {
    if (typeof manifest.permissions !== 'object' || Array.isArray(manifest.permissions)) {
      errors.push('manifest.permissions 必须是对象');
    } else {
      if (manifest.permissions.lo !== undefined) {
        if (!Array.isArray(manifest.permissions.lo)) {
          errors.push('manifest.permissions.lo 必须是字符串数组');
        } else {
          for (const cap of manifest.permissions.lo) {
            if (!PERMISSION_LO_CAPABILITIES.includes(cap)) {
              errors.push(
                `manifest.permissions.lo 含未知能力 "${cap}"（支持: ${PERMISSION_LO_CAPABILITIES.join(', ')}）`,
              );
            }
          }
        }
      }
      for (const boolField of ['storage', 'shell']) {
        if (
          manifest.permissions[boolField] !== undefined &&
          typeof manifest.permissions[boolField] !== 'boolean'
        ) {
          errors.push(`manifest.permissions.${boolField} 必须是 boolean`);
        }
      }
    }
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

module.exports = {
  validateManifest,
  REQUIRED_FIELDS,
  ID_PATTERN,
  SEMVER_PATTERN,
  CONTRIBUTE_TYPES,
  PERMISSION_LO_CAPABILITIES,
};
