/**
 * validateManifest —— re-export manifest schema 校验
 *
 * 完整实现见 ./manifest.cjs；此处保持向后兼容的入口。
 */
const {
  validateManifest,
  REQUIRED_FIELDS,
  ID_PATTERN,
  SEMVER_PATTERN,
} = require('./manifest.cjs');

module.exports = { validateManifest, REQUIRED_FIELDS, ID_PATTERN, SEMVER_PATTERN };
