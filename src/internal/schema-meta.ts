import type { QuerySchema } from '../types';

type SchemaMeta<TSchema extends QuerySchema> = {
  keys: readonly (keyof TSchema)[];
  keySet: ReadonlySet<string>;
};

const schemaMetaCache = new WeakMap<QuerySchema, SchemaMeta<QuerySchema>>();

export function getSchemaMeta<TSchema extends QuerySchema>(schema: TSchema): SchemaMeta<TSchema> {
  const cached = schemaMetaCache.get(schema as QuerySchema);
  if (cached) {
    return cached as SchemaMeta<TSchema>;
  }

  const keys = Object.keys(schema) as Array<keyof TSchema>;
  const meta: SchemaMeta<TSchema> = {
    keys,
    keySet: new Set<string>(keys as string[]),
  };

  schemaMetaCache.set(schema as QuerySchema, meta as SchemaMeta<QuerySchema>);
  return meta;
}
