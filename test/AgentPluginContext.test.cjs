const { AgentPluginContext, createLoFacade } = require('../src/AgentPluginContext.cjs');
const AgentEventEmitter = require('../src/AgentEventEmitter.cjs');

describe('AgentPluginContext', () => {
  it('pluginId 透传', () => {
    const ctx = new AgentPluginContext({ pluginId: 'my-plugin' });
    expect(ctx.pluginId).toBe('my-plugin');
  });

  it('config() 返回全部/单 key/默认值', () => {
    const ctx = new AgentPluginContext({ config: { a: 1, b: 2 } });
    expect(ctx.config()).toEqual({ a: 1, b: 2 });
    expect(ctx.config('a')).toBe(1);
    expect(ctx.config('nope', 'def')).toBe('def');
    expect(ctx.config('nope')).toBeUndefined();
  });

  it('未注入 config 时返回空对象', () => {
    const ctx = new AgentPluginContext({});
    expect(ctx.config()).toEqual({});
  });

  it('logger 未注入时返回 noop(可调用不抛错)', () => {
    const ctx = new AgentPluginContext({});
    expect(() => ctx.logger.info('x')).not.toThrow();
    expect(() => ctx.logger.child({}).debug('y')).not.toThrow();
  });

  it('events 未注入时返回 noop 事件', () => {
    const ctx = new AgentPluginContext({});
    expect(ctx.events.on('a', () => {})).toEqual(expect.any(Function));
    expect(() => ctx.events.emit('a')).not.toThrow();
  });

  it('lo 未注入时调用抛错', () => {
    const ctx = new AgentPluginContext({});
    expect(() => ctx.lo.notes.list()).toThrow(/lo 能力未注入/);
    expect(() => ctx.lo.search.search('x')).toThrow(/lo 能力未注入/);
  });

  it('注入 client 后 lo 门面透传命名空间', () => {
    const client = {
      notes: { list: jest.fn() },
      search: { search: jest.fn() },
      schemas: { list: jest.fn() },
      views: {},
      workflows: {},
      automations: {},
      evolution: {},
      sync: {},
      admin: {},
      health: {},
    };
    const ctx = new AgentPluginContext({ client });
    expect(ctx.lo.notes).toBe(client.notes);
    expect(ctx.lo.search).toBe(client.search);
    ctx.lo.notes.list();
    expect(client.notes.list).toHaveBeenCalled();
  });
});

describe('createLoFacade', () => {
  it('只透传白名单命名空间', () => {
    const client = {
      notes: {},
      search: {},
      schemas: {},
      views: {},
      workflows: {},
      automations: {},
      evolution: {},
      sync: {},
      admin: {},
      health: {},
      request: jest.fn(),
      _opts: { secret: true },
    };
    const facade = createLoFacade(client);
    expect(facade.notes).toBe(client.notes);
    expect(facade.health).toBe(client.health);
    expect(facade.request).toBeUndefined();
    expect(facade._opts).toBeUndefined();
  });
});

describe('AgentPluginContext + AgentEventEmitter 集成', () => {
  it('注入的事件总线可正常订阅发布', async () => {
    const bus = new AgentEventEmitter();
    const ctx = new AgentPluginContext({ events: bus });
    const handler = jest.fn();
    ctx.events.on('resource.created', handler);
    ctx.events.emit('resource.created', { rid: 'res_1' });
    expect(handler).toHaveBeenCalledWith({ rid: 'res_1' });
  });
});
