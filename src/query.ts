import type { InferQuerySchema, QuerySchema, QueryPrimitive } from './types';
import { getSchemaMeta } from './internal/schema-meta';
import { isSameValue } from './internal/value';

export type QueryValue = QueryPrimitive;
export type QueryObject = Record<string, QueryValue>;

export type SerializeQueryOptions = {
  cleanDefaults?: boolean;
};

export type QueryMutationOptions = SerializeQueryOptions & {
  preserveUnknown?: boolean;
};

export type QueryStateInput<TSchema extends QuerySchema> = Partial<{
  [K in keyof InferQuerySchema<TSchema>]: InferQuerySchema<TSchema>[K] | undefined;
}>;

function getUnknownQuery<TSchema extends QuerySchema>(
  schema: TSchema,
  query: QueryObject,
): QueryObject {
  const { keySet } = getSchemaMeta(schema);
  const result: QueryObject = {};

  for (const key of Object.keys(query)) {
    if (!keySet.has(key)) {
      result[key] = query[key];
    }
  }

  return result;
}

export function deserializeQuery<TSchema extends QuerySchema>(
  schema: TSchema,
  query: QueryObject,
): InferQuerySchema<TSchema> {
  const result = {} as InferQuerySchema<TSchema>;
  const { keys } = getSchemaMeta(schema);

  for (const key of keys) {
    const descriptor = schema[key];
    const parsed = descriptor.deserialize(query[key as string]);
    const value =
      parsed === undefined && descriptor.meta.defaultValue !== undefined
        ? descriptor.meta.defaultValue
        : parsed;

    (result as Record<keyof TSchema, unknown>)[key] = value;
  }

  return result;
}

export function serializeQuery<TSchema extends QuerySchema>(
  schema: TSchema,
  state: QueryStateInput<TSchema>,
  options: SerializeQueryOptions = {},
): QueryObject {
  const cleanDefaults = options.cleanDefaults ?? true;
  const result: QueryObject = {};
  const { keys } = getSchemaMeta(schema);

  for (const key of keys) {
    const descriptor = schema[key];
    const value = state[key];

    if (value === undefined) {
      continue;
    }

    if (cleanDefaults && isSameValue(value, descriptor.meta.defaultValue)) {
      continue;
    }

    const serialized = descriptor.serialize(value);
    if (serialized === undefined) {
      continue;
    }

    if (Array.isArray(serialized) && serialized.length === 0) {
      continue;
    }

    result[key as string] = serialized;
  }

  return result;
}

export function patchQuery<TSchema extends QuerySchema>(
  schema: TSchema,
  currentQuery: QueryObject,
  patch: QueryStateInput<TSchema>,
  options: QueryMutationOptions = {},
): QueryObject {
  const cleanDefaults = options.cleanDefaults ?? true;
  const preserveUnknown = options.preserveUnknown ?? true;
  const currentState = deserializeQuery(schema, currentQuery);
  const nextState = { ...currentState, ...patch };
  const serialized = serializeQuery(schema, nextState, { cleanDefaults });

  if (!preserveUnknown) {
    return serialized;
  }

  return {
    ...getUnknownQuery(schema, currentQuery),
    ...serialized,
  };
}

export function removeQueryKeys<TSchema extends QuerySchema>(
  schema: TSchema,
  currentQuery: QueryObject,
  keys: readonly (keyof InferQuerySchema<TSchema>)[],
  options: Pick<QueryMutationOptions, 'preserveUnknown'> = {},
): QueryObject {
  const preserveUnknown = options.preserveUnknown ?? true;
  const { keySet } = getSchemaMeta(schema);
  const removedKeySet = new Set<string>(keys as readonly string[]);
  const result: QueryObject = {};

  for (const key of Object.keys(currentQuery)) {
    const isSchemaKey = keySet.has(key);

    if (!isSchemaKey && !preserveUnknown) {
      continue;
    }

    if (isSchemaKey && removedKeySet.has(key)) {
      continue;
    }

    result[key] = currentQuery[key];
  }

  return result;
}

export function resetQuery<TSchema extends QuerySchema>(
  schema: TSchema,
  currentQuery: QueryObject,
  options: Pick<QueryMutationOptions, 'preserveUnknown'> = {},
): QueryObject {
  const preserveUnknown = options.preserveUnknown ?? true;

  if (!preserveUnknown) {
    return {};
  }

  return getUnknownQuery(schema, currentQuery);
}
