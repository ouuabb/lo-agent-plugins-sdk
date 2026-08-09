/**
 * docs-check.cjs —— 文档构建占位校验
 *
 * 当前 SDK 文档为 Markdown 结构(见 docs/)。
 * 后续若引入 VitePress,此脚本可替换为 vitepress build。
 */
const fs = require('fs');
const path = require('path');

const docsDir = path.resolve(__dirname, '..', 'docs');
const indexFile = path.join(docsDir, 'index.md');

if (!fs.existsSync(indexFile)) {
  console.error('缺少 docs/index.md，请先编写 SDK 文档');
  process.exit(1);
}

console.log('docs/index.md 存在，文档校验通过');
