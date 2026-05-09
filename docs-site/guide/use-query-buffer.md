# useQueryBuffer

`useQueryBuffer(query, options?)` supports apply-mode editing.

```ts
import { useQueryBuffer } from '@goranton/vue-url-state';

const buffer = useQueryBuffer(query);
buffer.patch({ search: 'anton' });
await buffer.apply();
```

## Exposed state

- `draft`
- `applied`
- `isDirty`

## Actions

- `patch(values)`
- `apply(options?)`
- `reset()`
- `clear()`

## syncOnExternalChange

- `when-clean` (default)
- `always`
- `never`
