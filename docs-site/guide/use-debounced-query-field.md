# useDebouncedQueryField

`useDebouncedQueryField(query, key, options?)` is a debounced field ref for frequent updates like search input.

```ts
import { useDebouncedQueryField } from '@goranton/vue-url-state';

const search = useDebouncedQueryField(query, 'search', {
  debounce: 300,
  resetOnChange: { page: 1 },
});
```

## Options

- `debounce` (default `300`)
- `resetOnChange`
- `onError`
- query patch options (`history`, `preserveUnknown`, `cleanDefaults`)

## When to use

- Use `useDebouncedQueryField` for search-like inputs
- Use `useQueryField` for immediate updates
- Use `useQueryBuffer` for explicit Apply flows
