import type { QuerySchema } from './types';

export type { InferQuerySchema, QuerySchema } from './types';

export function defineQuerySchema<const TSchema extends QuerySchema>(schema: TSchema): TSchema {
  return schema;
}

/*
Type-level usage example:

const schema = defineQuerySchema({
  search: stringParam(),
  page: numberParam({ defaultValue: 1 }),
  status: enumParam(['active', 'blocked', 'pending'] as const),
  tags: arrayParam(stringParam()),
  onlyWithErrors: booleanParam(),
});

type State = InferQuerySchema<typeof schema>;
*/
