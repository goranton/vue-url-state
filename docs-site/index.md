# vue-url-state

Type-safe URL query state management for Vue and Nuxt.

```bash
npm install @goranton/vue-url-state
```

```ts
import {
  defineQuerySchema,
  numberParam,
  stringParam,
} from '@goranton/vue-url-state';

const usersQuerySchema = defineQuerySchema({
  search: stringParam(),
  page: numberParam({ defaultValue: 1 }),
});
```

```ts
import { useQueryState } from '@goranton/vue-url-state';

const query = useQueryState(usersQuerySchema);
await query.patch({ search: 'anton', page: 1 });
```

## Guide

- [Getting Started](/guide/getting-started)
- [Schema and Params](/guide/schema)
- [useQueryState](/guide/use-query-state)
- [useQueryField](/guide/use-query-field)
- [useDebouncedQueryField](/guide/use-debounced-query-field)
- [useQueryBuffer](/guide/use-query-buffer)
- [Pure Helpers](/guide/pure-helpers)

