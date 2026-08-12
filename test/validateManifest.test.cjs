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

describe('manifest 扩展字段', () => {
  const base = {
    id: 'demo',
    name: 'Demo',
    version: '0.1.0',
    main: 'index.cjs',
  };

  it('engines 合法', () => {
    expect(validateManifest({ ...base, engines: { agent: '>=0.1.0' } }).ok).toBe(true);
    expect(validateManifest({ ...base, engines: 'bad' }).ok).toBe(false);
  });

  it('activationEvents 必须是数组', () => {
    expect(validateManifest({ ...base, activationEvents: ['onView:x'] }).ok).toBe(true);
    expect(validateManifest({ ...base, activationEvents: 'bad' }).ok).toBe(false);
  });

  it('dependsOn 必须是合法插件 ID 数组', () => {
    expect(validateManifest({ ...base, dependsOn: ['demo-hello', 'epub-reader'] }).ok).toBe(true);
    expect(validateManifest({ ...base, dependsOn: 'demo-hello' }).ok).toBe(false);
    const bad = validateManifest({ ...base, dependsOn: ['demo hell', 1] });
    expect(bad.ok).toBe(false);
    expect(bad.errors.join()).toContain('dependsOn');
    // 不能依赖自身
    const self = validateManifest({ ...base, dependsOn: ['demo'] });
    expect(self.ok).toBe(false);
    expect(self.errors.join()).toContain('自身');
  });

  it('contributes 只允许已知类型', () => {
    expect(
      validateManifest({ ...base, contributes: { commands: [], views: [] } }).ok,
    ).toBe(true);
    const bad = validateManifest({ ...base, contributes: { unknownType: [] } });
    expect(bad.ok).toBe(false);
    expect(bad.errors.join()).toContain('unknownType');
  });

  it('permissions.lo 只允许已知能力', () => {
    expect(
      validateManifest({ ...base, permissions: { lo: ['operations.read', 'health.read'] } }).ok,
    ).toBe(true);
    const bad = validateManifest({ ...base, permissions: { lo: ['not-a-cap'] } });
    expect(bad.ok).toBe(false);
    expect(bad.errors.join()).toContain('not-a-cap');
  });

  it('permissions.storage/shell 必须是 boolean', () => {
    expect(validateManifest({ ...base, permissions: { storage: true } }).ok).toBe(true);
    expect(validateManifest({ ...base, permissions: { storage: 'yes' } }).ok).toBe(false);
  });
});

