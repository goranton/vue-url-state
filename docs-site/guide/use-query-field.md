# useQueryField

`useQueryField(query, key, options?)` returns a writable computed ref for one field.

```ts
import { useQueryField } from '@goranton/vue-url-state';

const search = useQueryField(query, 'search', {
  resetOnChange: { page: 1 },
});
```

## Typical use

- Bind directly with `v-model`
- Use `resetOnChange` to reset related fields
- Use `onError` to observe fire-and-forget failures

## Caveat

`useQueryField` is fire-and-forget.  
For awaited/controlled async flows, call `query.patch()` directly.
