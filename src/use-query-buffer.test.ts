import { nextTick, reactive } from 'vue';
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router';
import { describe, expect, it, vi } from 'vitest';

import {
  arrayParam,
  defineQuerySchema,
  numberParam,
  stringParam,
  useQueryBuffer,
  useQueryState,
} from './index';

function createMockRoute(query: RouteLocationNormalizedLoaded['query']) {
  return reactive({
    query,
  }) as RouteLocationNormalizedLoaded;
}

function createMockRouter(route: RouteLocationNormalizedLoaded) {
  return {
    replace: vi.fn().mockImplementation(async ({ query }: { query: RouteLocationNormalizedLoaded['query'] }) => {
      route.query = query;
    }),
    push: vi.fn().mockImplementation(async ({ query }: { query: RouteLocationNormalizedLoaded['query'] }) => {
      route.query = query;
    }),
  } as unknown as Router;
}

describe('useQueryBuffer', () => {
  it('initializes draft from applied query state', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });
    const route = createMockRoute({ search: 'anton', page: '2' });
    const router = createMockRouter(route);
    const query = useQueryState(schema, { route, router });
    const buffer = useQueryBuffer(query);

    expect(buffer.draft.value).toEqual({
      search: 'anton',
      page: 2,
    });
  });

  it('patch updates draft but does not navigate', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
    });
    const route = createMockRoute({ search: 'anton' });
    const router = createMockRouter(route);
    const query = useQueryState(schema, { route, router });
    const buffer = useQueryBuffer(query);

    buffer.patch({ search: 'new' });

    expect(buffer.draft.value.search).toBe('new');
    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('isDirty is false initially and true after draft patch', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
    });
    const route = createMockRoute({ search: 'anton' });
    const router = createMockRouter(route);
    const query = useQueryState(schema, { route, router });
    const buffer = useQueryBuffer(query);

    expect(buffer.isDirty.value).toBe(false);

    buffer.patch({ search: 'new' });

    expect(buffer.isDirty.value).toBe(true);
  });

  it('reset restores draft from applied and clears dirty flag', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
    });
    const route = createMockRoute({ search: 'anton' });
    const router = createMockRouter(route);
    const query = useQueryState(schema, { route, router });
    const buffer = useQueryBuffer(query);

    buffer.patch({ search: 'new' });
    expect(buffer.isDirty.value).toBe(true);

    buffer.reset();

    expect(buffer.draft.value).toEqual({
      search: 'anton',
    });
    expect(buffer.isDirty.value).toBe(false);
  });

  it('clear sets draft to default and empty state via deserialize({})', () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
      tags: arrayParam(stringParam()),
    });
    const route = createMockRoute({ search: 'anton', page: '2', tags: ['vue'] });
    const router = createMockRouter(route);
    const query = useQueryState(schema, { route, router });
    const buffer = useQueryBuffer(query);

    buffer.clear();

    expect(buffer.draft.value).toEqual({
      search: undefined,
      page: 1,
      tags: undefined,
    });
  });

  it('apply calls query patch flow and navigates with draft values', async () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });
    const route = createMockRoute({ search: 'old', page: '2' });
    const router = createMockRouter(route);
    const query = useQueryState(schema, { route, router });
    const buffer = useQueryBuffer(query);

    buffer.patch({ search: 'anton', page: 1 });
    await buffer.apply();

    expect(router.replace).toHaveBeenCalledWith({
      query: {
        search: 'anton',
      },
    });
    expect(buffer.draft.value).toEqual({
      search: 'anton',
      page: 1,
    });
  });

  it('apply passes per-call options to query.patch', async () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });
    const route = createMockRoute({ search: 'old', page: '2' });
    const router = createMockRouter(route);
    const query = useQueryState(schema, { route, router, history: 'replace' });
    const buffer = useQueryBuffer(query);

    buffer.patch({ search: 'anton', page: 1 });
    await buffer.apply({ history: 'push', preserveUnknown: false, cleanDefaults: false });

    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith({
      query: {
        search: 'anton',
        page: '1',
      },
    });
  });

  it('draft arrays do not share references with applied arrays', () => {
    const schema = defineQuerySchema({
      tags: arrayParam(stringParam()),
    });
    const route = createMockRoute({ tags: ['vue', 'nuxt'] });
    const router = createMockRouter(route);
    const query = useQueryState(schema, { route, router });
    const buffer = useQueryBuffer(query);

    expect(buffer.draft.value.tags).toEqual(['vue', 'nuxt']);
    expect(buffer.draft.value.tags).not.toBe(query.state.value.tags);
  });

  it("external changes sync draft when mode is 'when-clean' and draft is clean", async () => {
    const schema = defineQuerySchema({
      page: numberParam({ defaultValue: 1 }),
    });
    const route = createMockRoute({ page: '2' });
    const router = createMockRouter(route);
    const query = useQueryState(schema, { route, router });
    const buffer = useQueryBuffer(query, { syncOnExternalChange: 'when-clean' });

    route.query = { page: '3' };
    await nextTick();

    expect(buffer.draft.value.page).toBe(3);
  });

  it("external changes do not overwrite draft when mode is 'when-clean' and draft is dirty", async () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });
    const route = createMockRoute({ search: 'old', page: '2' });
    const router = createMockRouter(route);
    const query = useQueryState(schema, { route, router });
    const buffer = useQueryBuffer(query, { syncOnExternalChange: 'when-clean' });

    buffer.patch({ search: 'draft' });
    route.query = { search: 'external', page: '3' };
    await nextTick();

    expect(buffer.draft.value).toEqual({
      search: 'draft',
      page: 2,
    });
  });

  it("external changes always overwrite draft when mode is 'always'", async () => {
    const schema = defineQuerySchema({
      search: stringParam(),
      page: numberParam({ defaultValue: 1 }),
    });
    const route = createMockRoute({ search: 'old', page: '2' });
    const router = createMockRouter(route);
    const query = useQueryState(schema, { route, router });
    const buffer = useQueryBuffer(query, { syncOnExternalChange: 'always' });

    buffer.patch({ search: 'draft' });
    route.query = { search: 'external', page: '3' };
    await nextTick();

    expect(buffer.draft.value).toEqual({
      search: 'external',
      page: 3,
    });
  });

  it("external changes never overwrite draft when mode is 'never'", async () => {
    const schema = defineQuerySchema({
      page: numberParam({ defaultValue: 1 }),
    });
    const route = createMockRoute({ page: '2' });
    const router = createMockRouter(route);
    const query = useQueryState(schema, { route, router });
    const buffer = useQueryBuffer(query, { syncOnExternalChange: 'never' });

    route.query = { page: '3' };
    await nextTick();

    expect(buffer.draft.value.page).toBe(2);
  });
});
