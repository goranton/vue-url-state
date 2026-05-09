# Pure Helpers

Framework-agnostic helpers work without Vue or Vue Router.

## deserializeQuery

```ts
import { deserializeQuery } from '@goranton/vue-url-state';

const state = deserializeQuery(schema, {
  page: '2',
  status: 'active',
});
```

## serializeQuery

```ts
import { serializeQuery } from '@goranton/vue-url-state';

const raw = serializeQuery(schema, {
  search: 'anton',
  page: 1,
});
```

## Mutation helpers

- `patchQuery(schema, currentQuery, patch, options?)`
- `removeQueryKeys(schema, currentQuery, keys, options?)`
- `resetQuery(schema, currentQuery, options?)`

These helpers are useful in framework adapters and custom integrations.