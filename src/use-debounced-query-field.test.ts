import { computed, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  defineQuerySchema,
  enumParam,
  numberParam,
  stringParam,
  useDebouncedQueryField,
  type QueryObject,
  type QueryPatchOptions,
  type QueryStateInput,
  type UseQueryStateReturn,
} from './index';

const schema = defineQuerySchema({
  search: stringParam(),
  page: numberParam({ defaultValue: 1 }),
  status: enumParam(['active', 'blocked'] as const),
});

type SchemaState = UseQueryStateReturn<typeof schema>['state']['value'];

function createMockQuery(initialState: SchemaState): {
  query: UseQueryStateReturn<typeof schema>;
  stateRef: ReturnType<typeof ref<SchemaState>>;
  patchSpy: ReturnType<typeof vi.fn>;
} {
  const stateRef = ref(initialState);
  const patchSpy = vi.fn(
    async (_patch: QueryStateInput<typeof schema>, _options?: QueryPatchOptions) => undefined,
  );

  return {
    query: {
      state: computed(() => stateRef.value),
      raw: computed(() => ({} as QueryObject)),
      patch: patchSpy,
      remove: async () => undefined,
      reset: async () => undefined,
      serialize: () => ({}),
      deserialize: () => stateRef.value,
    },
    stateRef,
    patchSpy,
  };
}

function createRejectedPatchSpy() {
  return vi.fn(async (_patch: QueryStateInput<typeof schema>, _options?: QueryPatchOptions) => {
    throw new Error('Navigation failed');
  });
}

