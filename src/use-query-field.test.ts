import { computed, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import {
  defineQuerySchema,
  enumParam,
  numberParam,
  stringParam,
  useQueryField,
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

type SchemaState = typeof schema extends infer T
  ? T extends object
    ? UseQueryStateReturn<typeof schema>['state']['value']
    : never
  : never;

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

describe('useQueryField', () => {
  it('getter returns current query state field', () => {
    const { query } = createMockQuery({
      search: 'anton',
      page: 2,
      status: 'active',
    });

    const searchField = useQueryField(query, 'search');

    expect(searchField.value).toBe('anton');
  });

  it('setter calls query.patch with changed field', () => {
    const { query, patchSpy } = createMockQuery({
      search: undefined,
      page: 1,
      status: undefined,
    });

    const searchField = useQueryField(query, 'search');
    searchField.value = 'anton';

    expect(patchSpy).toHaveBeenCalledTimes(1);
    expect(patchSpy).toHaveBeenCalledWith({ search: 'anton' }, undefined);
  });

  it('setter includes resetOnChange values', () => {
    const { query, patchSpy } = createMockQuery({
      search: undefined,
      page: 3,
      status: 'active',
    });

    const searchField = useQueryField(query, 'search', {
      resetOnChange: {
        page: 1,
      },
    });
    searchField.value = 'anton';

    expect(patchSpy).toHaveBeenCalledWith(
      {
        page: 1,
        search: 'anton',
      },
      {
        history: undefined,
        preserveUnknown: undefined,
        cleanDefaults: undefined,
      },
    );
  });

  it('setter forwards options like history, preserveUnknown, and cleanDefaults', () => {
    const { query, patchSpy } = createMockQuery({
      search: undefined,
      page: 1,
      status: undefined,
    });

    const searchField = useQueryField(query, 'search', {
      history: 'push',
      preserveUnknown: false,
      cleanDefaults: false,
    });
    searchField.value = 'anton';

    expect(patchSpy).toHaveBeenCalledWith(
      { search: 'anton' },
      {
        history: 'push',
        preserveUnknown: false,
        cleanDefaults: false,
      },
    );
  });

  it('returned ref updates when query.state changes externally', () => {
    const { query, stateRef } = createMockQuery({
      search: 'anton',
      page: 2,
      status: 'active',
    });

    const pageField = useQueryField(query, 'page');
    expect(pageField.value).toBe(2);

    stateRef.value = {
      search: 'anton',
      page: 5,
      status: 'blocked',
    };

    expect(pageField.value).toBe(5);
  });
});
