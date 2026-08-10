const { AgentPluginContext } = require('../src/AgentPluginContext.cjs');
const { createExtensionsFacade, EXTENSIONS_METHODS } = require('../src/extensions-facade.cjs');

describe('extensions-facade', () => {
  it('未注入实现时调用抛错', () => {
    const ctx = new AgentPluginContext({});
    expect(() => ctx.extensions.registerCommands([{ id: 'x', handler: () => {} }])).toThrow(/未注入/);
    expect(() => ctx.extensions.registerView({})).toThrow(/未注入/);
  });

  it('注入 extensionsImpl 后透传契约方法', () => {
    const registerCommands = jest.fn();
    const ctx = new AgentPluginContext({
      extensionsImpl: { registerCommands },
    });
    const defs = [{ id: 'demo.hello', title: 'Hello', handler: () => 'hi' }];
    ctx.extensions.registerCommands(defs);
    expect(registerCommands).toHaveBeenCalledWith(defs);
  });

  it('extensionsImpl 只透传契约方法，不透传未声明方法', () => {
    const ctx = new AgentPluginContext({
      extensionsImpl: { registerCommands: jest.fn(), hidden: jest.fn() },
    });
    expect(ctx.extensions.hidden).toBeUndefined();
    expect(typeof ctx.extensions.registerCommands).toBe('function');
  });

  it('EXTENSIONS_METHODS 导出契约方法白名单', () => {
    expect(EXTENSIONS_METHODS).toEqual([
      'registerCommands',
      'registerView',
      'registerPanel',
      'registerEditor',
      'registerService',
    ]);
  });

  it('createExtensionsFacade 直接构造门面', () => {
    const reg = jest.fn();
    const facade = createExtensionsFacade({ registerCommands: reg }, { pluginId: 'p' });
    facade.registerCommands([{ id: 'a', handler: () => {} }]);
    expect(reg).toHaveBeenCalled();
    expect(() => facade.registerView({})).toThrow(/未注入/);
  });
});