describe('useDebouncedQueryField', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes local ref from query state', () => {
    const { query } = createMockQuery({
      search: 'anton',
      page: 2,
      status: 'active',
    });

    const searchField = useDebouncedQueryField(query, 'search');
    expect(searchField.value).toBe('anton');
  });

  it('setting ref does not call query.patch immediately', () => {
    const { query, patchSpy } = createMockQuery({
      search: undefined,
      page: 1,
      status: undefined,
    });

    const searchField = useDebouncedQueryField(query, 'search');
    searchField.value = 'anton';

    expect(patchSpy).not.toHaveBeenCalled();
  });

  it('setting ref calls query.patch after debounce delay', () => {
    const { query, patchSpy } = createMockQuery({
      search: undefined,
      page: 1,
      status: undefined,
    });

    const searchField = useDebouncedQueryField(query, 'search', { debounce: 200 });
    searchField.value = 'anton';

    vi.advanceTimersByTime(199);
    expect(patchSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(patchSpy).toHaveBeenCalledWith({ search: 'anton' }, { history: undefined, preserveUnknown: undefined, cleanDefaults: undefined });
  });

  it('multiple quick changes call query.patch once with latest value', () => {
    const { query, patchSpy } = createMockQuery({
      search: undefined,
      page: 1,
      status: undefined,
    });

    const searchField = useDebouncedQueryField(query, 'search', { debounce: 200 });
    searchField.value = 'a';
    vi.advanceTimersByTime(100);
    searchField.value = 'an';
    vi.advanceTimersByTime(100);
    searchField.value = 'anton';

    vi.advanceTimersByTime(199);
    expect(patchSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(patchSpy).toHaveBeenCalledTimes(1);
    expect(patchSpy).toHaveBeenCalledWith(
      { search: 'anton' },
      { history: undefined, preserveUnknown: undefined, cleanDefaults: undefined },
    );
  });

  it('includes resetOnChange values', () => {
    const { query, patchSpy } = createMockQuery({
      search: undefined,
      page: 3,
      status: 'active',
    });

    const searchField = useDebouncedQueryField(query, 'search', {
      debounce: 100,
      resetOnChange: { page: 1 },
    });
    searchField.value = 'anton';

    vi.advanceTimersByTime(100);
    expect(patchSpy).toHaveBeenCalledWith(
      { page: 1, search: 'anton' },
      { history: undefined, preserveUnknown: undefined, cleanDefaults: undefined },
    );
  });

  it('forwards options like history, preserveUnknown, cleanDefaults', () => {
    const { query, patchSpy } = createMockQuery({
      search: undefined,
      page: 1,
      status: undefined,
    });

    const searchField = useDebouncedQueryField(query, 'search', {
      debounce: 100,
      history: 'push',
      preserveUnknown: false,
      cleanDefaults: false,
    });
    searchField.value = 'anton';

    vi.advanceTimersByTime(100);
    expect(patchSpy).toHaveBeenCalledWith(
      { search: 'anton' },
      { history: 'push', preserveUnknown: false, cleanDefaults: false },
    );
  });

  it('uses default debounce 300ms', () => {
    const { query, patchSpy } = createMockQuery({
      search: undefined,
      page: 1,
      status: undefined,
    });

    const searchField = useDebouncedQueryField(query, 'search');
    searchField.value = 'anton';

    vi.advanceTimersByTime(299);
    expect(patchSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(patchSpy).toHaveBeenCalledTimes(1);
  });

  it('supports custom debounce value', () => {
    const { query, patchSpy } = createMockQuery({
      search: undefined,
      page: 1,
      status: undefined,
    });

    const searchField = useDebouncedQueryField(query, 'search', { debounce: 50 });
    searchField.value = 'anton';

    vi.advanceTimersByTime(49);
    expect(patchSpy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(patchSpy).toHaveBeenCalledTimes(1);
  });

  it('external query.state change syncs local ref', async () => {
    const { query, stateRef } = createMockQuery({
      search: 'old',
      page: 2,
      status: 'active',
    });

    const searchField = useDebouncedQueryField(query, 'search');
    expect(searchField.value).toBe('old');

    stateRef.value = {
      search: 'external',
      page: 3,
      status: 'blocked',
    };
    await nextTick();

    expect(searchField.value).toBe('external');
  });

  it('external sync does not immediately trigger query.patch loop', async () => {
    const { query, stateRef, patchSpy } = createMockQuery({
      search: 'old',
      page: 2,
      status: 'active',
    });

    useDebouncedQueryField(query, 'search');
    stateRef.value = {
      search: 'external',
      page: 2,
      status: 'active',
    };
    await nextTick();
    vi.advanceTimersByTime(300);

    expect(patchSpy).not.toHaveBeenCalled();
  });

  it('debounced setter still calls query.patch when patch promise rejects', async () => {
    const stateRef = ref<SchemaState>({
      search: undefined,
      page: 1,
      status: undefined,
    });
    const patchSpy = createRejectedPatchSpy();
    const query: UseQueryStateReturn<typeof schema> = {
      state: computed(() => stateRef.value),
      raw: computed(() => ({} as QueryObject)),
      patch: patchSpy,
      remove: async () => undefined,
      reset: async () => undefined,
      serialize: () => ({}),
      deserialize: () => stateRef.value,
    };

    const searchField = useDebouncedQueryField(query, 'search', { debounce: 100 });
    searchField.value = 'anton';
    vi.advanceTimersByTime(100);

    expect(patchSpy).toHaveBeenCalledTimes(1);
    const patchPromise = patchSpy.mock.results[0]?.value as Promise<unknown>;
    await expect(patchPromise).rejects.toThrow('Navigation failed');
  });

  it('calls onError when debounced query.patch rejects', async () => {
    const stateRef = ref<SchemaState>({
      search: undefined,
      page: 1,
      status: undefined,
    });
    const patchSpy = createRejectedPatchSpy();
    const onError = vi.fn();
    const query: UseQueryStateReturn<typeof schema> = {
      state: computed(() => stateRef.value),
      raw: computed(() => ({} as QueryObject)),
      patch: patchSpy,
      remove: async () => undefined,
      reset: async () => undefined,
      serialize: () => ({}),
      deserialize: () => stateRef.value,
    };

    const searchField = useDebouncedQueryField(query, 'search', { debounce: 100, onError });
    searchField.value = 'anton';
    vi.advanceTimersByTime(100);

    expect(patchSpy).toHaveBeenCalledTimes(1);
    const patchPromise = patchSpy.mock.results[0]?.value as Promise<unknown>;
    await expect(patchPromise).rejects.toThrow('Navigation failed');
    await Promise.resolve();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
  });

  it('swallows debounced rejected patch when onError is not provided', async () => {
    const stateRef = ref<SchemaState>({
      search: undefined,
      page: 1,
      status: undefined,
    });
    const patchSpy = createRejectedPatchSpy();
    const query: UseQueryStateReturn<typeof schema> = {
      state: computed(() => stateRef.value),
      raw: computed(() => ({} as QueryObject)),
      patch: patchSpy,
      remove: async () => undefined,
      reset: async () => undefined,
      serialize: () => ({}),
      deserialize: () => stateRef.value,
    };

    const searchField = useDebouncedQueryField(query, 'search', { debounce: 100 });
    searchField.value = 'anton';
    vi.advanceTimersByTime(100);

    expect(patchSpy).toHaveBeenCalledTimes(1);
    await Promise.resolve();
  });
});
