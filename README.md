# vue-url-state

Type-safe URL query state management for Vue and Nuxt.

```ts
import {
  arrayParam,
  defineQuerySchema,
  enumParam,
  numberParam,
  stringParam,
} from 'vue-url-state';

const schema = defineQuerySchema({
  search: stringParam(),
  page: numberParam({ defaultValue: 1 }),
  status: enumParam(['active', 'blocked', 'pending'] as const),
  tags: arrayParam(stringParam()),
});
```

This project is in an early stage and the API may evolve.