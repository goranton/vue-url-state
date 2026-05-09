# Schema and Params

`defineQuerySchema()` creates a typed contract for query state.

```ts
import {
  arrayParam,
  booleanParam,
  defineQuerySchema,
  enumParam,
  numberParam,
  stringParam,
} from '@goranton/vue-url-state';

const schema = defineQuerySchema({
  search: stringParam(),
  page: numberParam({ defaultValue: 1, integer: true, min: 1 }),
  status: enumParam(['active', 'blocked', 'pending'] as const),
  tags: arrayParam(stringParam()),
  onlyWithErrors: booleanParam(),
});
```

## Default-aware inference

- No `defaultValue` -> `T | undefined`
- With `defaultValue` -> `T`

## Param builders

- `stringParam(options?)`
- `numberParam(options?)`
- `booleanParam(options?)`
- `enumParam(values, options?)`
- `arrayParam(itemParam, options?)`
