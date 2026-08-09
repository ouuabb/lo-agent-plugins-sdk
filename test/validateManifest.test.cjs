const {
  validateManifest,
  REQUIRED_FIELDS,
  ID_PATTERN,
  SEMVER_PATTERN,
} = require('../src/validateManifest.cjs');

describe('validateManifest', () => {
  it('合法 manifest 通过', () => {
    const m = {
      id: 'my-plugin',
      name: '我的插件',
      version: '0.1.0',
      main: 'src/index.cjs',
    };
    expect(validateManifest(m)).toEqual({ ok: true, manifest: m });
  });

  it('支持全部可选字段', () => {
    const m = {
      id: 'my-plugin',
      name: '我的插件',
      version: '0.1.0',
      main: 'index.cjs',
      description: '测试插件',
      author: 'lo',
      agentVersion: '>=0.1.0',
      config: { key: { type: 'string', default: '', description: 'x' } },
    };
    expect(validateManifest(m).ok).toBe(true);
  });

  it('缺失必填字段时报错', () => {
    const result = validateManifest({ id: 'x', version: '0.1.0' });
    expect(result.ok).toBe(false);
    for (const f of REQUIRED_FIELDS) {
      if (f !== 'id' && f !== 'version') {
        expect(result.errors.join()).toContain(f);
      }
    }
  });

  it('非对象 manifest 报错', () => {
    expect(validateManifest(null).ok).toBe(false);
    expect(validateManifest('str').ok).toBe(false);
    expect(validateManifest([1]).ok).toBe(false);
  });

  it('非法 id 报错(kebab-case)', () => {
    const result = validateManifest({
      id: 'My Plugin',
      name: 'x',
      version: '0.1.0',
      main: 'a.cjs',
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join()).toContain('manifest.id');
  });

  it('非法 version 报错(x.y.z)', () => {
    const result = validateManifest({
      id: 'my-plugin',
      name: 'x',
      version: 'v0.1',
      main: 'a.cjs',
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join()).toContain('manifest.version');
  });

  it('非法 config 报错', () => {
    const result = validateManifest({
      id: 'my-plugin',
      name: 'x',
      version: '0.1.0',
      main: 'a.cjs',
      config: 'nope',
    });
    expect(result.ok).toBe(false);
  });
});

describe('patterns', () => {
  it('ID_PATTERN 只接受小写 kebab-case', () => {
    expect(ID_PATTERN.test('epub-reader')).toBe(true);
    expect(ID_PATTERN.test('chrome-translate')).toBe(true);
    expect(ID_PATTERN.test('Epub')).toBe(false);
    expect(ID_PATTERN.test('a b')).toBe(false);
    expect(ID_PATTERN.test('1x')).toBe(false);
  });

  it('SEMVER_PATTERN 只接受 x.y.z', () => {
    expect(SEMVER_PATTERN.test('0.1.0')).toBe(true);
    expect(SEMVER_PATTERN.test('1.2.3')).toBe(true);
    expect(SEMVER_PATTERN.test('v0.1.0')).toBe(false);
    expect(SEMVER_PATTERN.test('0.1')).toBe(false);
    expect(SEMVER_PATTERN.test('0.1.0.1')).toBe(false);
  });
});
