import { reactive } from 'vue';
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router';
import { describe, expect, it, vi } from 'vitest';

import {
  arrayParam,
  defineQuerySchema,
  numberParam,
  serializeQuery,
  stringParam,
  useQueryState,
} from './index';

function createMockRouter() {
  return {
    replace: vi.fn().mockResolvedValue(undefined),
    push: vi.fn().mockResolvedValue(undefined),
  } as unknown as Router;
}

function createMockRoute(query: RouteLocationNormalizedLoaded['query']) {
  return reactive({
    query,
  }) as RouteLocationNormalizedLoaded;
}

describe('useQueryState', () => {
  it('state deserializes route.query', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });
    const route = createMockRoute({ search: 'anton', page: '2' });
    const router = createMockRouter();

    const query = useQueryState(schema, { route, router });

    expect(query.state.value).toEqual({
      search: 'anton',
      page: 2,
    });
  });

  it('state updates when route.query changes', () => {
    const schema = defineQuerySchema({
      page: numberParam({ defaultValue: 1 }),
    });
    const route = createMockRoute({ page: '2' });
    const router = createMockRouter();
    const query = useQueryState(schema, { route, router });

    route.query = { page: '3' };

    expect(query.state.value.page).toBe(3);
  });

  it('raw normalizes null values from Vue Router query', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      tags: arrayParam(stringParam()),
    });
    const route = createMockRoute({
      search: null,
      tags: ['vue', null, 'nuxt'],
    });
    const router = createMockRouter();
    const query = useQueryState(schema, { route, router });

    expect(query.raw.value).toEqual({
      search: undefined,
      tags: ['vue', 'nuxt'],
    });
  });

  it('patch uses router.replace by default', async () => {
    const schema = defineQuerySchema({
      search: stringParam(),
    });
    const route = createMockRoute({});
    const router = createMockRouter();
    const query = useQueryState(schema, { route, router });

    await query.patch({ search: 'anton' });

    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith({
      query: { search: 'anton' },
    });
    expect(router.push).not.toHaveBeenCalled();
  });

  it('patch can use push via composable option', async () => {
    const schema = defineQuerySchema({
      search: stringParam(),
    });
    const route = createMockRoute({});
    const router = createMockRouter();
    const query = useQueryState(schema, { route, router, history: 'push' });

    await query.patch({ search: 'anton' });

    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('patch can override history per call', async () => {
    const schema = defineQuerySchema({
      search: stringParam(),
    });
    const route = createMockRoute({});
    const router = createMockRouter();
    const query = useQueryState(schema, { route, router, history: 'replace' });

    await query.patch({ search: 'anton' }, { history: 'push' });

    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('patch preserves unknown query keys by default', async () => {
    const schema = defineQuerySchema({
      page: numberParam({ defaultValue: 1 }),
    });
    const route = createMockRoute({ page: '2', utm_source: 'x' });
    const router = createMockRouter();
    const query = useQueryState(schema, { route, router });

    await query.patch({ page: 1 });

    expect(router.replace).toHaveBeenCalledWith({
      query: { utm_source: 'x' },
    });
  });

  it('patch drops unknown keys with preserveUnknown: false', async () => {
    const schema = defineQuerySchema({
      search: stringParam(),
    });
    const route = createMockRoute({ search: 'old', utm_source: 'x' });
    const router = createMockRouter();
    const query = useQueryState(schema, { route, router });

    await query.patch({ search: 'new' }, { preserveUnknown: false });

    expect(router.replace).toHaveBeenCalledWith({
      query: { search: 'new' },
    });
  });

  it('remove removes selected schema keys and preserves unknown keys', async () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });
    const route = createMockRoute({
      search: 'anton',
      page: '2',
      utm_source: 'x',
    });
    const router = createMockRouter();
    const query = useQueryState(schema, { route, router });

    await query.remove(['search']);

    expect(router.replace).toHaveBeenCalledWith({
      query: {
        page: '2',
        utm_source: 'x',
      },
    });
  });

  it('reset removes all schema keys and preserves unknown keys', async () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });
    const route = createMockRoute({
      search: 'anton',
      page: '2',
      utm_source: 'x',
    });
    const router = createMockRouter();
    const query = useQueryState(schema, { route, router });

    await query.reset();

    expect(router.replace).toHaveBeenCalledWith({
      query: { utm_source: 'x' },
    });
  });

  it('serialize delegates to serializeQuery behavior', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });
    const route = createMockRoute({});
    const router = createMockRouter();
    const query = useQueryState(schema, { route, router });

    expect(
      query.serialize({
        search: 'anton',
        page: 1,
      }),
    ).toEqual(
      serializeQuery(schema, {
        search: 'anton',
        page: 1,
      }),
    );
  });

  it('deserialize delegates to deserializeQuery behavior', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });
    const route = createMockRoute({});
    const router = createMockRouter();
    const query = useQueryState(schema, { route, router });

    expect(
      query.deserialize({
        search: 'anton',
        page: '2',
      }),
    ).toEqual({
      search: 'anton',
      page: 2,
    });
  });
});

