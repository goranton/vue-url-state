import type { InferQuerySchema, QuerySchema, QueryPrimitive } from './types';

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

function isSameValue(left: unknown, right: unknown): boolean {
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }

    for (let i = 0; i < left.length; i += 1) {
      if (!Object.is(left[i], right[i])) {
        return false;
      }
    }

    return true;
  }

  return Object.is(left, right);
}

function getSchemaKeySet<TSchema extends QuerySchema>(schema: TSchema): Set<string> {
  return new Set<string>(Object.keys(schema));
}

function getUnknownQuery<TSchema extends QuerySchema>(
  schema: TSchema,
  query: QueryObject,
): QueryObject {
  const schemaKeySet = getSchemaKeySet(schema);
  const result: QueryObject = {};

  for (const key of Object.keys(query)) {
    if (!schemaKeySet.has(key)) {
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
  const schemaKeys = Object.keys(schema) as Array<keyof TSchema>;

  for (const key of schemaKeys) {
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
  const schemaKeys = Object.keys(schema) as Array<keyof TSchema>;

  for (const key of schemaKeys) {
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
  const schemaKeySet = getSchemaKeySet(schema);
  const removedKeySet = new Set<string>(keys as readonly string[]);
  const result: QueryObject = {};

  for (const key of Object.keys(currentQuery)) {
    const isSchemaKey = schemaKeySet.has(key);

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
