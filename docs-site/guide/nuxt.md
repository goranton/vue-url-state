# Nuxt usage

`@goranton/vue-url-state` does not require a Nuxt module.  
It works in Nuxt because Nuxt uses Vue Router under the hood.

Use the composables on the client side in components/pages where route/router context exists.

For SSR-sensitive code, avoid reading browser-only APIs directly.  
Core query-state logic in this package does not depend on `window` or `localStorage`.

## Install

```bash
npm install @goranton/vue-url-state
```

Peer dependencies:

- Vue 3
- Vue Router 4

In Nuxt projects, these are already provided by Nuxt.

## Basic Nuxt page example

`pages/users.vue`

```vue
<script setup lang="ts">
import {
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
});

const query = useQueryState(usersQuerySchema);

const setSearch = async () => {
  await query.patch({
    search: 'anton',
    page: 1,
  });
};
</script>

<template>
  <pre>{{ query.state }}</pre>
  <button @click="setSearch">Search Anton</button>
</template>
```

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

- Good for search inputs
- Local input value updates immediately
- URL updates after debounce delay
- Use `onError` for fire-and-forget error handling
- Use `query.patch()` directly when awaited flow is needed

## Apply-mode filters

```ts
import { useQueryBuffer } from '@goranton/vue-url-state';

const buffer = useQueryBuffer(query);

buffer.patch({ status: 'active' });
await buffer.apply();
```

- Draft changes stay local
- URL updates only after `apply()`
- Good for filter panels and forms

## Pagination

```ts
await query.patch({ page: query.state.value.page + 1 });
```

- Default page `1` is cleaned from URL by default
- Changing filters can reset page to `1` via `resetOnChange` or manual `patch`

## Notes

- Unknown query params are preserved by default
- Default values are cleaned by default
- Default history mode is `replace`
- Use `{ history: 'push' }` for tab-like navigation when browser Back behavior matters

