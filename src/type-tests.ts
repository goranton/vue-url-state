import {
  arrayParam,
  booleanParam,
  deserializeQuery,
  defineQuerySchema,
  enumParam,
  numberParam,
  patchQuery,
  removeQueryKeys,
  resetQuery,
  serializeQuery,
  stringParam,
  useQueryState,
  type InferQuerySchema,
  type QueryObject,
} from './index';
import type { ComputedRef } from 'vue';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2)
  ? true
  : false;
type Expect<T extends true> = T;

const schema = defineQuerySchema({
  search: stringParam(),
  page: numberParam({ defaultValue: 1 }),
  status: enumParam(['active', 'blocked', 'pending'] as const),
  tags: arrayParam(stringParam()),
  onlyWithErrors: booleanParam(),
});

type State = InferQuerySchema<typeof schema>;
type _TestBasicSchemaInference = Expect<
  Equal<
    State,
    {
      search: string | undefined;
      page: number;
      status: 'active' | 'blocked' | 'pending' | undefined;
      tags: string[] | undefined;
      onlyWithErrors: boolean | undefined;
    }
  >
>;

const schemaWithDefaults = defineQuerySchema({
  search: stringParam({ defaultValue: '' }),
  page: numberParam({ defaultValue: 1 }),
  enabled: booleanParam({ defaultValue: false }),
  tags: arrayParam(stringParam(), { defaultValue: [] }),
});

type SchemaWithDefaultsState = InferQuerySchema<typeof schemaWithDefaults>;
type _TestDefaultsRemoveUndefined = Expect<
  Equal<
    SchemaWithDefaultsState,
    {
      search: string;
      page: number;
      enabled: boolean;
      tags: string[];
    }
  >
>;

const enumSchema = defineQuerySchema({
  status: enumParam(['active', 'blocked'] as const, {
    defaultValue: 'active',
  }),
});

type EnumSchemaState = InferQuerySchema<typeof enumSchema>;
type _TestEnumWithDefault = Expect<
  Equal<
    EnumSchemaState,
    {
      status: 'active' | 'blocked';
    }
  >
>;

const enumSchemaNoDefault = defineQuerySchema({
  status: enumParam(['active', 'blocked'] as const),
});

type EnumSchemaNoDefaultState = InferQuerySchema<typeof enumSchemaNoDefault>;
type _TestEnumWithoutDefault = Expect<
  Equal<
    EnumSchemaNoDefaultState,
    {
      status: 'active' | 'blocked' | undefined;
    }
  >
>;

const arraySchema = defineQuerySchema({
  tags: arrayParam(stringParam()),
  ids: arrayParam(numberParam()),
});

type ArraySchemaState = InferQuerySchema<typeof arraySchema>;
type _TestArrayInference = Expect<
  Equal<
    ArraySchemaState,
    {
      tags: string[] | undefined;
      ids: number[] | undefined;
    }
  >
>;

const deserializedState = deserializeQuery(
  defineQuerySchema({
    search: stringParam(),
    page: numberParam({ defaultValue: 1 }),
  }),
  {
    search: 'anton',
    page: '2',
    unknown: 'ignored',
  },
);

type DeserializedState = typeof deserializedState;
type _TestDeserializeReturnType = Expect<
  Equal<
    DeserializedState,
    {
      search: string | undefined;
      page: number;
    }
  >
>;

serializeQuery(
  defineQuerySchema({
    search: stringParam(),
    page: numberParam({ defaultValue: 1 }),
  }),
  {
    search: 'anton',
  },
);

serializeQuery(
  defineQuerySchema({
    page: numberParam({ defaultValue: 1 }),
  }),
  {
    page: undefined,
  },
);

const enumOnlySchema = defineQuerySchema({
  status: enumParam(['active', 'blocked'] as const),
});

serializeQuery(enumOnlySchema, {
  // @ts-expect-error invalid enum value for schema
  status: 'pending',
});

serializeQuery(
  defineQuerySchema({
    search: stringParam(),
    page: numberParam({ defaultValue: 1 }),
  }),
  {
    // @ts-expect-error page must be number
    page: '1',
  },
);

patchQuery(
  defineQuerySchema({
    search: stringParam(),
    page: numberParam({ defaultValue: 1 }),
  }),
  {
    search: 'old',
    page: '2',
  },
  {
    search: 'anton',
  },
);

patchQuery(
  defineQuerySchema({
    page: numberParam({ defaultValue: 1 }),
  }),
  {
    page: '2',
  },
  {
    page: undefined,
  },
);

patchQuery(
  defineQuerySchema({
    status: enumParam(['active', 'blocked'] as const),
  }),
  {
    status: 'active',
  },
  {
    // @ts-expect-error invalid enum value in patch
    status: 'pending',
  },
);

removeQueryKeys(
  defineQuerySchema({
    search: stringParam(),
    page: numberParam({ defaultValue: 1 }),
  }),
  {
    search: 'anton',
    page: '2',
  },
  ['search'],
);

removeQueryKeys(
  defineQuerySchema({
    search: stringParam(),
    page: numberParam({ defaultValue: 1 }),
  }),
  {
    search: 'anton',
    page: '2',
  },
  [
    // @ts-expect-error key is not part of schema
    'status',
  ],
);

const resetResult = resetQuery(
  defineQuerySchema({
    search: stringParam(),
    page: numberParam({ defaultValue: 1 }),
  }),
  {
    search: 'anton',
    page: '2',
    utm_source: 'x',
  },
);

type _TestResetQueryReturnsQueryObject = Expect<Equal<typeof resetResult, QueryObject>>;

const useQueryStateSchema = defineQuerySchema({
  search: stringParam(),
  page: numberParam({ defaultValue: 1 }),
  status: enumParam(['active', 'blocked'] as const),
});

const useQueryStateResult = useQueryState(useQueryStateSchema, {
  route: {
    query: {},
  } as never,
  router: {
    replace: async () => undefined,
    push: async () => undefined,
  } as never,
});

type _TestUseQueryStateStateRef = Expect<
  Equal<
    typeof useQueryStateResult.state,
    ComputedRef<InferQuerySchema<typeof useQueryStateSchema>>
  >
>;

useQueryStateResult.patch({
  search: 'anton',
});

useQueryStateResult.patch({
  page: undefined,
});

useQueryStateResult.patch({
  // @ts-expect-error invalid enum value in patch
  status: 'pending',
});

useQueryStateResult.remove(['search']);
useQueryStateResult.remove([
  // @ts-expect-error key is not part of schema
  'unknown',
]);

enumParam(['active', 'blocked'] as const, {
  // @ts-expect-error invalid enum default
  defaultValue: 'pending',
});

type MainState = InferQuerySchema<typeof schema>;

const validState: MainState = {
  search: undefined,
  page: 1,
  status: 'active',
  tags: ['frontend'],
  onlyWithErrors: true,
};

const invalidStatePage: MainState = {
  search: undefined,
  // @ts-expect-error page must be number
  page: undefined,
  status: 'active',
  tags: ['frontend'],
  onlyWithErrors: true,
};

const invalidStateStatus: MainState = {
  search: undefined,
  page: 1,
  // @ts-expect-error status must be one of enum values
  status: 'deleted',
  tags: ['frontend'],
  onlyWithErrors: true,
};

void validState;
