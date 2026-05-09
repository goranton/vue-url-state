# Examples

## Table filters

```ts
import {
  arrayParam,
  booleanParam,
  defineQuerySchema,
  enumParam,
  numberParam,
  stringParam,
  useQueryState,
} from '@goranton/vue-url-state';

const usersQuerySchema = defineQuerySchema({
  search: stringParam(),
  page: numberParam({ defaultValue: 1, integer: true, min: 1 }),
  status: enumParam(['active', 'blocked', 'pending'] as const),
  tags: arrayParam(stringParam()),
  onlyWithErrors: booleanParam(),
});

const query = useQueryState(usersQuerySchema);

// Current typed state
query.state.value;

// Update filters and reset page
await query.patch({
  search: 'anton',
  status: 'active',
  page: 1,
});
```

## Pagination

```ts
await query.patch({
  page: query.state.value.page + 1,
});
```

- `page` uses `defaultValue: 1`
- `page=1` is removed from URL by default (`cleanDefaults: true`)

## Debounced search

```ts
import { useDebouncedQueryField } from '@goranton/vue-url-state';

const search = useDebouncedQueryField(query, 'search', {
  debounce: 300,
  resetOnChange: {
    page: 1,
  },
});
```

- Local value updates immediately
- URL updates after debounce
- Good for search inputs
- Use `onError` for fire-and-forget failures
- Use `query.patch()` for awaited flow

## Apply-mode filters

```ts
import { useQueryBuffer } from '@goranton/vue-url-state';

const buffer = useQueryBuffer(query);

buffer.patch({ status: 'active' });

if (buffer.isDirty.value) {
  await buffer.apply();
}
```

- Draft changes stay local
- `apply()` writes to URL
- `reset()` discards local changes
- `clear()` resets to default/empty state

## Status tabs

```ts
await query.patch(
  { status: 'active', page: 1 },
  { history: 'push' },
);
```

- `history: 'replace'` is default
- `history: 'push'` is useful for tab-like navigation where browser Back matters

## Preserve unknown params

Example URL:

```txt
/users?utm_source=twitter&page=2
```

- Unknown params are preserved by default
- Use `preserveUnknown: false` to drop them

## Which helper should I use?


| Helper                   | Best for                                     |
| ------------------------ | -------------------------------------------- |
| `useQueryState`          | Base URL state and explicit query operations |
| `useQueryField`          | Immediate `v-model` updates                  |
| `useDebouncedQueryField` | Debounced search/input fields                |
| `useQueryBuffer`         | Apply button / filter forms                  |
| Pure helpers             | Framework-agnostic query handling            |


